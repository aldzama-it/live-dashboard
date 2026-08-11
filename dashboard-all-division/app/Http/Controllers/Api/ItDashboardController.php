<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItAsset;
use App\Models\ItEmail;
use App\Models\ItTicket;
use App\Models\ItTicketKeyword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItDashboardController extends Controller
{
    public function getAssets(Request $request)
    {
        $generalAssets = ItAsset::where('type', 'general')->get();
        $individualAssets = ItAsset::where('type', 'individual')->get();

        $totalAssets = ItAsset::count();
        $totalGeneral = $generalAssets->count();
        $totalIndividual = $individualAssets->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total' => $totalAssets,
                'total_general' => $totalGeneral,
                'total_individual' => $totalIndividual,
                'general_assets' => $generalAssets,
                'individual_assets' => $individualAssets,
            ]
        ]);
    }

    public function getEmails(Request $request)
    {
        $emails = ItEmail::all();
        $totalEmails = $emails->count();
        
        $domainDistribution = ItEmail::select('domain', DB::raw('count(*) as total'))
            ->groupBy('domain')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total' => $totalEmails,
                'distribution' => $domainDistribution,
                'details' => $emails
            ]
        ]);
    }

    public function getTickets(Request $request)
    {
        $startDate = $request->query('start_date', date('Y-m-01'));
        $endDate = $request->query('end_date', date('Y-m-t'));

        // Tickets by Category (for Donut Chart)
        $ticketsByCategory = ItTicket::select('category', DB::raw('count(*) as total'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('category')
            ->groupBy('category')
            ->orderBy('total', 'desc')
            ->get();

        // Workload Calculation
        $workload = ItTicket::select('assigned_to', DB::raw('count(*) as total_tickets'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->orderBy('total_tickets', 'desc')
            ->get();

        // Resolution Time (Simple Avg calculation - usually you'd do DB level timediff but keeping it basic for now)
        $tickets = ItTicket::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('resolved_at')
            ->get();
        
        $totalMinutes = 0;
        $resolvedCount = $tickets->count();
        
        foreach($tickets as $t) {
            $created = \Carbon\Carbon::parse($t->created_at);
            $resolved = \Carbon\Carbon::parse($t->resolved_at);
            $totalMinutes += $resolved->diffInMinutes($created);
        }
        
        $avgMinutes = $resolvedCount > 0 ? ($totalMinutes / $resolvedCount) : 0;
        $avgHours = floor($avgMinutes / 60);
        $avgMins = $avgMinutes % 60;
        $resolutionTimeStr = "{$avgHours}h {$avgMins}m";

        $statusBreakdown = ItTicket::select('status', DB::raw('count(*) as total'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('status')
            ->get();

        // Daily Resolution & Volume
        $dailyResolution = [];
        $weeklyVolume = [
            1 => 0, // Senin
            2 => 0, // Selasa
            3 => 0, // Rabu
            4 => 0, // Kamis
            5 => 0, // Jumat
            6 => 0, // Sabtu
            7 => 0  // Minggu
        ];
        
        foreach($tickets as $t) {
            $created = \Carbon\Carbon::parse($t->created_at);
            
            // Resolution (per day of month)
            $dayOfMonth = $created->format('j');
            $resolved = \Carbon\Carbon::parse($t->resolved_at);
            $minutes = $resolved->diffInMinutes($created);
            
            if(!isset($dailyResolution[$dayOfMonth])) {
                $dailyResolution[$dayOfMonth] = ['total_minutes' => 0, 'count' => 0];
            }
            $dailyResolution[$dayOfMonth]['total_minutes'] += $minutes;
            $dailyResolution[$dayOfMonth]['count'] += 1;
            
            // Volume (per day of week 1-7)
            $dayOfWeek = $created->format('N');
            $weeklyVolume[$dayOfWeek] += 1;
        }

        $dailyResolutionData = [];
        $dailyResolutionLabels = [];
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        
        // Loop from start day to end day (just using days in that span)
        // If range spans multiple months, dayOfMonth collision happens, but keeping simple for UI
        for($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dayStr = $date->format('j');
            $dailyResolutionLabels[] = $date->format('d M');
            // Resolution
            if(isset($dailyResolution[$dayStr])) {
                $avgMin = $dailyResolution[$dayStr]['total_minutes'] / $dailyResolution[$dayStr]['count'];
                $dailyResolutionData[] = round($avgMin / 60, 2);
            } else {
                $dailyResolutionData[] = 0;
            }
        }
        
        // Prepare volume data strictly from Mon (1) to Sun (7)
        $dailyVolumeData = [];
        for($i = 1; $i <= 7; $i++) {
            $dailyVolumeData[] = $weeklyVolume[$i];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'avg_resolution_time' => $resolutionTimeStr,
                'total_resolved' => $resolvedCount,
                'categories' => $ticketsByCategory,
                'workload' => $workload,
                'status_breakdown' => $statusBreakdown,
                'daily_resolution_time' => $dailyResolutionData,
                'daily_resolution_labels' => $dailyResolutionLabels,
                'daily_ticket_volume' => $dailyVolumeData
            ]
        ]);
    }
    public function getBudget(Request $request)
    {
        $startDate = $request->query('start_date', date('Y-m-01'));
        $endDate = $request->query('end_date', date('Y-m-t'));

        // Derive month names to filter budget allocations
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        
        $monthsMap = [1=>'Januari', 2=>'Februari', 3=>'Maret', 4=>'April', 5=>'Mei', 6=>'Juni', 7=>'Juli', 8=>'Agustus', 9=>'September', 10=>'Oktober', 11=>'November', 12=>'Desember'];
        $monthsToFetch = [];
        
        for($d = $start->copy(); $d->lte($end); $d->addMonth()) {
            $monthsToFetch[] = $monthsMap[$d->month];
        }
        // In case start and end are in same month but loop doesn't capture it nicely
        if (!in_array($monthsMap[$end->month], $monthsToFetch)) {
            $monthsToFetch[] = $monthsMap[$end->month];
        }

        $budgets = \App\Models\ItBudget::where('year', $start->year)
            ->whereIn('month', $monthsToFetch)
            ->get();

        $expenses = \App\Models\ItBudgetExpense::whereBetween('expense_date', [$startDate, $endDate])->get();

        $totalBudget = $budgets->sum('allocated_amount');
        $totalUsed = $expenses->sum('amount');

        // Breakdown by category (Sum across all months in the year)
        $categoryMap = [];
        foreach($budgets as $b) {
            if (!isset($categoryMap[$b->category])) {
                $categoryMap[$b->category] = [
                    'category' => $b->category,
                    'allocated' => 0,
                    'used' => 0
                ];
            }
            $categoryMap[$b->category]['allocated'] += $b->allocated_amount;
        }

        foreach($expenses as $e) {
            if ($e->budget) {
                $categoryMap[$e->budget->category]['used'] += $e->amount;
            }
        }

        // Sort by allocated descending
        $categoryBreakdown = array_values($categoryMap);
        usort($categoryBreakdown, function($a, $b) {
            return $b['allocated'] <=> $a['allocated'];
        });

        // Take top 5 categories for the chart, group rest into 'Others' if needed, or just return all
        // We'll return all and let frontend decide, or slice top 10
        $topCategories = array_slice($categoryBreakdown, 0, 8);

        // Top 3 expenses
        $topExpenses = $expenses->sortByDesc('amount')->take(3)->values();

        // Monthly trend (Bar + Line chart)
        $monthlyTrend = [];
        $tempStart = $start->copy();
        
        // Build empty framework for all months in range
        while ($tempStart->lte($end)) {
            $key = $monthsMap[$tempStart->month] . ' ' . $tempStart->year;
            $monthlyTrend[$key] = [
                'month' => $key,
                'Asset' => 0,
                'Subscription' => 0,
                'Maintenance' => 0,
                'Operational' => 0,
                'Total' => 0
            ];
            $tempStart->addMonth();
        }
        // Ensure end month is included if loop misses it due to days
        $endKey = $monthsMap[$end->month] . ' ' . $end->year;
        if (!isset($monthlyTrend[$endKey])) {
            $monthlyTrend[$endKey] = [
                'month' => $endKey,
                'Asset' => 0,
                'Subscription' => 0,
                'Maintenance' => 0,
                'Operational' => 0,
                'Total' => 0
            ];
        }

        foreach($expenses as $e) {
            $expDate = \Carbon\Carbon::parse($e->expense_date);
            $mKey = $monthsMap[$expDate->month] . ' ' . $expDate->year;
            if (isset($monthlyTrend[$mKey])) {
                $grp = $e->group_category ?? 'Operational';
                $monthlyTrend[$mKey][$grp] += $e->amount;
                $monthlyTrend[$mKey]['Total'] += $e->amount;
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_budget' => $totalBudget,
                'total_used' => $totalUsed,
                'breakdown' => $topCategories,
                'top_expenses' => $topExpenses,
                'monthly_trend' => array_values($monthlyTrend),
                'raw_expenses' => $expenses->load('budget')->take(50) // for the modal details
            ]
        ]);
    }

    public function getSoftware(Request $request)
    {
        $softwares = \App\Models\ItSoftware::all();
        
        $launched = $softwares->where('status', 'launched')->values();
        $development = $softwares->where('status', 'development')->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => [
                    'launched' => $launched->count(),
                    'development' => $development->count(),
                ],
                'launched_list' => $launched,
                'development_list' => $development
            ]
        ]);
    }
}
