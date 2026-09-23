<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxPpnRecord;
use App\Models\SptTaxReport;
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

        $totalMasukan = $queryMasukan->sum('nilai_pajak');
        $totalKeluaran = $queryKeluaran->sum('nilai_pajak');
        $netPpn = $totalKeluaran - $totalMasukan;

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
     * Live API Tax (PPN Masukan, PPN Keluaran & PPh 23 / 4(2) / 22 Withholding Tax)
     */
    public function getTaxDashboardApi(Request $request)
    {
        $asOfDate  = $request->query('as_of_date');
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        $cacheKey = 'tax_dashboard_live_api_v2_' . md5(($asOfDate ?? '') . '_' . ($startDate ?? '') . '_' . ($endDate ?? ''));

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
                    'fields'      => 'id,number,customer,transDate,totalAmount,tax1Amount,subTotal,taxable,status,taxNumber,taxNumber2,branch',
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
                    'fields'      => 'id,number,vendor,transDate,totalAmount,tax1Amount,subTotal,taxable,status,taxNumber,taxNumber2,branch',
                    'sp.pageSize' => 100,
                    'sp.page'     => $page
                ]);

                if (!isset($r['s']) || $r['s'] !== true) break;
                $purchaseInvoices = array_merge($purchaseInvoices, $r['d'] ?? []);
                $totalPg = $r['sp']['pageCount'] ?? 1;
                $page++;
            } while ($page <= $totalPg && $page <= $maxPg);

            // 3. Ambil Withholding Tax (PPh 23, PPh 4(2), PPh 22)
            $totalPph23  = 0;
            $totalPph4_2 = 0;
            $totalPph22  = 0;
            $totalPph    = 0;
            $pphRecords  = [];

            try {
                $wr = $this->accurateApi->get('/accurate/api/withholding-tax/list.do', [
                    'fields'      => 'id,number,transDate,taxAmount,totalAmount,taxType,vendor,customer,taxNumber,notes',
                    'sp.pageSize' => 100,
                    'sp.page'     => 1
                ]);
                if (isset($wr['s']) && $wr['s'] === true) {
                    foreach ($wr['d'] ?? [] as $wItem) {
                        $amt = (float)($wItem['taxAmount'] ?? $wItem['totalAmount'] ?? 0);
                        $typeStr = strtoupper($wItem['taxType'] ?? 'PPH 23');
                        $totalPph += $amt;

                        if (str_contains($typeStr, '4(2)') || str_contains($typeStr, 'FINAL')) {
                            $totalPph4_2 += $amt;
                            $pphCategory = 'PPh 4(2)';
                        } elseif (str_contains($typeStr, '22')) {
                            $totalPph22 += $amt;
                            $pphCategory = 'PPh 22';
                        } else {
                            $totalPph23 += $amt;
                            $pphCategory = 'PPh 23';
                        }

                        $entityName = 'Pihak Ketiga';
                        if (!empty($wItem['vendor'])) {
                            $entityName = is_array($wItem['vendor']) ? ($wItem['vendor']['name'] ?? 'Vendor') : $wItem['vendor'];
                        } elseif (!empty($wItem['customer'])) {
                            $entityName = is_array($wItem['customer']) ? ($wItem['customer']['name'] ?? 'Customer') : $wItem['customer'];
                        }

                        $pphRecords[] = [
                            'id'           => $wItem['id'] ?? rand(),
                            'number'       => $wItem['number'] ?? ('BP-' . rand(1000, 9999)),
                            'tax_category' => $pphCategory,
                            'date'         => $wItem['transDate'] ?? Carbon::now()->format('d/m/Y'),
                            'entity'       => $entityName,
                            'tax_amount'   => $amt,
                            'dpp_amount'   => round($amt * 50, 2), // Estimasi DPP 2%
                            'tax_number'   => $wItem['taxNumber'] ?? '-',
                        ];
                    }
                }
            } catch (\Exception $e) {}

            // If withholding tax API returned empty, initialize as 0 (no simulated fallback)
            if (empty($pphRecords)) {
                $totalPph23  = 0;
                $totalPph4_2 = 0;
                $totalPph22  = 0;
                $totalPph    = 0;
                $pphRecords  = [];
            }

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
                $taxNo = $inv['taxNumber'] ?? $inv['taxNumber2'] ?? null;
                $invoicesFormatted[] = [
                    'id'           => 'SALES_' . ($inv['id'] ?? rand()),
                    'type'         => 'Keluaran',
                    'invoice_no'   => $inv['number'] ?? '-',
                    'tax_number'   => $taxNo ?: '-',
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
                $taxNo = $inv['taxNumber'] ?? $inv['taxNumber2'] ?? null;
                $invoicesFormatted[] = [
                    'id'           => 'PURCHASE_' . ($inv['id'] ?? rand()),
                    'type'         => 'Masukan',
                    'invoice_no'   => $inv['number'] ?? '-',
                    'tax_number'   => $taxNo ?: '-',
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
                        'total_pph'      => $totalPph,
                        'total_pph_23'   => $totalPph23,
                        'total_pph_4_2'  => $totalPph4_2,
                        'total_pph_22'   => $totalPph22,
                        'net_ppn'        => $netPpn,
                        'status'         => $status,
                    ],
                    'pph_records' => $pphRecords,
                    'chart_data'  => array_values($monthlyDataMap),
                    'invoices'    => $invoicesFormatted,
                    'is_live_api' => true,
                ]
            ];
        });

        // Load SPT Reports list from DB (synced with real Accurate data)
        $chartData = $responseData['data']['chart_data'] ?? [];
        $monthlyMap = [];
        foreach ($chartData as $cItem) {
            if (isset($cItem['month'])) {
                $monthlyMap[$cItem['month']] = $cItem;
            }
        }
        $sptReports = $this->ensureAndGetSptReports($monthlyMap);
        $responseData['data']['spt_reports'] = $sptReports;

        return response()->json($responseData);
    }

    /**
     * Get SPT Tax Reports list (Ensuring default entries exist)
     */
    public function getSptReports()
    {
        $reports = $this->ensureAndGetSptReports();
        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    /**
     * Update SPT Tax Report Status (Setor / Lapor DJP)
     */
    public function updateSptReport(Request $request)
    {
        $request->validate([
            'period'         => 'required|string',
            'tax_type'       => 'required|string',
            'action_type'    => 'nullable|string', // 'setor' or 'lapor'
            'status'         => 'nullable|string', // 'Belum Lapor', 'Draft', 'Sudah Lapor DJP'
            'payment_status' => 'nullable|string', // 'Belum Setor', 'Sudah Setor'
            'bpe_number'     => 'nullable|string',
            'ntpn_number'    => 'nullable|string',
            'nominal'        => 'nullable|numeric',
            'notes'          => 'nullable|string',
            'bpe_file'       => 'nullable|file|mimes:pdf,jpg,png|max:5120',
        ]);

        $filePath = null;
        if ($request->hasFile('bpe_file')) {
            $file = $request->file('bpe_file');
            $fileName = 'bpe_' . str_replace(['-', ' '], '_', $request->period) . '_' . md5(time()) . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('uploads/bpe', $fileName, 'public');
        }

        $updateData = [];

        if ($request->filled('nominal')) {
            $updateData['total_tax_amount'] = (float)$request->nominal;
        }

        $action = $request->input('action_type');

        // Handle Setor (Penyetoran NTPN Bank) - strictly only when action is setor or explicitly updating payment
        if ($action === 'setor' || (!$action && ($request->filled('payment_status') || $request->filled('ntpn_number')))) {
            $pStatus = $request->input('payment_status', 'Sudah Setor');
            $updateData['payment_status'] = $pStatus;
            if ($request->filled('ntpn_number')) {
                $updateData['ntpn_number'] = $request->ntpn_number;
            }
            if ($pStatus === 'Sudah Setor') {
                $updateData['paid_at'] = Carbon::now('Asia/Jakarta');
            } else {
                $updateData['paid_at'] = null;
                $updateData['ntpn_number'] = null;
            }
        }

        // Handle Lapor (Pelaporan BPE DJP Online) - strictly only when action is lapor or explicitly updating report
        if ($action === 'lapor' || (!$action && ($request->filled('status') || $request->filled('bpe_number')))) {
            $rStatus = $request->input('status', 'Sudah Lapor DJP');
            $updateData['status'] = $rStatus;
            if ($request->filled('bpe_number')) {
                $updateData['bpe_number'] = $request->bpe_number;
            }
            if ($rStatus === 'Sudah Lapor DJP') {
                $updateData['reported_at'] = Carbon::now('Asia/Jakarta');
                $updateData['reported_by'] = auth()->user() ? auth()->user()->name : 'PIC Tax Admin';
            } else {
                $updateData['reported_at'] = null;
                $updateData['reported_by'] = null;
                $updateData['bpe_number'] = null;
            }
        }

        if ($request->has('notes')) {
            $updateData['notes'] = !empty($request->notes) ? $request->notes : null;
        }

        $existing = SptTaxReport::where('period', $request->period)
            ->where('tax_type', $request->tax_type)
            ->first();

        $finalPayStatus = $updateData['payment_status'] ?? ($existing ? $existing->payment_status : 'Belum Setor');
        $finalLaporStatus = $updateData['status'] ?? ($existing ? $existing->status : 'Belum Lapor');

        if ($request->input('clear_notes') || ($request->has('notes') && empty($request->notes)) || ($finalPayStatus === 'Belum Setor' && $finalLaporStatus === 'Belum Lapor')) {
            $updateData['notes'] = null;
        }

        if ($filePath) {
            $updateData['bpe_file_path'] = $filePath;
        }

        $report = SptTaxReport::updateOrCreate(
            [
                'period'   => $request->period,
                'tax_type' => $request->tax_type,
            ],
            $updateData
        );

        return response()->json([
            'success' => true,
            'message' => 'Status Kewajiban Pajak berhasil disimpan.',
            'data'    => $report
        ]);
    }

    /**
     * Handle bulk update for multiple SPT tax reports (Bulk Setor or Bulk Lapor)
     */
    public function bulkUpdateSptReports(Request $request)
    {
        $request->validate([
            'items'               => 'required|array|min:1',
            'items.*.period'      => 'required|string',
            'items.*.tax_type'    => 'required|string',
            'items.*.ntpn_number' => 'nullable|string',
            'items.*.bpe_number'  => 'nullable|string',
            'items.*.notes'       => 'nullable|string',
            'action_type'         => 'required|in:setor,lapor,batal_setor,batal_lapor,batal_semua',
            'ntpn_number'         => 'nullable|string',
            'bpe_number'          => 'nullable|string',
            'notes'               => 'nullable|string',
        ]);

        $action = $request->action_type;
        $items = $request->items;
        $now = Carbon::now('Asia/Jakarta');
        $updatedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($items as $item) {
                $period = $item['period'];
                $taxType = $item['tax_type'];
                $nominal = isset($item['nominal']) ? (float)$item['nominal'] : 0;

                $report = SptTaxReport::firstOrNew([
                    'period'   => $period,
                    'tax_type' => $taxType,
                ]);

                if (!$report->exists && $nominal > 0) {
                    $report->total_tax_amount = $nominal;
                }

                if ($action === 'setor') {
                    $report->payment_status = 'Sudah Setor';
                    $report->paid_at = $now;
                    $itemNtpn = !empty($item['ntpn_number']) ? $item['ntpn_number'] : $request->ntpn_number;
                    if (!empty($itemNtpn)) {
                        $report->ntpn_number = $itemNtpn;
                    }
                } elseif ($action === 'lapor') {
                    $report->status = 'Sudah Lapor DJP';
                    $report->reported_at = $now;
                    $report->reported_by = auth()->user() ? auth()->user()->name : 'PIC Tax Admin';
                    $itemBpe = !empty($item['bpe_number']) ? $item['bpe_number'] : $request->bpe_number;
                    if (!empty($itemBpe)) {
                        $report->bpe_number = $itemBpe;
                    }
                } elseif ($action === 'batal_setor') {
                    $report->payment_status = 'Belum Setor';
                    $report->ntpn_number = null;
                    $report->paid_at = null;
                    if ($report->status === 'Belum Lapor') {
                        $report->notes = null;
                    }
                } elseif ($action === 'batal_lapor') {
                    $report->status = 'Belum Lapor';
                    $report->bpe_number = null;
                    $report->reported_at = null;
                    $report->reported_by = null;
                    if ($report->payment_status === 'Belum Setor') {
                        $report->notes = null;
                    }
                } elseif ($action === 'batal_semua') {
                    $report->payment_status = 'Belum Setor';
                    $report->ntpn_number = null;
                    $report->paid_at = null;
                    $report->status = 'Belum Lapor';
                    $report->bpe_number = null;
                    $report->reported_at = null;
                    $report->reported_by = null;
                    $report->notes = null;
                }

                if (!in_array($action, ['batal_setor', 'batal_lapor', 'batal_semua'])) {
                    $itemNotes = isset($item['notes']) && $item['notes'] !== '' ? $item['notes'] : $request->notes;
                    if (!empty($itemNotes)) {
                        $report->notes = $itemNotes;
                    }
                }

                $report->save();
                $updatedCount++;
            }

            DB::commit();

            $actionText = str_starts_with($action, 'batal') ? 'pembatalan' : $action;

            return response()->json([
                'success' => true,
                'message' => "Berhasil memproses bulk {$actionText} untuk {$updatedCount} kewajiban pajak.",
                'updated_count' => $updatedCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses bulk update: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper to ensure last 6 months default SPT entries exist without any dummy hash/data
     */
    private function ensureAndGetSptReports($monthlyDataMap = [])
    {
        $taxTypes = ['PPN Masa', 'PPh 23', 'PPh 4(2)', 'PPh 21'];
        $now = Carbon::now('Asia/Jakarta');

        for ($i = 0; $i < 6; $i++) {
            $period = $now->copy()->subMonths($i)->format('Y-m');
            foreach ($taxTypes as $tType) {
                $nominal = 0;
                if ($tType === 'PPN Masa' && isset($monthlyDataMap[$period])) {
                    $nominal = max(0, ($monthlyDataMap[$period]['keluaran'] ?? 0) - ($monthlyDataMap[$period]['masukan'] ?? 0));
                }

                $record = SptTaxReport::where('period', $period)->where('tax_type', $tType)->first();
                if (!$record) {
                    SptTaxReport::create([
                        'period'           => $period,
                        'tax_type'         => $tType,
                        'total_tax_amount' => $nominal,
                        'status'           => 'Belum Lapor',
                        'payment_status'   => 'Belum Setor',
                        'bpe_number'       => null,
                        'ntpn_number'      => null,
                        'reported_at'      => null,
                        'paid_at'          => null,
                        'reported_by'      => null,
                        'notes'            => null,
                    ]);
                } else if ($tType === 'PPN Masa' && $nominal > 0 && (float)$record->total_tax_amount == 0) {
                    $record->update(['total_tax_amount' => $nominal]);
                }
            }
        }

        return SptTaxReport::orderBy('period', 'desc')->orderBy('tax_type', 'asc')->get();
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
