<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FinanceDashboardController extends Controller
{
    public function getApDashboard(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Helper closures for filtering dates
        $filterInvoiceDate = function ($query) use ($startDate, $endDate) {
            if ($startDate && $endDate) {
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
            ['name' => 'Belum Jatuh Tempo', 'value' => (float) ($agings->belum_tempo ?? 0)],
            ['name' => '1-15 Hari', 'value' => (float) ($agings->aging_1_15 ?? 0)],
            ['name' => '16-30 Hari', 'value' => (float) ($agings->aging_16_30 ?? 0)],
            ['name' => '31-45 Hari', 'value' => (float) ($agings->aging_31_45 ?? 0)],
            ['name' => '46-60 Hari', 'value' => (float) ($agings->aging_46_60 ?? 0)],
            ['name' => '> 60 Hari', 'value' => (float) ($agings->aging_over_60 ?? 0)],
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

        \Carbon\Carbon::setLocale('id'); // Ensure Indonesian month names
        if ($isSameMonth) {
            $paymentTrend = (clone $paymentQuery)
                ->selectRaw('DATE_FORMAT(payment_date, "%Y-%m-%d") as period, SUM(payment_amount) as total')
                ->groupBy('period')
                ->orderBy('period', 'asc')
                ->get()
                ->map(function ($item) {
                    $item->total = (float) $item->total;
                    $item->label = \Carbon\Carbon::parse($item->period)->translatedFormat('d M Y');
                    return $item;
                });
            $trendTitle = "Trend Pembayaran (" . \Carbon\Carbon::parse($minDate)->translatedFormat('F Y') . ")";
        } else {
            $paymentTrend = (clone $paymentQuery)
                ->selectRaw('DATE_FORMAT(payment_date, "%Y-%m") as period, SUM(payment_amount) as total')
                ->groupBy('period')
                ->orderBy('period', 'desc')
                ->limit(6)
                ->get()
                ->map(function ($item) {
                    $item->total = (float) $item->total;
                    $item->label = \Carbon\Carbon::parse($item->period . '-01')->translatedFormat('M Y');
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
            \Illuminate\Support\Facades\Artisan::call('synology:sync');
            return response()->json([
                'status' => 'success',
                'message' => 'Sync triggered successfully',
                'output' => \Illuminate\Support\Facades\Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sync failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
