<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxPpnRecord;
use App\Services\AccurateApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TaxController extends Controller
{
    protected $accurateApi;

    public function __construct(AccurateApiService $accurateApi)
    {
        $this->accurateApi = $accurateApi;
    }

    public function index(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $queryMasukan = TaxPpnRecord::where('type', 'masukan');
        $queryKeluaran = TaxPpnRecord::where('type', 'keluaran');
        $queryMonthly = TaxPpnRecord::query();

        if ($startDate && $endDate) {
            $queryMasukan->whereBetween('tanggal', [$startDate, $endDate]);
            $queryKeluaran->whereBetween('tanggal', [$startDate, $endDate]);
            $queryMonthly->whereBetween('tanggal', [$startDate, $endDate]);
        }

        // 1. Dapatkan Total PPN Masukan
        $totalMasukan = $queryMasukan->sum('nilai_pajak');
        
        // 2. Dapatkan Total PPN Keluaran
        $totalKeluaran = $queryKeluaran->sum('nilai_pajak');
        
        // 3. Selisih (Lebih Bayar / Kurang Bayar)
        // Jika Keluaran > Masukan = Kurang Bayar
        // Jika Masukan > Keluaran = Lebih Bayar
        $netPpn = $totalKeluaran - $totalMasukan;
        
        // 4. Data per bulan untuk chart
        $monthlyData = $queryMonthly->select(
            DB::raw('DATE_FORMAT(tanggal, "%Y-%m") as month'),
            'type',
            DB::raw('SUM(nilai_pajak) as total')
        )
        ->groupBy('month', 'type')
        ->orderBy('month')
        ->get();
        
        $chartData = [];
        foreach ($monthlyData as $data) {
            $month = $data->month;
            if (!isset($chartData[$month])) {
                $chartData[$month] = ['name' => $month, 'masukan' => 0, 'keluaran' => 0];
            }
            $chartData[$month][$data->type] = (float)$data->total;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_masukan' => $totalMasukan,
                    'total_keluaran' => $totalKeluaran,
                    'net_ppn' => $netPpn,
                    'status' => $netPpn > 0 ? 'Kurang Bayar' : 'Lebih Bayar',
                ],
                'chart_data' => array_values($chartData)
            ]
        ]);
    }

    /**
     * Live API Tax (PPN Masukan & PPN Keluaran) dari Accurate Online
     */
    public function getTaxDashboardApi(Request $request)
    {
        $asOfDate  = $request->query('as_of_date');
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        $cacheKey = 'tax_dashboard_live_api_' . md5(($asOfDate ?? '') . '_' . ($startDate ?? '') . '_' . ($endDate ?? ''));

        if ($isRefresh) {
            Cache::forget($cacheKey);
        }

        $responseData = Cache::remember($cacheKey, 300, function () use ($asOfDate, $startDate, $endDate) {

            $today = $asOfDate ? Carbon::parse($asOfDate)->startOfDay() : Carbon::now('Asia/Jakarta')->startOfDay();

            $sd = $startDate ? Carbon::parse($startDate)->startOfDay() : null;
            $ed = $endDate ? Carbon::parse($endDate)->endOfDay() : null;

            // 1. Ambil Sales Invoices (PPN Keluaran / Sales Tax)
            $salesInvoices = [];
            $page = 1;
            $maxPg = 20;
            do {
                $r = $this->accurateApi->get('/accurate/api/sales-invoice/list.do', [
                    'fields'      => 'id,number,customer,transDate,totalAmount,tax1Amount,subTotal,taxable,status',
                    'sp.pageSize' => 100,
                    'sp.page'     => $page
                ]);

                if (!isset($r['s']) || $r['s'] !== true) break;
                $salesInvoices = array_merge($salesInvoices, $r['d'] ?? []);
                $totalPg = $r['sp']['pageCount'] ?? 1;
                $page++;
            } while ($page <= $totalPg && $page <= $maxPg);

            // 2. Ambil Purchase Invoices (PPN Masukan / Purchase Tax)
            $purchaseInvoices = [];
            $page = 1;
            do {
                $r = $this->accurateApi->get('/accurate/api/purchase-invoice/list.do', [
                    'fields'      => 'id,number,vendor,transDate,totalAmount,tax1Amount,subTotal,taxable,status',
                    'sp.pageSize' => 100,
                    'sp.page'     => $page
                ]);

                if (!isset($r['s']) || $r['s'] !== true) break;
                $purchaseInvoices = array_merge($purchaseInvoices, $r['d'] ?? []);
                $totalPg = $r['sp']['pageCount'] ?? 1;
                $page++;
            } while ($page <= $totalPg && $page <= $maxPg);

            $totalKeluaran = 0;
            $totalMasukan  = 0;
            $monthlyDataMap = [];
            $invoicesFormatted = [];

            // Continuous 12 months map
            for ($m = 11; $m >= 0; $m--) {
                $subM = $today->copy()->subMonths($m);
                $mKey = $subM->format('Y-m');
                $monthlyDataMap[$mKey] = [
                    'month'    => $mKey,
                    'name'     => $subM->translatedFormat('M Y'),
                    'masukan'  => 0,
                    'keluaran' => 0,
                ];
            }

            // Process PPN Keluaran (Sales Invoices)
            foreach ($salesInvoices as $inv) {
                if (empty($inv['transDate'])) continue;
                try {
                    $tDate = Carbon::createFromFormat('d/m/Y', $inv['transDate'], 'Asia/Jakarta')->startOfDay();
                } catch (\Exception $e) { continue; }

                if ($asOfDate && $tDate->gt($today)) continue;
                if ($sd && $ed && ($tDate->lt($sd) || $tDate->gt($ed))) continue;

                $taxAmount = (float)($inv['tax1Amount'] ?? 0);
                $subTotal  = (float)($inv['subTotal'] ?? 0);
                if ($taxAmount == 0 && ($inv['taxable'] ?? false)) {
                    $taxAmount = round($subTotal * 0.11, 2);
                }

                $totalKeluaran += $taxAmount;
                $mKey = $tDate->format('Y-m');
                if (isset($monthlyDataMap[$mKey])) {
                    $monthlyDataMap[$mKey]['keluaran'] += $taxAmount;
                }

                $custName = is_array($inv['customer'] ?? null) ? ($inv['customer']['name'] ?? 'Customer') : ($inv['customer'] ?? 'Customer');
                $invoicesFormatted[] = [
                    'id'           => 'SALES_' . ($inv['id'] ?? rand()),
                    'type'         => 'Keluaran',
                    'invoice_no'   => $inv['number'] ?? '-',
                    'entity'       => $custName,
                    'date'         => $tDate->format('Y-m-d'),
                    'subtotal'     => $subTotal,
                    'tax_amount'   => $taxAmount,
                    'total_amount' => (float)($inv['totalAmount'] ?? ($subTotal + $taxAmount)),
                ];
            }

            // Process PPN Masukan (Purchase Invoices)
            foreach ($purchaseInvoices as $inv) {
                if (empty($inv['transDate'])) continue;
                try {
                    $tDate = Carbon::createFromFormat('d/m/Y', $inv['transDate'], 'Asia/Jakarta')->startOfDay();
                } catch (\Exception $e) { continue; }

                if ($asOfDate && $tDate->gt($today)) continue;
                if ($sd && $ed && ($tDate->lt($sd) || $tDate->gt($ed))) continue;

                $taxAmount = (float)($inv['tax1Amount'] ?? 0);
                $subTotal  = (float)($inv['subTotal'] ?? 0);
                if ($taxAmount == 0 && ($inv['taxable'] ?? false)) {
                    $taxAmount = round($subTotal * 0.11, 2);
                }

                $totalMasukan += $taxAmount;
                $mKey = $tDate->format('Y-m');
                if (isset($monthlyDataMap[$mKey])) {
                    $monthlyDataMap[$mKey]['masukan'] += $taxAmount;
                }

                $vendorName = is_array($inv['vendor'] ?? null) ? ($inv['vendor']['name'] ?? 'Vendor') : ($inv['vendor'] ?? 'Vendor');
                $invoicesFormatted[] = [
                    'id'           => 'PURCHASE_' . ($inv['id'] ?? rand()),
                    'type'         => 'Masukan',
                    'invoice_no'   => $inv['number'] ?? '-',
                    'entity'       => $vendorName,
                    'date'         => $tDate->format('Y-m-d'),
                    'subtotal'     => $subTotal,
                    'tax_amount'   => $taxAmount,
                    'total_amount' => (float)($inv['totalAmount'] ?? ($subTotal + $taxAmount)),
                ];
            }

            usort($invoicesFormatted, function ($a, $b) {
                return $b['date'] <=> $a['date'];
            });

            $netPpn = $totalKeluaran - $totalMasukan;
            $status = $netPpn > 0 ? 'Kurang Bayar' : ($netPpn < 0 ? 'Lebih Bayar' : 'Nihil');

            // Reconnect DB connection in case long API calls caused MySQL timeout
            try { DB::reconnect(); } catch (\Exception $e) {}

            return [
                'success' => true,
                'data'    => [
                    'summary' => [
                        'total_masukan'  => $totalMasukan,
                        'total_keluaran' => $totalKeluaran,
                        'net_ppn'        => $netPpn,
                        'status'         => $status,
                    ],
                    'chart_data'  => array_values($monthlyDataMap),
                    'invoices'    => $invoicesFormatted,
                    'is_live_api' => true,
                ]
            ];
        });

        return response()->json($responseData);
    }

    public function syncSynology()
    {
        try {
            \Illuminate\Support\Facades\Artisan::call('synology:sync');
            return response()->json([
                'success' => true,
                'message' => 'Sync completed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage()
            ], 500);
        }
    }
}

