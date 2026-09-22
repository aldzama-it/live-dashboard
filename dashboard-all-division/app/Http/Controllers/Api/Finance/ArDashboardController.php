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
                    'fields'      => 'id,number,customer,transDate,dueDate,status,currency,totalAmount,primeOwing,rate',
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
                'Belum Tempo'  => 0,
                '1 - 15 Hari'  => 0,
                '16 - 30 Hari' => 0,
                '31 - 45 Hari' => 0,
                '46 - 60 Hari' => 0,
                '> 60 Hari'    => 0,
            ];

            $invoicesFormatted = [];
            $customerTotals    = [];
            $currencyTotals    = [];

            foreach ($accurateInvoices as $inv) {
                $primeOwing = (float)($inv['primeOwing'] ?? 0);
                if ($primeOwing == 0) continue;

                $idrOwing = $primeOwing;

                $customerName = is_array($inv['customer'] ?? null) ? ($inv['customer']['name'] ?? 'Unknown Customer') : ($inv['customer'] ?? 'Unknown Customer');
                if (!isset($customerTotals[$customerName])) $customerTotals[$customerName] = 0;
                $customerTotals[$customerName] += $idrOwing;

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
                        } elseif ($diffDays <= 60) {
                            $agingValues['46 - 60 Hari'] += $idrOwing;
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
                $agingChart[] = ['name' => $name, 'value' => (float) $value];
            }

            $totalOutstanding = array_sum($agingValues);
            $totalOverdue     = $agingValues['1 - 15 Hari'] + $agingValues['16 - 30 Hari']
                              + $agingValues['31 - 45 Hari'] + $agingValues['46 - 60 Hari'] + $agingValues['> 60 Hari'];
            $totalPiutang30Hari = $agingValues['31 - 45 Hari'] + $agingValues['46 - 60 Hari'] + $agingValues['> 60 Hari'];

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
                    'total'      => $v['raw'],
                    'total_idr'  => $v['idr'],
                    'percentage' => $totalOutstanding > 0 ? round(($v['idr'] / $totalOutstanding) * 100, 2) : 0,
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

                        $dKey = $pDate->format('Y-m-d');
                        if (!isset($paymentTrendMap[$dKey])) {
                            $paymentTrendMap[$dKey] = [
                                'date'   => $dKey,
                                'period' => $dKey,
                                'label'  => $pDate->translatedFormat('d M Y'),
                                'total'  => 0,
                            ];
                        }
                        $paymentTrendMap[$dKey]['total'] += $amount;

                    } catch (\Exception $e) {}
                }

                $pmtPage++;
            } while ($pmtPage <= $maxPmtPage);

            ksort($paymentTrendMap);
            $paymentTrend = array_values($paymentTrendMap);

            $aktivitasTerbaru = $recentApiPayments;

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
                    'message'     => "{$overdueCount} Faktur pelanggan sudah jatuh tempo",
                    'sub_message' => 'Total Rp ' . number_format($totalOverdue, 0, ',', '.')
                ];
            }
            if ($upcomingCount > 0) {
                $peringatan[] = [
                    'type'        => 'warning',
                    'message'     => "{$upcomingCount} Faktur pelanggan akan jatuh tempo dalam 7 hari"
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
