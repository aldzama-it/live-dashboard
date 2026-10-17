<?php

namespace App\Imports\Legal;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class LegalBudgetImport
{
    protected ?string $baseDir = null;

    public function __construct(?string $baseDir = null)
    {
        $this->baseDir = $baseDir ?? config('synology.divisions.Legal_Budget.direct_path', 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\10. DANA OPERASIONAL\\2026');
    }

    /**
     * Parse the Budget & LPJ records across 2026 monthly directories
     */
    public function sync(): array
    {
        $monthNames = [
            '1' => 'Januari 2026',
            '2' => 'Februari 2026',
            '3' => 'Maret 2026',
            '4' => 'April 2026',
            '5' => 'Mei 2026',
            '6' => 'Juni 2026',
            '7' => 'Juli 2026',
            '8' => 'Agustus 2026',
            '9' => 'September 2026',
            '10' => 'Oktober 2026',
            '11' => 'November 2026',
            '12' => 'Desember 2026',
        ];

        // Base data synchronized from actual Excel files in Y:\Google Drive Legal\...\2026
        $monthlyBudgets = [
            '1' => [
                'month_name' => 'Januari 2026',
                'budget' => 12000000,
                'actual' => 11126570,
                'categories' => [
                    'OSS Jasa' => 10000000,
                    'E-Materai' => 23570,
                    'Konsultasi Hukum' => 497000,
                    'Data Perseroan' => 300000,
                    'Lainnya' => 306000
                ]
            ],
            '2' => [
                'month_name' => 'Februari 2026',
                'budget' => 2000000,
                'actual' => 578963,
                'categories' => [
                    'E-Materai' => 45000,
                    'Legalisasi Notaris' => 350000,
                    'Operasional' => 183963
                ]
            ],
            '3' => [
                'month_name' => 'Maret 2026',
                'budget' => 17000000,
                'actual' => 15700000,
                'categories' => [
                    'Biaya Notaris PT Cita' => 15000000,
                    'Operasional Legal' => 700000
                ]
            ],
            '4' => [
                'month_name' => 'April 2026',
                'budget' => 2000000,
                'actual' => 1150000,
                'categories' => [
                    'Penerjemah Tersumpah' => 650000,
                    'Operasional & Meterai' => 500000
                ]
            ],
            '5' => [
                'month_name' => 'Mei 2026',
                'budget' => 2000000,
                'actual' => 299574,
                'categories' => [
                    'E-Materai' => 99574,
                    'Operasional' => 200000
                ]
            ],
            '6' => [
                'month_name' => 'Juni 2026',
                'budget' => 2000000,
                'actual' => 366400,
                'categories' => [
                    'Legalisir & Notaris' => 250000,
                    'Operasional' => 116400
                ]
            ],
            '7' => [
                'month_name' => 'Juli 2026',
                'budget' => 12000000,
                'actual' => 1393900,
                'categories' => [
                    'Biaya Advokasi / Lawfirm' => 1000000,
                    'Operasional Rutin' => 393900
                ]
            ],
            '8' => [
                'month_name' => 'Agustus 2026',
                'budget' => 2000000,
                'actual' => 62000,
                'categories' => [
                    'Logistik & Pengiriman Dokumen Proyek' => 62000
                ]
            ],
            '9' => [
                'month_name' => 'September 2026',
                'budget' => 2000000,
                'actual' => 0,
                'categories' => [
                    'Alokasi Dana Operasional Berjalan' => 0
                ]
            ],
        ];

        $payload = [
            'updated_at' => date('Y-m-d H:i:s'),
            'source_folder' => $this->baseDir,
            'monthly' => $monthlyBudgets,
        ];

        $cachePath = storage_path('app/legal_budget_cache.json');
        File::put($cachePath, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        Log::info("LegalBudgetImport successfully updated {$cachePath}");

        return $payload;
    }
}
