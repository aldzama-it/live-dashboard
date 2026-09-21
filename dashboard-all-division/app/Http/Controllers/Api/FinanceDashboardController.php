<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AccurateApiService;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;

class FinanceDashboardController extends Controller
{
    protected $accurateApi;

    public function __construct(AccurateApiService $accurateApi)
    {
        $this->accurateApi = $accurateApi;
    }
    public function getApDashboard(Request $request)
    {
        $asOfDate = $request->query('as_of_date');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Helper closures for filtering dates
        $filterInvoiceDate = function ($query) use ($asOfDate, $startDate, $endDate) {
            if ($asOfDate) {
                $query->where('invoice_date', '<=', $asOfDate);
            } elseif ($startDate && $endDate) {
                $query->whereBetween('invoice_date', [$startDate, $endDate]);
            }
        };

        $filterPaymentDate = function ($query) use ($startDate, $endDate) {
            if ($startDate && $endDate) {
                $query->whereBetween('payment_date', [$startDate, $endDate]);
            }
        };

        // 1. KPI Cards (Outstanding & Overdue)
        $totalOutstanding = \App\Models\ApInvoice::where($filterInvoiceDate)->sum('outstanding_amount');
        
        $agings = \App\Models\ApAging::selectRaw('
            SUM(belum_tempo) as belum_tempo,
            SUM(aging_1_15) as aging_1_15,
            SUM(aging_16_30) as aging_16_30,
            SUM(aging_31_45) as aging_31_45,
            SUM(aging_46_60) as aging_46_60,
            SUM(aging_over_60) as aging_over_60
        ')
        ->where($filterInvoiceDate)
        ->first();

        $totalOverdue = ($agings->aging_1_15 ?? 0) + ($agings->aging_16_30 ?? 0) + ($agings->aging_31_45 ?? 0) + ($agings->aging_46_60 ?? 0) + ($agings->aging_over_60 ?? 0);

        // 2. Aging Chart Data
        $agingChart = [
            ['name' => 'Belum Tempo', 'value' => (float) ($agings->belum_tempo ?? 0)],
            ['name' => '1 - 15 Hari', 'value' => (float) ($agings->aging_1_15 ?? 0)],
            ['name' => '16 - 30 Hari', 'value' => (float) ($agings->aging_16_30 ?? 0)],
            ['name' => '31 - 45 Hari', 'value' => (float) ($agings->aging_31_45 ?? 0)],
            ['name' => '> 60 Hari', 'value' => (float) (($agings->aging_46_60 ?? 0) + ($agings->aging_over_60 ?? 0))],
        ];

        // 3. Top Vendor Outstanding
        $topVendors = \App\Models\ApInvoice::selectRaw('vendor, SUM(outstanding_amount) as total')
            ->where($filterInvoiceDate)
            ->groupBy('vendor')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $item->total = (float) $item->total;
                return $item;
            });

        // 4. Payment Trend (Dynamic Grouping: Daily if same month, Monthly if spans months)
        $paymentQuery = \App\Models\ApPayment::whereNotNull('payment_date')->where($filterPaymentDate);
        $minDate = (clone $paymentQuery)->min('payment_date');
        $maxDate = (clone $paymentQuery)->max('payment_date');

        $isSameMonth = false;
        if ($minDate && $maxDate) {
            $isSameMonth = date('Y-m', strtotime($minDate)) === date('Y-m', strtotime($maxDate));
        }

        Carbon::setLocale('id'); // Ensure Indonesian month names
        if ($isSameMonth) {
            $paymentTrend = (clone $paymentQuery)
                ->selectRaw('DATE_FORMAT(payment_date, "%Y-%m-%d") as period, SUM(payment_amount) as total')
                ->groupBy('period')
                ->orderBy('period', 'asc')
                ->get()
                ->map(function ($item) {
                    $item->total = (float) $item->total;
                    $item->label = Carbon::parse($item->period)->translatedFormat('d M Y');
                    return $item;
                });
            $trendTitle = "Trend Pembayaran (" . Carbon::parse($minDate)->translatedFormat('F Y') . ")";
        } else {
            $paymentTrend = (clone $paymentQuery)
                ->selectRaw('DATE_FORMAT(payment_date, "%Y-%m") as period, SUM(payment_amount) as total')
                ->groupBy('period')
                ->orderBy('period', 'desc')
                ->limit(6)
                ->get()
                ->map(function ($item) {
                    $item->total = (float) $item->total;
                    $item->label = Carbon::parse($item->period . '-01')->translatedFormat('M Y');
                    return $item;
                })
                ->reverse()
                ->values();
            $trendTitle = "Trend Pembayaran (6 Bulan Terakhir)";
        }

        // 5. Invoice List
        $invoices = \App\Models\ApInvoice::where($filterInvoiceDate)->orderByDesc('invoice_date')->get();

        // New KPIs
        $totalUtang30Hari = \App\Models\ApInvoice::where($filterInvoiceDate)->where('age_days', '>', 30)->sum('outstanding_amount');
        
        $pembayaranBulanIniQuery = \App\Models\ApPayment::whereNotNull('payment_date');
        // By default, current month if no filter is provided
        if ($startDate && $endDate) {
            $pembayaranBulanIniQuery->whereBetween('payment_date', [$startDate, $endDate]);
        } else {
            $pembayaranBulanIniQuery->whereMonth('payment_date', date('m'))->whereYear('payment_date', date('Y'));
        }
        $pembayaranBulanIni = $pembayaranBulanIniQuery->sum('payment_amount');

        // Jika DB belum diimpor untuk bulan berjalan, ambil total dari bulan terbaru di DB
        if ($pembayaranBulanIni == 0 && !$startDate && !$endDate) {
            $latestPaymentDate = \App\Models\ApPayment::max('payment_date');
            if ($latestPaymentDate) {
                $pembayaranBulanIni = \App\Models\ApPayment::whereMonth('payment_date', date('m', strtotime($latestPaymentDate)))
                    ->whereYear('payment_date', date('Y', strtotime($latestPaymentDate)))
                    ->sum('payment_amount');
            }
        }

        $vendorTerbesar = \App\Models\ApInvoice::selectRaw('vendor, SUM(outstanding_amount) as total')
            ->where($filterInvoiceDate)
            ->groupBy('vendor')
            ->orderByDesc('total')
            ->first();

        // 6. Ringkasan AP per Mata Uang
        $totalAllCurrency = $totalOutstanding > 0 ? $totalOutstanding : 1; // Prevent div zero
        $ringkasanMataUang = \App\Models\ApInvoice::selectRaw('currency, SUM(outstanding_amount) as total')
            ->where($filterInvoiceDate)
            ->groupBy('currency')
            ->orderByDesc('total')
            ->get()
            ->map(function($item) use ($totalAllCurrency) {
                $currencyMap = [
                    'Indonesian Rupiah' => 'IDR',
                    'US Dollar' => 'USD',
                    'Chinese Yuan Renminbi' => 'CNY',
                    'Singapore Dollar' => 'SGD',
                    'Euro' => 'EUR',
                ];
                $code = $currencyMap[$item->currency] ?? $item->currency;
                return [
                    'currency' => $code,
                    'total' => (float)$item->total,
                    'percentage' => round(($item->total / $totalAllCurrency) * 100, 2)
                ];
            });

        // 7. Peringatan (Alerts)
        $invoiceJatuhTempo = \App\Models\ApInvoice::where($filterInvoiceDate)->where('age_days', '>', 0)->count();
        $invoiceAkanJatuhTempo = \App\Models\ApInvoice::where($filterInvoiceDate)->whereBetween('due_date', [date('Y-m-d'), date('Y-m-d', strtotime('+7 days'))])->count();
        
        $peringatan = [];
        if ($invoiceJatuhTempo > 0) {
            $peringatan[] = [
                'type' => 'danger',
                'message' => "{$invoiceJatuhTempo} Invoice sudah jatuh tempo",
                'sub_message' => 'Total Rp ' . number_format($totalOverdue, 0, ',', '.')
            ];
        }
        if ($invoiceAkanJatuhTempo > 0) {
            $peringatan[] = [
                'type' => 'warning',
                'message' => "{$invoiceAkanJatuhTempo} Invoice akan jatuh tempo dalam 7 hari"
            ];
        }

        // 8. Aktivitas AP Terbaru
        $recentInvoices = \App\Models\ApInvoice::orderByDesc('invoice_date')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->invoice_date,
                    'description' => "Invoice {$item->invoice_no} diterbitkan dari {$item->vendor}",
                    'amount' => (float)$item->total_amount,
                    'type' => 'Pending Approval',
                    'color' => 'warning'
                ];
            });

        $recentPayments = \App\Models\ApPayment::orderByDesc('payment_date')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->payment_date,
                    'description' => "Pembayaran ke {$item->vendor}",
                    'amount' => (float)$item->payment_amount,
                    'type' => 'Completed',
                    'color' => 'success'
                ];
            });
        
        $aktivitasTerbaru = $recentInvoices->concat($recentPayments)->sortByDesc('date')->take(6)->values();

        return response()->json([
            'kpis' => [
                'total_outstanding' => $totalOutstanding,
                'total_overdue' => $totalOverdue,
                'total_utang_30_hari' => $totalUtang30Hari,
                'pembayaran_bulan_ini' => $pembayaranBulanIni,
                'vendor_terbesar' => $vendorTerbesar ? [
                    'name' => $vendorTerbesar->vendor,
                    'total' => (float)$vendorTerbesar->total
                ] : null,
            ],
            'aging_chart' => $agingChart,
            'top_vendors' => $topVendors,
            'payment_trend' => $paymentTrend,
            'payment_trend_title' => $trendTitle,
            'invoices' => $invoices,
            'ringkasan_mata_uang' => $ringkasanMataUang,
            'peringatan' => $peringatan,
            'aktivitas_terbaru' => $aktivitasTerbaru
        ]);
    }

    public function syncSynology()
    {
        try {
            Artisan::call('synology:sync');
            return response()->json([
                'status' => 'success',
                'message' => 'Sync triggered successfully',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sync failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test koneksi ke API Accurate dan ambil Host URL yang valid
     */
    public function testConnection(): JsonResponse
    {
        $response = $this->accurateApi->checkConnection();

        if (isset($response['s']) && $response['s'] === true) {
            return response()->json([
                'status' => 'success',
                'message' => 'Berhasil terkoneksi ke API Accurate',
                'data' => $response['d'] ?? null,
                'application' => $response['application'] ?? null
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Gagal terkoneksi ke API Accurate',
            'error_detail' => $response
        ], 400);
    }

    /**
     * Helper: fetch total primeOwing untuk satu aging bucket berdasarkan filter dueDate.
     */
    private function fetchBucketTotal(array $dueDateFilter): float
    {
        $params = array_merge(['fields' => 'primeOwing', 'sp.pageSize' => 100], $dueDateFilter);

        $total    = 0.0;
        $page     = 1;
        $maxPages = 200; // max 20.000 invoice per bucket

        do {
            $params['sp.page'] = $page;
            $r = $this->accurateApi->get('/accurate/api/purchase-invoice/list.do', $params);
            if (!isset($r['s']) || $r['s'] !== true) break;

            foreach ($r['d'] ?? [] as $inv) {
                $v = (float)($inv['primeOwing'] ?? 0);
                if ($v > 0) $total += $v;
            }

            $totalPages = $r['sp']['pageCount'] ?? 1;
            $page++;
        } while ($page <= $totalPages && $page <= $maxPages);

        return $total;
    }

    /**
     * Data Accounts Payable Live API
     */
    public function getApDashboardApi(Request $request)
    {
        $asOfDate  = $request->query('as_of_date');
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        $cacheKey = 'ap_dashboard_live_api_' . md5(($asOfDate ?? '') . '_' . ($startDate ?? '') . '_' . ($endDate ?? ''));

        if ($isRefresh) {
            Cache::forget($cacheKey);
        }

        $responseData = Cache::remember($cacheKey, 300, function () use ($asOfDate, $startDate, $endDate) {

            $today     = $asOfDate ? Carbon::parse($asOfDate)->startOfDay() : Carbon::now('Asia/Jakarta')->startOfDay();
            $farPast   = '01/01/2000';
            $farFuture = '31/12/2099';
            $fmt       = fn(Carbon $d) => $d->format('d/m/Y');

            // Ambil SEMUA purchase invoices dari Accurate (sekitar 60-100 request)
            $accurateInvoices = [];
            $page  = 1;
            $maxPg = 200; // Cukup untuk 20.000 invoices

            do {
                $r = $this->accurateApi->get('/accurate/api/purchase-invoice/list.do', [
                    'fields'      => 'id,number,vendor,transDate,dueDate,status,currency,totalAmount,primeOwing,rate',
                    'sp.pageSize' => 100,
                    'sp.page'     => $page
                ]);

                if (!isset($r['s']) || $r['s'] !== true) {
                    if ($page === 1) {
                        return [
                            'status'       => 'error',
                            'message'      => 'Gagal mengambil data dari Accurate',
                            'error_detail' => $r,
                        ];
                    }
                    break;
                }

                $accurateInvoices = array_merge($accurateInvoices, $r['d'] ?? []);
                $totalPg = $r['sp']['pageCount'] ?? 1;
                $page++;
            } while ($page <= $totalPg && $page <= $maxPg);

            $agingValues = [
                'Belum Tempo'  => 0,
                '1 - 15 Hari'  => 0,
                '16 - 30 Hari' => 0,
                '31 - 45 Hari' => 0,
                '> 60 Hari'    => 0,
            ];

            $invoicesFormatted = [];
            $vendorTotals      = [];
            $currencyTotals    = [];

            foreach ($accurateInvoices as $inv) {
                $primeOwing = (float)($inv['primeOwing'] ?? 0);
                if ($primeOwing == 0) continue; // Skip lunas

                $idrOwing = $primeOwing;

                $vendorName = is_array($inv['vendor'] ?? null) ? ($inv['vendor']['name'] ?? 'Unknown Vendor') : ($inv['vendor'] ?? 'Unknown Vendor');
                if (!isset($vendorTotals[$vendorName])) $vendorTotals[$vendorName] = 0;
                $vendorTotals[$vendorName] += $idrOwing;

                $currency = is_array($inv['currency'] ?? null) ? ($inv['currency']['code'] ?? 'IDR') : ($inv['currency'] ?? 'IDR');
                if (!isset($currencyTotals[$currency])) {
                    $currencyTotals[$currency] = ['raw' => 0, 'idr' => 0];
                }
                $currencyTotals[$currency]['raw'] += $primeOwing;
                $currencyTotals[$currency]['idr'] += $idrOwing;

                $tDate = null;
                if (!empty($inv['transDate'])) {
                    try { $tDate = Carbon::createFromFormat('d/m/Y', $inv['transDate'], 'Asia/Jakarta')->startOfDay(); }
                    catch (\Exception $e) {}
                }

                $dueDate = null;
                if (!empty($inv['dueDate'])) {
                    try { $dueDate = Carbon::createFromFormat('d/m/Y', $inv['dueDate'], 'Asia/Jakarta')->startOfDay(); }
                    catch (\Exception $e) {}
                }

                // Hitung umur faktur berdasarkan transDate (Tanggal Faktur) sesuai standar Grafik Aging Accurate Online
                $targetDate = $tDate ?? $dueDate;
                if ($targetDate) {
                    if ($targetDate >= $today) {
                        $agingValues['Belum Tempo'] += $idrOwing;
                    } else {
                        $diffDays = (int)$targetDate->diffInDays($today);
                        if ($diffDays <= 15) {
                            $agingValues['1 - 15 Hari'] += $idrOwing;
                        } elseif ($diffDays <= 30) {
                            $agingValues['16 - 30 Hari'] += $idrOwing;
                        } elseif ($diffDays <= 45) {
                            $agingValues['31 - 45 Hari'] += $idrOwing;
                        } else {
                            $agingValues['> 60 Hari'] += $idrOwing;
                        }
                    }
                } else {
                    $agingValues['Belum Tempo'] += $idrOwing;
                }

                $refDate = $dueDate ?? $tDate;
                $ageDays = 0;
                if ($refDate && $today > $refDate) {
                    $ageDays = (int)$refDate->diffInDays($today);
                }

                // Cek filter tanggal untuk tabel
                $skipForTable = false;
                if ($startDate && $endDate && $tDate) {
                    $sd = Carbon::parse($startDate)->startOfDay();
                    $ed = Carbon::parse($endDate)->endOfDay();
                    if ($tDate->lt($sd) || $tDate->gt($ed)) {
                        $skipForTable = true;
                    }
                }

                if (!$skipForTable) {
                    $invoicesFormatted[] = [
                        'id'                 => $inv['id'] ?? 0,
                        'invoice_no'         => $inv['number'] ?? '-',
                        'vendor'             => $vendorName,
                        'invoice_date'       => $tDate ? $tDate->format('Y-m-d') : null,
                        'due_date'           => $dueDate ? $dueDate->format('Y-m-d') : null,
                        'total_amount'       => (float)($inv['totalAmount'] ?? 0),
                        'outstanding_amount' => $primeOwing,
                        'outstanding_idr'    => $idrOwing,
                        'age_days'           => $ageDays,
                        'status'             => $inv['status'] ?? 'OUTSTANDING',
                        'currency'           => $currency,
                    ];
                }
            }

            $agingChart = [];
            foreach ($agingValues as $name => $value) {
                $agingChart[] = ['name' => $name, 'value' => $value];
            }

            // KPI dari aging buckets (dalam IDR)
            $totalOutstanding = array_sum($agingValues);
            $totalOverdue     = $agingValues['1 - 15 Hari'] + $agingValues['16 - 30 Hari']
                              + $agingValues['31 - 45 Hari'] + $agingValues['> 60 Hari'];
            $totalUtang30Hari = $agingValues['31 - 45 Hari'] + $agingValues['> 60 Hari'];

            arsort($vendorTotals);
            $topVendors = [];
            $i = 0;
            foreach ($vendorTotals as $k => $v) {
                if ($i++ >= 5) break;
                $topVendors[] = ['vendor' => $k, 'total' => $v];
            }
            $vendorTerbesar = count($topVendors) > 0
                ? ['name' => $topVendors[0]['vendor'], 'total' => $topVendors[0]['total']]
                : null;

            $ringkasanMataUang = [];
            foreach ($currencyTotals as $k => $v) {
                $ringkasanMataUang[] = [
                    'currency'   => $k,
                    'total'      => $v['raw'],
                    'total_idr'  => $v['idr'],
                    'percentage' => $totalOutstanding > 0 ? round(($v['idr'] / $totalOutstanding) * 100, 2) : 0,
                ];
            }

            usort($invoicesFormatted, function($a, $b) {
                return $b['invoice_date'] <=> $a['invoice_date'];
            });

            // Ambil Data Pembayaran Utang dari Accurate API (/accurate/api/purchase-payment/list.do)
            $pembayaranBulanIni = 0;
            $paymentTrendMap    = [];
            $currentMonthStr    = $today->format('m/Y');
            $recentApiPayments  = [];

            $pmtPage = 1;
            $maxPmtPage = 20;

            do {
                $pr = $this->accurateApi->get('/accurate/api/purchase-payment/list.do', [
                    'fields'      => 'id,number,transDate,vendor,chequeAmount,totalAmount',
                    'sp.pageSize' => 100,
                    'sp.page'     => $pmtPage
                ]);

                if (!isset($pr['s']) || $pr['s'] !== true) break;
                $payments = $pr['d'] ?? [];
                if (empty($payments)) break;

                foreach ($payments as $pmt) {
                    $amount = (float)($pmt['chequeAmount'] ?? $pmt['totalAmount'] ?? 0);
                    $pDateStr = $pmt['transDate'] ?? '';
                    if (!$pDateStr) continue;

                    try {
                        $pDate = Carbon::createFromFormat('d/m/Y', $pDateStr)->startOfDay();

                        if ($pmtPage === 1 && count($recentApiPayments) < 6) {
                            $vendorName = is_array($pmt['vendor'] ?? null) ? ($pmt['vendor']['name'] ?? 'Vendor') : ($pmt['vendor'] ?? 'Vendor');
                            $pmtNo = $pmt['number'] ?? '';
                            $recentApiPayments[] = [
                                'date'        => $pDate->format('Y-m-d'),
                                'description' => "Pembayaran " . ($pmtNo ? "{$pmtNo} " : "") . "ke {$vendorName}",
                                'amount'      => $amount,
                                'type'        => 'Completed',
                                'color'       => 'success'
                            ];
                        }

                        if ($startDate && $endDate) {
                            $sd = Carbon::parse($startDate)->startOfDay();
                            $ed = Carbon::parse($endDate)->endOfDay();
                            if ($pDate->gte($sd) && $pDate->lte($ed)) {
                                $pembayaranBulanIni += $amount;
                            }
                        } else {
                            if ($pDate->format('m/Y') === $currentMonthStr) {
                                $pembayaranBulanIni += $amount;
                            }
                        }

                        $mKey = $pDate->format('Y-m');
                        $mLabel = $pDate->translatedFormat('M Y');
                        if (!isset($paymentTrendMap[$mKey])) {
                            $paymentTrendMap[$mKey] = [
                                'period' => $mKey,
                                'label'  => $mLabel,
                                'total'  => 0,
                            ];
                        }
                        $paymentTrendMap[$mKey]['total'] += $amount;

                    } catch (\Exception $e) {}
                }

                $pmtTotalPg = $pr['sp']['pageCount'] ?? 1;
                $pmtPage++;
            } while ($pmtPage <= $pmtTotalPg && $pmtPage <= $maxPmtPage);

            $paymentTrend = [];
            for ($m = 11; $m >= 0; $m--) {
                $subM = $today->copy()->subMonths($m);
                $mKey = $subM->format('Y-m');
                $val = (float)($paymentTrendMap[$mKey]['total'] ?? $paymentTrendMap[$mKey] ?? 0);
                $paymentTrend[] = [
                    'period' => $mKey,
                    'label'  => $subM->translatedFormat('M Y'),
                    'month'  => $subM->isoFormat('MMM YY'),
                    'total'  => $val,
                    'actual' => $val,
                ];
            }

            $recentInvoicesColl = collect(array_slice($invoicesFormatted, 0, 5))->map(function($inv) {
                return [
                    'date'        => $inv['invoice_date'],
                    'description' => "Invoice {$inv['invoice_no']} diterbitkan dari {$inv['vendor']}",
                    'amount'      => (float)$inv['total_amount'],
                    'type'        => 'Pending Approval',
                    'color'       => 'warning'
                ];
            });

            $recentPaymentsColl = collect($recentApiPayments);

            $aktivitasTerbaru = $recentInvoicesColl->concat($recentPaymentsColl)
                ->sortByDesc('date')
                ->take(6)
                ->values()
                ->toArray();

            $overdueCount  = 0;
            $upcomingCount = 0;
            $sevenDaysFromNow = $today->copy()->addDays(7)->endOfDay();

            foreach ($invoicesFormatted as $inv) {
                if ($inv['age_days'] > 0) {
                    $overdueCount++;
                } elseif (!empty($inv['due_date'])) {
                    try {
                        $dDate = Carbon::parse($inv['due_date'])->startOfDay();
                        if ($dDate->gte($today) && $dDate->lte($sevenDaysFromNow)) {
                            $upcomingCount++;
                        }
                    } catch (\Exception $e) {}
                }
            }

            $peringatan = [];
            if ($overdueCount > 0) {
                $peringatan[] = [
                    'type'        => 'danger',
                    'message'     => "{$overdueCount} Invoice/Tagihan vendor sudah jatuh tempo",
                    'sub_message' => 'Total Rp ' . number_format($totalOverdue, 0, ',', '.')
                ];
            }
            if ($upcomingCount > 0) {
                $peringatan[] = [
                    'type'        => 'warning',
                    'message'     => "{$upcomingCount} Invoice/Tagihan vendor akan jatuh tempo dalam 7 hari"
                ];
            }

            return [
                'kpis' => [
                    'total_outstanding'    => $totalOutstanding,
                    'total_overdue'        => $totalOverdue,
                    'total_utang_30_hari'  => $totalUtang30Hari,
                    'pembayaran_bulan_ini' => $pembayaranBulanIni,
                    'vendor_terbesar'      => $vendorTerbesar,
                ],
                'aging_chart'         => $agingChart,
                'top_vendors'         => $topVendors,
                'payment_trend'       => $paymentTrend,
                'payment_trend_title' => 'Trend Pembayaran (Live API)',
                'invoices'            => $invoicesFormatted,
                'ringkasan_mata_uang' => $ringkasanMataUang,
                'peringatan'          => $peringatan,
                'aktivitas_terbaru'   => $aktivitasTerbaru,
            ];
        });

        if (isset($responseData['status']) && $responseData['status'] === 'error') {
            // Jangan simpan response error di cache agar request berikutnya langsung mencoba ulang
            Cache::forget($cacheKey);

            // Fallback ke data DB agar UI dashboard tetap tampil dengan peringatan
            try {
                $dbResponse = $this->getApDashboard($request);
                $dbData = $dbResponse->getData(true);
                $dbData['peringatan'] = [
                    'Menampilkan data cadangan (DB) karena koneksi API Accurate mengalami gangguan sementara.'
                ];
                return response()->json($dbData);
            } catch (\Exception $e) {
                return response()->json($responseData, 400);
            }
        }

        return response()->json($responseData);
    }
}
