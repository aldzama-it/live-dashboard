<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxPpnRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaxController extends Controller
{
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
