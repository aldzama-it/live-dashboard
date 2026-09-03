<?php

namespace App\Imports;

use App\Models\ItAsset;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ItAssetImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['asset_name'])) {
            return null;
        }

        $handoverDate = null;
        if (!empty($row['handover_date'])) {
            if (is_numeric($row['handover_date'])) {
                $handoverDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row['handover_date'])->format('Y-m-d');
            } else {
                try {
                    $handoverDate = \Carbon\Carbon::parse($row['handover_date'])->format('Y-m-d');
                } catch (\Exception $e) {
                    $handoverDate = null;
                }
            }
        }

        return new ItAsset([
            'type' => $row['type'] ?? 'general',
            'asset_name' => $row['asset_name'],
            'brand_description' => $row['brand_description'] ?? null,
            'location' => $row['location'] ?? null,
            'condition' => $row['condition'] ?? 'Baik',
            'receiver_name' => $row['receiver_name'] ?? null,
            'department' => $row['department'] ?? null,
            'division_project' => $row['division_project'] ?? null,
            'handover_date' => $handoverDate,
            'specification' => $row['specification'] ?? null,
        ]);
    }
}
