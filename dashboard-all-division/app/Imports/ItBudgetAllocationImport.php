<?php

namespace App\Imports;

use App\Models\ItBudget;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ItBudgetAllocationImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['month']) || empty($row['year']) || empty($row['category'])) {
            return null;
        }

        return ItBudget::updateOrCreate([
            'month' => $row['month'],
            'year' => $row['year'],
            'category' => $row['category'],
        ], [
            'allocated_amount' => $row['allocated_amount'] ?? 0,
        ]);
    }
}
