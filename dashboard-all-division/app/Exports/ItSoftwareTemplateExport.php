<?php
namespace App\Exports;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ItSoftwareTemplateExport implements FromArray, WithHeadings, WithStyles
{
    public function array(): array
    {
        return [
            ['ERP System', 'launched', '100', '1500', 'Sistem utama perusahaan'],
            ['HR Portal', 'development', '45', '0', 'Portal untuk HR']
        ];
    }
    public function headings(): array
    {
        return ['name', 'status', 'progress', 'active_users', 'description'];
    }
    public function styles(Worksheet )
    {
        return [1 => ['font' => ['bold' => true]]];
    }
}
