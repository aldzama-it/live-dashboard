<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ItEmailTemplateExport implements FromArray, WithHeadings, WithStyles
{
    public function array(): array
    {
        return [
            ['wanda@aldzama.com', '@aldzama.com', 'Wanda', 'IT', 'Internal'],
            ['budi@project.aldzama.com', '@project.aldzama.com', 'Budi', 'Engineering', 'Proyek A']
        ];
    }

    public function headings(): array
    {
        return [
            'email_address',
            'domain',
            'user_name',
            'department',
            'division_project'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1    => ['font' => ['bold' => true]],
        ];
    }
}
