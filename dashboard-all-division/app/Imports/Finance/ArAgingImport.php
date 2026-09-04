<?php

namespace App\Imports\Finance;

use App\Models\Finance\ArAging;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

class ArAgingImport implements ToCollection, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                ArAging::truncate();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            $clean = array_values(array_filter($row->toArray(), fn($v) => trim((string)$v) !== ''));
            $count = count($clean);

            if ($count === 0) continue;

            try {
                if ($count === 10 || $count === 9) {
                    $offset = ($count === 10) ? 1 : 0;
                    
                    $customer = trim((string)$clean[$offset]);
                    if ($customer === 'Pelanggan' || strtolower($customer) === 'total') continue;

                    ArAging::create([
                        'customer' => $customer,
                        'total_outstanding' => (float)($clean[$offset + 1] ?? 0),
                        'not_due' => (float)($clean[$offset + 2] ?? 0),
                        'days_1_15' => (float)($clean[$offset + 3] ?? 0),
                        'days_16_30' => (float)($clean[$offset + 4] ?? 0),
                        'days_31_45' => (float)($clean[$offset + 5] ?? 0),
                        'days_46_60' => (float)($clean[$offset + 6] ?? 0),
                        'days_over_60' => (float)($clean[$offset + 7] ?? 0),
                    ]);
                }
            } catch (\Exception $e) {
                Log::warning("ArAgingImport: Failed to parse row $index - " . $e->getMessage());
            }
        }
    }
}
