<?php

namespace App\Imports\Finance;

use App\Models\ApPayment;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

class ApPaymentImport implements ToCollection, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                ApPayment::truncate();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            $clean = array_values(array_filter($row->toArray(), fn($v) => trim((string)$v) !== ''));
            $count = count($clean);

            if ($count < 3) continue;

            $col0 = trim((string)$clean[0]);
            if ($col0 === 'Nomor #' || $col0 === 'Total') continue;

            // Check if col 1 is a date
            $dateVal = $clean[1];
            $isDate = is_numeric($dateVal) || (bool)strtotime(str_replace('/', '-', $dateVal));
            
            if ($isDate) {
                try {
                    $paymentDate = is_numeric($dateVal) 
                        ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateVal)->format('Y-m-d')
                        : Carbon::createFromFormat('d/m/Y', $dateVal)->format('Y-m-d');

                    if ($index < 10) {
                        Log::info("AP Payment Row $index:", $clean);
                    }

                    ApPayment::create([
                        'voucher_no' => $col0,
                        'payment_date' => $paymentDate,
                        'vendor' => trim((string)($clean[3] ?? '')),
                        'payment_amount' => (float)($clean[4] ?? 0),
                        'bank_name' => trim((string)($clean[5] ?? '')),
                    ]);
                } catch (\Exception $e) {
                    Log::warning("ApPaymentImport: Failed to parse row $index - " . $e->getMessage());
                }
            }
        }
    }
}
