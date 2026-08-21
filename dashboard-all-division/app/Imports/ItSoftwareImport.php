<?php
namespace App\Imports;
use App\Models\ItSoftware;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ItSoftwareImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['name'])) return null;
        return new ItSoftware([
            'name' => $row['name'],
            'status' => $row['status'] ?? 'development',
            'progress' => $row['progress'] ?? 0,
            'active_users' => $row['active_users'] ?? 0,
            'description' => $row['description'] ?? null,
        ]);
    }
}
