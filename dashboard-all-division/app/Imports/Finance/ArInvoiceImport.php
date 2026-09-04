<?php

namespace App\Imports\Finance;

use App\Models\Finance\ArInvoice;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

class ArInvoiceImport implements ToCollection, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                ArInvoice::truncate();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        $currentCustomer = null;

        foreach ($rows as $index => $row) {
            $clean = array_values(array_filter($row->toArray(), fn($v) => trim((string)$v) !== ''));
            $count = count($clean);

            if ($count === 0) continue;

            if ($count === 4 && isset($clean[1]) && trim((string)$clean[1]) === 'Sisa Kredit') {
                $currentCustomer = trim((string)$clean[0]);
                continue;
            }

            if ($count === 1) {
                // skip single lines that might be headers
                continue;
            }

            if ($currentCustomer && ($count === 7 || $count === 6)) {
                try {
                    $invNo = trim((string)$clean[0]);
                    
                    if ($invNo === 'Nomor #') continue;

                    $dateVal = $clean[1];
                    $dueDateVal = $clean[2];

                    $invoiceDate = is_numeric($dateVal) ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateVal)->format('Y-m-d') : null;
                    $dueDate = is_numeric($dueDateVal) ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dueDateVal)->format('Y-m-d') : null;

                    ArInvoice::create([
                        'customer' => $currentCustomer,
                        'invoice_no' => $invNo,
                        'invoice_date' => $invoiceDate,
                        'due_date' => $dueDate,
                        'total_amount' => (float)($clean[3] ?? 0),
                        'outstanding_amount' => (float)($clean[4] ?? 0),
                        'age_days' => (int)($clean[6] ?? 0),
                    ]);
                } catch (\Exception $e) {
                    Log::warning("ArInvoiceImport: Failed to parse row $index - " . $e->getMessage());
                }
            }
        }
    }
}
