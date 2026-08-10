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
        $month = $request->query('month', date('n'));
        $year = $request->query('year', date('Y'));

        // Keywords for the month (Assuming Python script updates this)
        $keywords = ItTicketKeyword::where('month', $month)
            ->where('year', $year)
            ->orderBy('frequency', 'desc')
            ->limit(5)
            ->get();

        // Workload Calculation
        $workload = ItTicket::select('assigned_to', DB::raw('count(*) as total_tickets'))
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->orderBy('total_tickets', 'desc')
            ->get();

        // Resolution Time (Simple Avg calculation - usually you'd do DB level timediff but keeping it basic for now)
        $tickets = ItTicket::whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
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

        return response()->json([
            'status' => 'success',
            'data' => [
                'avg_resolution_time' => $resolutionTimeStr,
                'total_resolved' => $resolvedCount,
                'keywords' => $keywords,
                'workload' => $workload
            ]
        ]);
    }
}
