<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Finance\ArInvoice;
use App\Models\Finance\ArAging;
use App\Models\Finance\ArReceipt;
use App\Services\AccurateApiService;
use Illuminate\Support\Facades\Cache;

class ArDashboardController extends Controller
{
    protected $accurateApi;

    public function __construct(AccurateApiService $accurateApi)
    {
        $this->accurateApi = $accurateApi;
    }

    public function getArDashboard(Request $request)
    {
        $asOfDate = $request->query('as_of_date');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $filterInvoiceDate = function ($query) use ($asOfDate, $startDate, $endDate) {
            if ($asOfDate) {
                $query->where('invoice_date', '<=', $asOfDate);
            } elseif ($startDate && $endDate) {
                $query->whereBetween('invoice_date', [$startDate, $endDate]);
            }
        };

        $filterReceiptDate = function ($query) use ($startDate, $endDate) {
            if ($startDate && $endDate) {
                $query->whereBetween('receipt_date', [$startDate, $endDate]);
            }
        };

        // 1. KPI Cards
        $totalOutstanding = ArInvoice::sum('outstanding_amount');
        
        $agings = ArAging::selectRaw('
            SUM(not_due) as not_due,
            SUM(days_1_15) as days_1_15,
            SUM(days_16_30) as days_16_30,
            SUM(days_31_45) as days_31_45,
            SUM(days_46_60) as days_46_60,
            SUM(days_over_60) as days_over_60
        ')
        ->first(); // Aging report in accurate doesn't use invoice date filter in the same way, it's a snapshot

        $totalOverdue = ($agings->days_1_15 ?? 0) + ($agings->days_16_30 ?? 0) + ($agings->days_31_45 ?? 0) + ($agings->days_46_60 ?? 0) + ($agings->days_over_60 ?? 0);

        // 2. Aging Chart Data
        $agingChart = [
            ['name' => 'Belum Jatuh Tempo', 'value' => (float) ($agings->not_due ?? 0)],
            ['name' => '1-15 Hari', 'value' => (float) ($agings->days_1_15 ?? 0)],
            ['name' => '16-30 Hari', 'value' => (float) ($agings->days_16_30 ?? 0)],
            ['name' => '31-45 Hari', 'value' => (float) ($agings->days_31_45 ?? 0)],
            ['name' => '46-60 Hari', 'value' => (float) ($agings->days_46_60 ?? 0)],
            ['name' => '> 60 Hari', 'value' => (float) ($agings->days_over_60 ?? 0)],
        ];

        // 3. Top Customer Outstanding
        $topCustomers = ArInvoice::selectRaw('customer as name, SUM(outstanding_amount) as total')
            ->groupBy('customer')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $item->total = (float) $item->total;
                return $item;
            });

        // 4. Receipt Trend
        $receiptQuery = ArReceipt::whereNotNull('receipt_date')->where($filterReceiptDate);
        $minDate = (clone $receiptQuery)->min('receipt_date');
        $maxDate = (clone $receiptQuery)->max('receipt_date');

        $isSameMonth = false;
        if ($minDate && $maxDate) {
            $isSameMonth = date('Y-m', strtotime($minDate)) === date('Y-m', strtotime($maxDate));
        }

        Carbon::setLocale('id'); 
        if ($isSameMonth) {
            $paymentTrend = (clone $receiptQuery)
                ->selectRaw('DATE_FORMAT(receipt_date, "%Y-%m-%d") as period, SUM(total_amount) as total')
                ->groupBy('period')
                ->orderBy('period', 'asc')
                ->get()
                ->map(function ($item) {
                    $item->total = (float) $item->total;
                    $item->label = Carbon::parse($item->period)->translatedFormat('d M Y');
                    return $item;
                });
            $trendTitle = "Trend Penerimaan (" . Carbon::parse($minDate)->translatedFormat('F Y') . ")";
        } else {
            $paymentTrend = (clone $receiptQuery)
                ->selectRaw('DATE_FORMAT(receipt_date, "%Y-%m") as period, SUM(total_amount) as total')
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
            $trendTitle = "Trend Penerimaan (6 Bulan Terakhir)";
        }

        // 5. Invoice List
        $invoices = ArInvoice::orderByDesc('invoice_date')->get();

        // Additional KPIs
        $totalPiutang30Hari = ArInvoice::where('age_days', '>', 30)->sum('outstanding_amount');
        
        $penerimaanBulanIniQuery = ArReceipt::whereNotNull('receipt_date');
        if ($startDate && $endDate) {
            $penerimaanBulanIniQuery->whereBetween('receipt_date', [$startDate, $endDate]);
        } else {
            $penerimaanBulanIniQuery->whereMonth('receipt_date', date('m'))->whereYear('receipt_date', date('Y'));
        }
        $penerimaanBulanIni = $penerimaanBulanIniQuery->sum('total_amount');

        $customerTerbesar = ArInvoice::selectRaw('customer, SUM(outstanding_amount) as total')
            ->groupBy('customer')
            ->orderByDesc('total')
            ->first();

        // 7. Peringatan (Alerts)
        $invoiceJatuhTempo = ArInvoice::where('age_days', '>', 0)->count();
        
        $peringatan = [];
        if ($invoiceJatuhTempo > 0) {
            $peringatan[] = [
                'type' => 'danger',
                'message' => "{$invoiceJatuhTempo} Faktur pelanggan sudah jatuh tempo",
                'sub_message' => 'Total Rp ' . number_format($totalOverdue, 0, ',', '.')
            ];
        }

        // 8. Ringkasan Mata Uang
        $totalAllCurrency = $totalOutstanding > 0 ? $totalOutstanding : 1;
        // Accurate AR dump is in IDR based on the sample, but let's hardcode for IDR if no currency column exists, or check the table.
        // Wait, ArInvoice doesn't have a currency column!
        $ringkasanMataUang = [
            [
                'currency' => 'IDR',
                'total' => (float)$totalOutstanding,
                'percentage' => 100
            ]
        ];

        // 9. Aktivitas AR Terbaru
        $recentInvoices = ArInvoice::orderByDesc('invoice_date')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->invoice_date,
                    'description' => "Faktur {$item->invoice_no} diterbitkan untuk {$item->customer}",
                    'amount' => (float)$item->total_amount,
                    'type' => 'Pending',
                    'color' => 'warning'
                ];
            });

        $recentPayments = ArReceipt::orderByDesc('receipt_date')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->receipt_date,
                    'description' => "Penerimaan dari {$item->customer}",
                    'amount' => (float)$item->total_amount,
                    'type' => 'Completed',
                    'color' => 'success'
                ];
            });
        
        $aktivitasTerbaru = $recentInvoices->concat($recentPayments)->sortByDesc('date')->take(6)->values();

        return response()->json([
            'kpis' => [
                'total_outstanding' => $totalOutstanding,
                'total_overdue' => $totalOverdue,
                'total_utang_30_hari' => $totalPiutang30Hari,
                'pembayaran_bulan_ini' => $penerimaanBulanIni,
                'customer_terbesar' => $customerTerbesar ? [
                    'name' => $customerTerbesar->customer,
                    'total' => (float)$customerTerbesar->total
                ] : null,
            ],
            'aging_chart' => $agingChart,
            'top_customers' => $topCustomers,
            'payment_trend' => $paymentTrend,
            'payment_trend_title' => $trendTitle,
            'invoices' => $invoices,
            'ringkasan_mata_uang' => $ringkasanMataUang,
            'peringatan' => $peringatan,
            'aktivitas_terbaru' => $aktivitasTerbaru,
        ]);
    }

    /**
     * Data Accounts Receivable Live API dari Accurate
     */
    public function getArDashboardApi(Request $request)
    {
        $asOfDate  = $request->query('as_of_date');
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        $cacheKey = 'ar_dashboard_live_api_' . md5(($asOfDate ?? '') . '_' . ($startDate ?? '') . '_' . ($endDate ?? ''));

        if ($isRefresh) {
            Cache::forget($cacheKey);
        }

        $responseData = Cache::remember($cacheKey, 300, function () use ($asOfDate, $startDate, $endDate) {

            $today = $asOfDate ? Carbon::parse($asOfDate)->startOfDay() : Carbon::now('Asia/Jakarta')->startOfDay();

            // Ambil SEMUA sales invoices dari Accurate API
            $accurateInvoices = [];
            $page  = 1;
            $maxPg = 200;

            do {
                $r = $this->accurateApi->get('/accurate/api/sales-invoice/list.do', [
                    'fields'      => 'id,number,customer,transDate,dueDate,status,currency,totalAmount,primeOwing',
                    'sp.pageSize' => 100,
                    'sp.page'     => $page
                ]);

                if (!isset($r['s']) || $r['s'] !== true) {
                    if ($page === 1) {
                        return [
                            'status'       => 'error',
                            'message'      => 'Gagal mengambil data AR dari Accurate',
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
                'Belum Jatuh Tempo' => 0,
                '1 - 15 Hari'       => 0,
                '16 - 30 Hari'      => 0,
                '31 - 45 Hari'      => 0,
                '46 - 60 Hari'      => 0,
                '> 60 Hari'         => 0,
            ];

            $invoicesFormatted = [];
            $customerTotals    = [];
            $currencyTotals    = [];

            foreach ($accurateInvoices as $inv) {
                $outstanding = (float)($inv['primeOwing'] ?? 0);
                if ($outstanding == 0) continue;

                $customerName = is_array($inv['customer'] ?? null) ? ($inv['customer']['name'] ?? 'Unknown Customer') : ($inv['customer'] ?? 'Unknown Customer');
                if (!isset($customerTotals[$customerName])) $customerTotals[$customerName] = 0;
                $customerTotals[$customerName] += $outstanding;

                $currency = is_array($inv['currency'] ?? null) ? ($inv['currency']['name'] ?? 'IDR') : ($inv['currency'] ?? 'IDR');
                if (!isset($currencyTotals[$currency])) $currencyTotals[$currency] = 0;
                $currencyTotals[$currency] += $outstanding;

                $tDate = null;
                if (!empty($inv['transDate'])) {
                    try {
                        $tDate = Carbon::createFromFormat('d/m/Y', $inv['transDate'], 'Asia/Jakarta')->startOfDay();
                        if ($tDate >= $today) {
                            $agingValues['Belum Jatuh Tempo'] += $outstanding;
                        } else {
                            $diffDays = (int)$tDate->diffInDays($today);
                            if ($diffDays <= 15) {
                                $agingValues['1 - 15 Hari'] += $outstanding;
                            } elseif ($diffDays <= 30) {
                                $agingValues['16 - 30 Hari'] += $outstanding;
                            } elseif ($diffDays <= 45) {
                                $agingValues['31 - 45 Hari'] += $outstanding;
                            } elseif ($diffDays <= 60) {
                                $agingValues['46 - 60 Hari'] += $outstanding;
                            } else {
                                $agingValues['> 60 Hari'] += $outstanding;
                            }
                        }
                    } catch (\Exception $e) {
                        $agingValues['Belum Jatuh Tempo'] += $outstanding;
                    }
                } else {
                    $agingValues['Belum Jatuh Tempo'] += $outstanding;
                }

                $dueDate = null;
                if (!empty($inv['dueDate'])) {
                    try { $dueDate = Carbon::createFromFormat('d/m/Y', $inv['dueDate'], 'Asia/Jakarta')->startOfDay(); }
                    catch (\Exception $e) {}
                }

                $refDate = $dueDate ?? $tDate;
                $ageDays = 0;
                if ($refDate && $today > $refDate) {
                    $ageDays = (int)$refDate->diffInDays($today);
                }

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
                        'customer'           => $customerName,
                        'invoice_date'       => $tDate ? $tDate->format('Y-m-d') : null,
                        'due_date'           => $dueDate ? $dueDate->format('Y-m-d') : null,
                        'total_amount'       => (float)($inv['totalAmount'] ?? 0),
                        'outstanding_amount' => $outstanding,
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

            $totalOutstanding = array_sum($agingValues);
            $totalOverdue     = $agingValues['1 - 15 Hari'] + $agingValues['16 - 30 Hari']
                              + $agingValues['31 - 45 Hari'] + $agingValues['46 - 60 Hari']
                              + $agingValues['> 60 Hari'];
            $totalPiutang30Hari = $agingValues['31 - 45 Hari'] + $agingValues['46 - 60 Hari']
                              + $agingValues['> 60 Hari'];

            arsort($customerTotals);
            $topCustomers = [];
            $i = 0;
            foreach ($customerTotals as $k => $v) {
                if ($i++ >= 5) break;
                $topCustomers[] = ['name' => $k, 'total' => $v];
            }
            $customerTerbesar = count($topCustomers) > 0
                ? ['name' => $topCustomers[0]['name'], 'total' => $topCustomers[0]['total']]
                : null;

            $ringkasanMataUang = [];
            foreach ($currencyTotals as $k => $v) {
                $ringkasanMataUang[] = [
                    'currency'   => $k,
                    'total'      => $v,
                    'percentage' => $totalOutstanding > 0 ? round(($v / $totalOutstanding) * 100, 2) : 0,
                ];
            }

            usort($invoicesFormatted, function($a, $b) {
                return $b['invoice_date'] <=> $a['invoice_date'];
            });

            // Ambil Data Penerimaan Piutang dari Accurate API (/accurate/api/sales-receipt/list.do)
            $penerimaanBulanIni = 0;
            $paymentTrendMap    = [];
            $currentMonthStr    = $today->format('m/Y');
            $recentApiPayments  = [];

            $pmtPage = 1;
            $maxPmtPage = 20;

            do {
                $pr = $this->accurateApi->get('/accurate/api/sales-receipt/list.do', [
                    'fields'      => 'id,number,transDate,customer,chequeAmount,totalAmount',
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
                            $custName = is_array($pmt['customer'] ?? null) ? ($pmt['customer']['name'] ?? 'Pelanggan') : ($pmt['customer'] ?? 'Pelanggan');
                            $pmtNo = $pmt['number'] ?? '';
                            $recentApiPayments[] = [
                                'date'        => $pDate->format('Y-m-d'),
                                'description' => "Penerimaan " . ($pmtNo ? "{$pmtNo} " : "") . "dari {$custName}",
                                'amount'      => $amount,
                                'type'        => 'Completed',
                                'color'       => 'success'
                            ];
                        }

                        if ($startDate && $endDate) {
                            $sd = Carbon::parse($startDate)->startOfDay();
                            $ed = Carbon::parse($endDate)->endOfDay();
                            if ($pDate->gte($sd) && $pDate->lte($ed)) {
                                $penerimaanBulanIni += $amount;
                            }
                        } else {
                            if ($pDate->format('m/Y') === $currentMonthStr) {
                                $penerimaanBulanIni += $amount;
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

            ksort($paymentTrendMap);
            $paymentTrend = array_values(array_slice($paymentTrendMap, -6));

            $recentInvoicesFormatted = array_map(function($inv) {
                return [
                    'date'        => $inv['invoice_date'],
                    'description' => "Faktur {$inv['invoice_no']} diterbitkan untuk {$inv['customer']}",
                    'amount'      => $inv['total_amount'],
                    'type'        => 'Pending',
                    'color'       => 'warning'
                ];
            }, array_slice($invoicesFormatted, 0, 5));

            $aktivitasTerbaru = collect($recentInvoicesFormatted)
                ->concat($recentApiPayments)
                ->sortByDesc('date')
                ->take(6)
                ->values()
                ->all();

            $overdueCount = 0;
            foreach ($invoicesFormatted as $inv) {
                if ($inv['age_days'] > 0) $overdueCount++;
            }

            $peringatan = [];
            if ($overdueCount > 0) {
                $peringatan[] = [
                    'type'        => 'danger',
                    'message'     => "{$overdueCount} Faktur pelanggan sudah jatuh tempo",
                    'sub_message' => 'Total Rp ' . number_format($totalOverdue, 0, ',', '.')
                ];
            }

            return [
                'kpis' => [
                    'total_outstanding'    => $totalOutstanding,
                    'total_overdue'        => $totalOverdue,
                    'total_utang_30_hari'  => $totalPiutang30Hari,
                    'pembayaran_bulan_ini' => $penerimaanBulanIni,
                    'customer_terbesar'    => $customerTerbesar,
                ],
                'aging_chart'         => $agingChart,
                'top_customers'       => $topCustomers,
                'payment_trend'       => $paymentTrend,
                'payment_trend_title' => 'Trend Penerimaan (6 Bulan Terakhir)',
                'invoices'            => $invoicesFormatted,
                'ringkasan_mata_uang' => $ringkasanMataUang,
                'peringatan'          => $peringatan,
                'aktivitas_terbaru'   => $aktivitasTerbaru,
                'is_live_api'         => true,
            ];
        });

        return response()->json($responseData);
    }
}
