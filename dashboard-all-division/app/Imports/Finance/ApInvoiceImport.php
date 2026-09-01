<?php

namespace App\Imports\Finance;

use App\Models\ApInvoice;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

class ApInvoiceImport implements ToCollection, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                // Truncate table before import to keep data fresh
                ApInvoice::truncate();
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
                if (preg_match('/\b(rupiah|dollar|usd|yuan|renminbi)\b/i', $val)) {
                    $currentCurrency = $val;
                } else {
                    $excluded = [
                        'total', 'cabang', 'per tgl', 'faktur belum lunas', 
                        'pt aldzama', 'tercetak pada', 'halaman', 'accurate accounting'
                    ];
                    $isExcluded = false;
                    foreach ($excluded as $exc) {
                        if (strpos(strtolower($val), $exc) !== false) {
                            $isExcluded = true;
                            break;
                        }
                    }
                    if (!$isExcluded) {
                        $currentVendor = $val;
                    }
                }
                continue;
            }

            if ($currentVendor && ($count === 7 || $count === 6)) {
                try {
                    $invNo = trim((string)$clean[0]);
                    
                    if ($invNo === 'Nomor #') continue;

                    // Dates in Excel are often numeric serials
                    $dateVal = $clean[1];
                    $dueDateVal = $clean[2];

                    $invoiceDate = is_numeric($dateVal) ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateVal)->format('Y-m-d') : null;
                    $dueDate = is_numeric($dueDateVal) ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dueDateVal)->format('Y-m-d') : null;

                    ApInvoice::create([
                        'vendor' => $currentVendor,
                        'currency' => $currentCurrency,
                        'invoice_no' => $invNo,
                        'invoice_date' => $invoiceDate,
                        'due_date' => $dueDate,
                        'total_amount' => (float)($clean[3] ?? 0),
                        'outstanding_amount' => (float)($clean[4] ?? 0),
                        'tax_amount' => (float)($clean[5] ?? 0),
                        'age_days' => (int)($clean[6] ?? 0),
                    ]);
                } catch (\Exception $e) {
                    Log::warning("ApInvoiceImport: Failed to parse row $index - " . $e->getMessage());
                }
            }
        }
    }
}
