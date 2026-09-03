<?php

namespace App\Imports\Finance;

use App\Models\ApPaymentDetail;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

class ApPaymentDetailImport implements ToCollection, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                ApPaymentDetail::truncate();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        $currentVoucher = null;

        foreach ($rows as $index => $row) {
            $clean = array_values(array_filter($row->toArray(), fn($v) => trim((string)$v) !== ''));
            $count = count($clean);

            if ($count === 0) continue;

            $col0 = trim((string)$clean[0]);
            if ($col0 === 'Total' || strpos(strtolower($col0), 'rincian') !== false || strpos(strtolower($col0), 'cabang') !== false) continue;

            // Voucher row usually has just Voucher No and Date
            $isDateCol1 = isset($clean[1]) ? (is_numeric($clean[1]) || (bool)strtotime(str_replace('/', '-', $clean[1]))) : false;
            
            if ($isDateCol1 && $count <= 3) {
                // This might be a voucher row
                if ($col0 !== 'Nomor #') {
                    $currentVoucher = $col0;
                }
                continue;
            }

            // Detect invoice detail row (has invoice no, invoice date, and amounts)
            if ($currentVoucher && $isDateCol1 && $count >= 5) {
                if ($col0 === 'No. Faktur Pajak' || $col0 === 'No. Faktur') continue;

                try {
                    $dateVal = $clean[1];
                    $invoiceDate = is_numeric($dateVal) 
                        ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateVal)->format('Y-m-d')
                        : Carbon::createFromFormat('d/m/Y', $dateVal)->format('Y-m-d');

                    ApPaymentDetail::create([
                        'voucher_no' => $currentVoucher,
                        'invoice_no' => $col0,
                        'invoice_date' => $invoiceDate,
                        'total_invoice_amount' => (float)($clean[2] ?? 0),
                        'payment_amount' => (float)($clean[3] ?? 0),
                        'discount_amount' => (float)($clean[4] ?? 0),
                        'total_payment' => (float)($clean[5] ?? 0),
                    ]);
                } catch (\Exception $e) {
                    Log::warning("ApPaymentDetailImport: Failed to parse row $index - " . $e->getMessage());
                }
            }
        }
    }
}
