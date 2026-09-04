<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Finance\ArInvoice;
use App\Models\Finance\ArAging;
use App\Models\Finance\ArReceipt;

class ArDashboardController extends Controller
{
    public function getArDashboard(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $filterInvoiceDate = function ($query) use ($startDate, $endDate) {
            if ($startDate && $endDate) {
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
}
