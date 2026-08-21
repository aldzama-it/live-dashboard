<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ItBudgetExpenseTemplateExport implements FromArray, WithHeadings, WithStyles
{
    public function array(): array
    {
        return [
            ['2026-08-01', 'License Adobe CC', 'Software', '15000000'],
            ['2026-08-05', 'Beli Monitor Baru', 'Hardware', '3000000']
        ];
    }

    public function headings(): array
    {
        return [
            'expense_date',
            'description',
            'group_category',
            'amount'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1    => ['font' => ['bold' => true]],
        ];
    }
}
