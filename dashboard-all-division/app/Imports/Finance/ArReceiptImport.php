<?php

namespace App\Imports\Finance;

use App\Models\Finance\ArReceipt;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

class ArReceiptImport implements ToCollection, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                ArReceipt::truncate();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            $clean = array_values(array_filter($row->toArray(), fn($v) => trim((string)$v) !== ''));
            $count = count($clean);

            if ($count < 4) continue;

            $receiptNo = trim((string)$clean[0]);
            
            if ($receiptNo === 'Nomor #' || strtolower($receiptNo) === 'total') continue;

            // Date is usually the second column
            $dateVal = $clean[1];
            
            // If it's a currency header row, skip it
            if (preg_match('/\b(rupiah|dollar|usd|yuan|renminbi)\b/i', $receiptNo)) continue;

            try {
                $receiptDate = is_numeric($dateVal) ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateVal)->format('Y-m-d') : null;

                // Customer and Amount are always the last two columns
                $customer = trim((string)$clean[$count - 2]);
                $amount = (float)($clean[$count - 1]);

                ArReceipt::create([
                    'receipt_no' => $receiptNo,
                    'receipt_date' => $receiptDate,
                    'customer' => $customer,
                    'total_amount' => $amount,
                ]);
            } catch (\Exception $e) {
                Log::warning("ArReceiptImport: Failed to parse row $index - " . $e->getMessage());
            }
        }
    }
}
