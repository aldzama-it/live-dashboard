<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ItAssetTemplateExport implements FromArray, WithHeadings, WithStyles
{
    public function array(): array
    {
        return [
            ['general', 'Monitor LG 24"', 'LG 24MP400', 'Head Office', 'Baik', '', '', '', '', ''],
            ['individual', 'Laptop Lenovo Thinkpad', '', '', 'Baik', 'Wanda', 'IT', 'Internal', '2026-08-01', 'Core i7, 16GB RAM']
        ];
    }

    public function headings(): array
    {
        return [
            'type',
            'asset_name',
            'brand_description',
            'location',
            'condition',
            'receiver_name',
            'department',
            'division_project',
            'handover_date',
            'specification'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1    => ['font' => ['bold' => true]],
        ];
    }
}
