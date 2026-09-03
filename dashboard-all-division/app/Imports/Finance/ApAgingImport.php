<?php

namespace App\Imports\Finance;

use App\Models\ApAging;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

class ApAgingImport implements ToCollection, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                ApAging::truncate();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        $currentVendor = null;
        $currentCurrency = null;

        foreach ($rows as $index => $row) {
            $clean = array_values(array_filter($row->toArray(), fn($v) => trim((string)$v) !== ''));
            $count = count($clean);

            if ($count === 0) continue;

            if ($count === 1) {
                $val = trim((string)$clean[0]);
                if (stripos($val, 'rupiah') !== false || stripos($val, 'dollar') !== false || stripos($val, 'yuan') !== false || stripos($val, 'renminbi') !== false) {
                    $currentCurrency = $val;
                } elseif (strtolower($val) !== 'total' && strpos(strtolower($val), 'cabang') === false && strpos(strtolower($val), 'per tgl') === false && strpos(strtolower($val), 'rincian umur utang') === false && strpos(strtolower($val), 'pt aldzama') === false) {
                    $currentVendor = $val;
                }
                continue;
            }

            if ($currentVendor && $count >= 8) {
                try {
                    $invNo = trim((string)$clean[0]);
                    
                    if ($invNo === 'Nomor Faktur' || $invNo === 'Nomor #') continue;

                    $dateVal = $clean[1];
                    $invoiceDate = is_numeric($dateVal) ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateVal)->format('Y-m-d') : null;

                    ApAging::create([
                        'vendor' => $currentVendor,
                        'currency' => $currentCurrency,
                        'invoice_no' => $invNo,
                        'invoice_date' => $invoiceDate,
                        'total_utang' => (float)($clean[2] ?? 0),
                        'belum_tempo' => (float)($clean[3] ?? 0),
                        'aging_1_15' => (float)($clean[4] ?? 0),
                        'aging_16_30' => (float)($clean[5] ?? 0),
                        'aging_31_45' => (float)($clean[6] ?? 0),
                        'aging_46_60' => (float)($clean[7] ?? 0),
                        'aging_over_60' => (float)($clean[8] ?? 0),
                    ]);
                } catch (\Exception $e) {
                    Log::warning("ApAgingImport: Failed to parse row $index - " . $e->getMessage());
                }
            }
        }
    }
}
