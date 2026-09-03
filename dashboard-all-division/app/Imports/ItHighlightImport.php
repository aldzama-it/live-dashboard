<?php

namespace App\Imports;

use App\Models\ItHighlight;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ItHighlightImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['type'])) {
            return null;
        }

        $type = $row['type'];
        $month = $row['month'] ?? null;
        $year = $row['year'] ?? null;

        return ItHighlight::updateOrCreate(
            [
                'type' => $type,
                'month' => $month,
                'year' => $year,
            ],
            [
                'description' => $row['description'] ?? null,
            ]
        );
    }
}
