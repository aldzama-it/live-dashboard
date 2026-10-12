<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Department;
use Illuminate\Database\Seeder;

class DivisionDepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $structure = [
            'Finance & Administration' => [
                'FINADM' => [
                    'Finance',
                    'HRD',
                    'Legal',
                    'QMS',
                    'IT & System',
                ],
            ],
            'Sales & Engineering' => [
                'SALESENG' => [
                    'Business Development',
                    'Trading',
                    'Marketing & Communication',
                    'Engineering',
                    'RnD',
                ],
            ],
            'Operations' => [
                'OPS' => [
                    'Site Operations',
                    'Project Control',
                    'HSE',
                ],
            ],
            'Asset & Logistics' => [
                'ASSETLOG' => [
                    'Asset Maintenance',
                    'Transport',
                    'Procurement',
                    'Warehouse',
                ],
            ],
            'Projects' => [
                'PROJ' => [
                    'Ad-Hoc Projects',
                    'Fabrication & Hydraulic',
                ],
            ],
            'General Affairs' => [
                'GA' => [
                    'Office Support',
                    'External Relation',
                    'Export & Import',
                ],
            ],
        ];

        foreach ($structure as $departmentName => $codeAndDivisions) {
            foreach ($codeAndDivisions as $departmentCode => $divisions) {
                $department = Department::firstOrCreate(
                    ['code' => $departmentCode],
                    ['name' => $departmentName]
                );

                foreach ($divisions as $index => $divisionName) {
                    $divisionCode = $departmentCode . '-' . ($index + 1);

                    Division::firstOrCreate(
                        [
                            'department_id' => $department->id,
                            'name' => $divisionName,
                        ],
                        ['code' => $divisionCode]
                    );
                }
            }
        }
    }
}