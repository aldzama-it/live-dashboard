<?php
namespace App\Imports;
use App\Models\ItTicket;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ItTicketImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['ticket_number']) || empty($row['subject'])) return null;
        
        $resolvedAt = null;
        if (!empty($row['resolved_at'])) {
            if (is_numeric($row['resolved_at'])) {
                $resolvedAt = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row['resolved_at'])->format('Y-m-d H:i:s');
            } else {
                try {
                    $resolvedAt = Carbon::parse($row['resolved_at'])->format('Y-m-d H:i:s');
                } catch (\Exception $e) {}
            }
        }

        return new ItTicket([
            'ticket_number' => $row['ticket_number'],
            'department' => $row['department'] ?? null,
            'category' => $row['category'] ?? null,
            'subject' => $row['subject'],
            'description' => $row['description'] ?? null,
            'status' => $row['status'] ?? 'Open',
            'priority' => $row['priority'] ?? 'Medium',
            'assigned_to' => $row['assigned_to'] ?? null,
            'resolved_at' => $resolvedAt,
        ]);
    }
}
