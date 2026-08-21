<?php

namespace App\Imports;

use App\Models\ItEmail;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ItEmailImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['email_address'])) {
            return null;
        }

        return new ItEmail([
            'email_address' => $row['email_address'],
            'domain' => $row['domain'] ?? null,
            'user_name' => $row['user_name'] ?? null,
            'department' => $row['department'] ?? null,
            'division_project' => $row['division_project'] ?? null,
        ]);
    }
}
