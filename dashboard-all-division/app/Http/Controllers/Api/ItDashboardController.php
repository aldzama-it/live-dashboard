<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItAsset;
use App\Models\ItEmail;
use App\Models\ItTicket;
use App\Models\ItTicketKeyword;
use App\Services\AccurateApiService;
use App\Services\AssetApiService;
use App\Services\TicketingApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ItDashboardController extends Controller
{
    protected $accurateApi;
    protected $ticketingApi;
    protected $assetApi;

    public function __construct(AccurateApiService $accurateApi, TicketingApiService $ticketingApi, AssetApiService $assetApi)
    {
        $this->accurateApi = $accurateApi;
        $this->ticketingApi = $ticketingApi;
        $this->assetApi = $assetApi;
    }

    public function getAssets(Request $request)
    {
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        // 1. Jika API Asset terkonfigurasi, ambil data live
        if ($this->assetApi->isConfigured()) {
            try {
                $liveData = $this->assetApi->getDashboardAssetsData($isRefresh);
                return response()->json([
                    'status' => 'success',
                    'data' => $liveData,
                ]);
            } catch (\Exception $e) {
                Log::warning('Asset API live fetch failed, fallback to local DB: ' . $e->getMessage());
            }
        }

        // 2. Fallback: Hitung dari database lokal (it_assets)
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
                'general' => $generalAssets,
                'individual' => $individualAssets,
                'general_assets' => $generalAssets,
                'individual_assets' => $individualAssets,
            ]
        ]);
    }

    public function getEmails(Request $request)
    {
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        // 1. Jika API Asset terkonfigurasi, ambil data live email
        if ($this->assetApi->isConfigured()) {
            try {
                $liveEmails = $this->assetApi->getDashboardEmailsData($isRefresh);
                $domainCounts = [];
                foreach ($liveEmails as $e) {
                    $d = $e['domain'] ?? 'Unknown';
                    $domainCounts[$d] = ($domainCounts[$d] ?? 0) + 1;
                }
                $distribution = [];
                foreach ($domainCounts as $dom => $cnt) {
                    $distribution[] = ['domain' => $dom, 'total' => $cnt];
                }

                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'total' => count($liveEmails),
                        'distribution' => $distribution,
                        'details' => $liveEmails,
                        'emails' => $liveEmails,
                    ]
                ]);
            } catch (\Exception $e) {
                Log::warning('Asset API live fetch emails failed, fallback to local DB: ' . $e->getMessage());
            }
        }

        // 2. Fallback: Hitung dari database lokal (it_emails)
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
                'details' => $emails,
                'emails' => $emails,
            ]
        ]);
    }

    public function getTickets(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        // 1. Jika API Ticketing sudah dikonfigurasi, gunakan data live dari endpoint API
        if ($this->ticketingApi->isConfigured()) {
            try {
                $liveData = $this->ticketingApi->getDashboardTicketsData($startDate, $endDate, $isRefresh);
                return response()->json([
                    'status' => 'success',
                    'data'   => $liveData,
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Ticketing API live fetch failed, fallback to local DB: ' . $e->getMessage());
            }
        }

        // 2. Fallback: Hitung dari database lokal (it_tickets)
        $applyDateFilter = function ($query) use ($startDate, $endDate) {
            if (!empty($startDate) && !empty($endDate)) {
                $query->whereBetween('created_at', [$startDate, $endDate]);
            }
            return $query;
        };

        // Tickets by Category (for Donut Chart)
        $ticketsByCategory = $applyDateFilter(ItTicket::query())
            ->select('category', DB::raw('count(*) as total'))
            ->whereNotNull('category')
            ->groupBy('category')
            ->orderBy('total', 'desc')
            ->get();

        // Workload Calculation
        $workload = $applyDateFilter(ItTicket::query())
            ->select('assigned_to', DB::raw('count(*) as total_tickets'))
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->orderBy('total_tickets', 'desc')
            ->get();

        // Resolution Time (Simple Avg calculation - usually you'd do DB level timediff but keeping it basic for now)
        $tickets = $applyDateFilter(ItTicket::query())
            ->whereNotNull('resolved_at')
            ->get();
        
        $totalMinutes = 0;
        $resolvedCount = $tickets->count();
        
        foreach($tickets as $t) {
            $created = \Carbon\Carbon::parse($t->created_at);
            $resolved = \Carbon\Carbon::parse($t->resolved_at);
            // abs() untuk menghindari nilai negatif jika ada data entry error (resolved_at < created_at)
            $totalMinutes += abs($resolved->diffInMinutes($created));
        }
        
        $avgMinutes = $resolvedCount > 0 ? ($totalMinutes / $resolvedCount) : 0;
        $avgHours = floor($avgMinutes / 60);
        $avgMins = $avgMinutes % 60;
        $resolutionTimeStr = "{$avgHours}h {$avgMins}m";

        $statusBreakdown = $applyDateFilter(ItTicket::query())
            ->select('status', DB::raw('count(*) as total'))
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
            
            // Resolution (per exact date)
            $dateKey = $created->format('Y-m-d');
            $resolved = \Carbon\Carbon::parse($t->resolved_at);
            $minutes = abs($resolved->diffInMinutes($created));
            
            if(!isset($dailyResolution[$dateKey])) {
                $dailyResolution[$dateKey] = ['total_minutes' => 0, 'count' => 0];
            }
            $dailyResolution[$dateKey]['total_minutes'] += $minutes;
            $dailyResolution[$dateKey]['count'] += 1;
            
            // Volume (per day of week 1-7)
            $dayOfWeek = $created->format('N');
            $weeklyVolume[$dayOfWeek] += 1;
        }

        $dailyResolutionData = [];
        $dailyResolutionLabels = [];
        if (empty($startDate) || empty($endDate)) {
            $end = \Carbon\Carbon::now();
            $start = \Carbon\Carbon::now()->subDays(13);
        } else {
            $start = \Carbon\Carbon::parse($startDate);
            $end = \Carbon\Carbon::parse($endDate);
        }
        
        // Loop from start day to end day
        for($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dateKey = $date->format('Y-m-d');
            $dailyResolutionLabels[] = $date->format('d M');
            // Resolution
            if(isset($dailyResolution[$dateKey])) {
                $avgMin = $dailyResolution[$dateKey]['total_minutes'] / $dailyResolution[$dateKey]['count'];
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

        $allTickets = $applyDateFilter(ItTicket::query())->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'avg_resolution_time'    => $resolutionTimeStr,
                'total_resolved'         => $resolvedCount,
                'categories'             => $ticketsByCategory,
                'workload'               => $workload,
                'status_breakdown'       => $statusBreakdown,
                'daily_resolution_time'   => $dailyResolutionData,
                'daily_resolution_labels' => $dailyResolutionLabels,
                'daily_ticket_volume'     => $dailyVolumeData,
                'raw_tickets'            => $allTickets,
                'is_live'                => false,
                'has_token'              => $this->ticketingApi->isConfigured(),
            ]
        ]);
    }

    public function getBudget(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        $year = $startDate ? Carbon::parse($startDate)->year : (int)date('Y');
        $start = $startDate ? Carbon::parse($startDate) : Carbon::create($year, 1, 1);
        $end = $endDate ? Carbon::parse($endDate) : Carbon::create($year, 12, 31);

        $cacheKey = 'it_budget_accurate_6211_' . md5(($startDate ?: 'overtime') . '_' . ($endDate ?: 'overtime') . '_' . $year);
        if ($isRefresh) {
            Cache::forget($cacheKey);
        }

        $result = Cache::remember($cacheKey, 300, function () use ($startDate, $endDate, $start, $end, $year) {
            $monthsMap = [1=>'Januari', 2=>'Februari', 3=>'Maret', 4=>'April', 5=>'Mei', 6=>'Juni', 7=>'Juli', 8=>'Agustus', 9=>'September', 10=>'Oktober', 11=>'November', 12=>'Desember'];

            // 1. Fetch Budget Allocation from DB (it_budgets)
            $monthsToFetch = [];
            for ($d = $start->copy(); $d->lte($end); $d->addMonth()) {
                $monthsToFetch[] = $monthsMap[$d->month];
            }
            if (!in_array($monthsMap[$end->month], $monthsToFetch)) {
                $monthsToFetch[] = $monthsMap[$end->month];
            }

            // Total budget tahunan IT ditetapkan manajemen: Rp 768.840.000
            $annualBudget = 768840000.0;
            $totalBudget = $annualBudget;

            $budgets = \App\Models\ItBudget::where('year', $year)->get();

            // 2. Fetch Accurate mutations for Account 6211
            $fromDateAccurate = '01/01/' . $year;
            $toDateAccurate = '31/12/' . $year;

            $resp = $this->accurateApi->get('/accurate/api/glaccount/history.do', [
                'no' => '6211',
                'fromDate' => $fromDateAccurate,
                'toDate' => $toDateAccurate,
            ]);

            $rawMutations = (isset($resp['s']) && $resp['s'] === true) ? ($resp['d'] ?? []) : [];

            // Helper to categorize mutation
            $categorize = function ($desc, $transactionType) {
                $descLower = strtolower($desc ?? '');
                $ttLower = strtolower($transactionType ?? '');

                // 1. Operational: Internet fisik & utilitas jaringan (wifi, internet, biznet, starlink, pulsa, dll)
                if (preg_match('/(wifi|internet|biznet|starlink|pulsa|kuota|jamuan|konsumsi|bonding)/i', $descLower)) {
                    return 'Operational';
                }
                // 2. Maintenance: Perbaikan & servis
                if (preg_match('/(service|perbaikan|maintenance|repair|servis)/i', $descLower)) {
                    return 'Maintenance';
                }
                // 3. Asset: Hardware & barang fisik
                if (preg_match('/(mouse|cctv|cooling pad|laptop|charger|ht|keyboard|pc|hardware|adaptor|converter|stiker aset|konector|rj45|pekerjaan pesanan)/i', $descLower . ' ' . $ttLower)) {
                    return 'Asset';
                }
                // 4. Subscription: Khusus Software, SaaS, Cloud & Lisensi digital
                if (preg_match('/(software|accurate|zoom|google|chatgpt|chat gpt|gdrive|hostinger|canva|claude|office|microsoft|license|lisensi|vps|domain|email|mailbox|get contact)/i', $descLower)) {
                    return 'Subscription';
                }
                return 'Operational';
            };

            // Process mutations
            $allYearExpenses = [];
            $filteredExpenses = [];
            $totalUsed = 0.0;

            foreach ($rawMutations as $idx => $m) {
                $transDate = $m['transDate'] ?? null;
                $debit = (float)($m['debitAmount'] ?? $m['amount'] ?? 0);
                $credit = (float)($m['creditAmount'] ?? 0);
                $netAmount = $debit - $credit; // Beban = Debit - Kredit

                if ($netAmount == 0) continue;

                $grpCat = $categorize($m['description'] ?? '', $m['transactionTypeName'] ?? '');

                $itemData = [
                    'id' => $m['transId'] ?? ($m['journalDetailId'] ?? ($idx + 1)),
                    'expense_date' => $transDate,
                    'trans_number' => $m['transNumber'] ?? '-',
                    'description' => $m['description'] ?? '-',
                    'transaction_type' => $m['transactionTypeName'] ?? 'Lainnya',
                    'group_category' => $grpCat,
                    'amount' => $netAmount,
                    'source' => 'accurate_6211'
                ];

                $allYearExpenses[] = $itemData;

                // Filter by date range
                if ($transDate && $transDate >= $startDate && $transDate <= $endDate) {
                    $filteredExpenses[] = $itemData;
                    $totalUsed += $netAmount;
                }
            }

            // Sort filtered expenses descending by date
            usort($filteredExpenses, function ($a, $b) {
                return strcmp($b['expense_date'] ?? '', $a['expense_date'] ?? '');
            });

            // 3. Category Breakdown (Matching budget categories with Accurate expenses)
            $categoryMap = [];
            foreach ($budgets as $b) {
                if (!isset($categoryMap[$b->category])) {
                    $categoryMap[$b->category] = [
                        'category' => $b->category,
                        'allocated' => 0,
                        'used' => 0
                    ];
                }
                $categoryMap[$b->category]['allocated'] += (float)$b->allocated_amount;
            }

            foreach ($filteredExpenses as $e) {
                $desc = strtolower($e['description'] ?? '');
                $amt = $e['amount'];
                $matched = false;

                if (strpos($desc, 'accurate') !== false && isset($categoryMap['Pembayaran accurate system'])) {
                    $categoryMap['Pembayaran accurate system']['used'] += $amt;
                    $matched = true;
                } elseif (strpos($desc, 'mouse') !== false && isset($categoryMap['Mouse'])) {
                    $categoryMap['Mouse']['used'] += $amt;
                    $matched = true;
                } elseif (strpos($desc, 'cctv') !== false && isset($categoryMap['CCTV'])) {
                    $categoryMap['CCTV']['used'] += $amt;
                    $matched = true;
                } elseif (strpos($desc, 'zoom') !== false && isset($categoryMap['Zoom Meeting'])) {
                    $categoryMap['Zoom Meeting']['used'] += $amt;
                    $matched = true;
                } elseif ((strpos($desc, 'google') !== false || strpos($desc, 'gdrive') !== false) && isset($categoryMap['Berlangganan google Drive'])) {
                    $categoryMap['Berlangganan google Drive']['used'] += $amt;
                    $matched = true;
                } elseif (strpos($desc, 'office') !== false && isset($categoryMap['Microsoft Office'])) {
                    $categoryMap['Microsoft Office']['used'] += $amt;
                    $matched = true;
                } elseif ((strpos($desc, 'internet') !== false || strpos($desc, 'wifi') !== false || strpos($desc, 'biznet') !== false || strpos($desc, 'starlink') !== false) && isset($categoryMap['Internet dan PABX'])) {
                    $categoryMap['Internet dan PABX']['used'] += $amt;
                    $matched = true;
                } elseif ((strpos($desc, 'hostinger') !== false || strpos($desc, 'domain') !== false) && isset($categoryMap['VPS, Server Email, dan Domain'])) {
                    $categoryMap['VPS, Server Email, dan Domain']['used'] += $amt;
                    $matched = true;
                }

                if (!$matched) {
                    $otherKey = 'Operasional & Hardware Lainnya';
                    if (!isset($categoryMap[$otherKey])) {
                        $categoryMap[$otherKey] = [
                            'category' => $otherKey,
                            'allocated' => 0,
                            'used' => 0
                        ];
                    }
                    $categoryMap[$otherKey]['used'] += $amt;
                }
            }

            $categoryBreakdown = array_values($categoryMap);
            usort($categoryBreakdown, function ($a, $b) {
                return ($b['allocated'] + $b['used']) <=> ($a['allocated'] + $a['used']);
            });

            // Top expenses
            $topExpenses = array_slice($filteredExpenses, 0, 5);

            // 4. Monthly Trend (Line & Bar chart)
            $monthlyTrend = [];
            $trendStart = $start->copy();
            $trendEnd = $end->copy();

            if ($start->diffInMonths($end) < 2) {
                // If single month range selected, show all 12 months of the year for complete trend
                $trendStart = Carbon::createFromDate($year, 1, 1);
                $trendEnd = Carbon::createFromDate($year, 12, 31);
            }

            $cursor = $trendStart->copy();
            while ($cursor->lte($trendEnd)) {
                $key = $monthsMap[$cursor->month] . ' ' . $cursor->year;
                $monthlyTrend[$key] = [
                    'month' => $key,
                    'month_num' => $cursor->format('Y-m'),
                    'Asset' => 0,
                    'Subscription' => 0,
                    'Maintenance' => 0,
                    'Operational' => 0,
                    'Total' => 0
                ];
                $cursor->addMonth();
            }

            foreach ($allYearExpenses as $e) {
                if (empty($e['expense_date'])) continue;
                $expCarbon = Carbon::parse($e['expense_date']);
                $mKey = $monthsMap[$expCarbon->month] . ' ' . $expCarbon->year;
                if (isset($monthlyTrend[$mKey])) {
                    $grp = $e['group_category'] ?? 'Operational';
                    $monthlyTrend[$mKey][$grp] += $e['amount'];
                    $monthlyTrend[$mKey]['Total'] += $e['amount'];
                }
            }

            $totalYearUsed = 0.0;
            foreach ($allYearExpenses as $e) {
                $totalYearUsed += (float)$e['amount'];
            }

            $displayExpenses = count($filteredExpenses) > 0 ? $filteredExpenses : $allYearExpenses;

            return [
                'total_budget' => $totalBudget,
                'total_used' => $totalYearUsed,
                'period_used' => $totalUsed,
                'ytd_used' => $totalYearUsed,
                'breakdown' => array_slice($categoryBreakdown, 0, 10),
                'top_expenses' => count($topExpenses) > 0 ? $topExpenses : array_slice($allYearExpenses, 0, 5),
                'monthly_trend' => array_values($monthlyTrend),
                'raw_expenses' => array_slice($displayExpenses, 0, 100),
                'account_info' => [
                    'no' => '6211',
                    'name' => 'IT (Internet, Software, Server, dll)',
                    'source' => 'Accurate Online Cloud API'
                ]
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $result
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

    public function getHighlights(Request $request)
    {
        // By default fetch for the current month and year
        $monthName = \Carbon\Carbon::now()->translatedFormat('F'); // e.g. Agustus
        $year = date('Y');

        // You could also accept month and year from request query if needed
        $month = $request->query('month', $monthName);
        $yr = $request->query('year', $year);

        $highlights = \App\Models\ItHighlight::where('month', $month)
            ->where('year', $yr)
            ->get();

        // If not found for current month, maybe fallback to latest available?
        if ($highlights->isEmpty()) {
            $latestHighlight = \App\Models\ItHighlight::orderBy('year', 'desc')->orderBy('month', 'desc')->first();
            if ($latestHighlight) {
                $highlights = \App\Models\ItHighlight::where('month', $latestHighlight->month)
                    ->where('year', $latestHighlight->year)
                    ->get();
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $highlights
        ]);
    }

    public function syncSynology()
    {
        try {
            // 1. Sinkronisasi Synology
            \Illuminate\Support\Facades\Artisan::call('synology:sync');
            
            // 2. Sinkronisasi Asset API v1 (Aset Fisik & Email)
            $assetSyncResult = null;
            if ($this->assetApi->isConfigured()) {
                try {
                    $assetSyncResult = $this->assetApi->syncToDatabase();
                } catch (\Exception $ae) {
                    Log::warning('Asset sync during All sync failed: ' . $ae->getMessage());
                }
            }

            // 3. Sinkronisasi Ticketing API
            $ticketSyncResult = null;
            if ($this->ticketingApi->isConfigured()) {
                try {
                    $startDate = date('Y-m-01');
                    $endDate = date('Y-m-t');
                    $ticketSyncResult = $this->ticketingApi->syncToDatabase([
                        'date_from' => $startDate,
                        'date_to'   => $endDate,
                    ]);
                    Cache::forget('it_dashboard_live_tickets_' . md5($startDate . '_' . $endDate));
                } catch (\Exception $te) {
                    Log::warning('Ticket sync during All sync failed: ' . $te->getMessage());
                }
            }

            $messages = ['Data Synology disinkronkan'];
            if ($assetSyncResult) {
                $messages[] = "{$assetSyncResult['synced_assets']} aset fisik & {$assetSyncResult['synced_emails']} email disinkronkan";
            }
            if ($ticketSyncResult && isset($ticketSyncResult['synced'])) {
                $messages[] = "{$ticketSyncResult['synced']} tiket disinkronkan";
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Sinkronisasi berhasil! (' . implode(', ', $messages) . ')',
                'output' => \Illuminate\Support\Facades\Artisan::output(),
                'asset_sync' => $assetSyncResult,
                'ticket_sync' => $ticketSyncResult,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sync failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function syncAssets(Request $request)
    {
        if (!$this->assetApi->isConfigured()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'ASSET_API_HOST atau ASSET_API_V1_TOKEN belum dikonfigurasi di .env.',
            ], 400);
        }

        try {
            $result = $this->assetApi->syncToDatabase();
            return response()->json([
                'status'  => 'success',
                'message' => "Sinkronisasi berhasil! {$result['synced_assets']} aset fisik dan {$result['synced_emails']} email telah disinkronkan ke database lokal.",
                'data'    => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menyinkronkan data aset: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function syncTickets(Request $request)
    {
        if (!$this->ticketingApi->isConfigured()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'TICKETING_API_HOST atau TICKETING_INTEGRATION_TOKEN belum dikonfigurasi di .env.',
            ], 400);
        }

        $startDate = $request->input('start_date', $request->query('start_date', date('Y-m-01')));
        $endDate = $request->input('end_date', $request->query('end_date', date('Y-m-t')));

        try {
            $result = $this->ticketingApi->syncToDatabase([
                'date_from' => $startDate,
                'date_to'   => $endDate,
            ]);

            // Bersihkan cache agar request data tiket berikutnya langsung membaca data terupdate
            Cache::forget('it_dashboard_live_tickets_' . md5($startDate . '_' . $endDate));

            return response()->json([
                'status'  => 'success',
                'message' => $result['message'],
                'data'    => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menyinkronkan data tiket: ' . $e->getMessage(),
            ], 500);
        }
    }
}

