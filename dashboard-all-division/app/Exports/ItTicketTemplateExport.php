<?php
namespace App\Exports;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ItTicketTemplateExport implements FromArray, WithHeadings, WithStyles
{
    public function array(): array
    {
        return [
            ['TKT-001', 'Finance', 'Hardware', 'Laptop Mati', 'Layar blank saat dinyalakan', 'Open', 'High', 'Budi', '']
        ];
    }
    public function headings(): array
    {
        return ['ticket_number', 'department', 'category', 'subject', 'description', 'status', 'priority', 'assigned_to', 'resolved_at'];
    }
    public function styles(Worksheet )
    {
        return [1 => ['font' => ['bold' => true]]];
    }
}
