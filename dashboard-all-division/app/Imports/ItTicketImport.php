<?php
namespace App\Imports;

use App\Models\ItTicket;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;
use Illuminate\Support\Collection;

class ItTicketImport implements ToCollection, WithHeadingRow, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                ItTicket::truncate();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        $inserts = [];
        $now = now()->format('Y-m-d H:i:s');

        foreach ($rows as $row) {
            $row = $row->toArray();

            if (empty($row['ticket_number']) || empty($row['subject'])) continue;

            // Parse created_at
            $createdAt = $now;
            if (!empty($row['created_at'])) {
                if (is_numeric($row['created_at'])) {
                    $createdAt = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row['created_at'])->format('Y-m-d H:i:s');
                } else {
                    try {
                        $createdAt = Carbon::parse($row['created_at'])->format('Y-m-d H:i:s');
                    } catch (\Exception $e) {}
                }
            }

            // Parse resolved_at
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

            $inserts[] = [
                'ticket_number' => $row['ticket_number'],
                'department'    => $row['department'] ?? null,
                'category'      => $row['category'] ?? null,
                'subject'       => $row['subject'],
                'description'   => $row['description'] ?? null,
                'status'        => $row['status'] ?? 'Open',
                'priority'      => $row['priority'] ?? 'Medium',
                'assigned_to'   => $row['assigned_to'] ?? null,
                'created_at'    => $createdAt,
                'updated_at'    => $now,
                'resolved_at'   => $resolvedAt,
            ];
        }

        // Bulk insert in chunks untuk performa
        foreach (array_chunk($inserts, 200) as $chunk) {
            DB::table('it_tickets')->insert($chunk);
        }
    }
}
