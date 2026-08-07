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

        foreach ($structure as $divisionName => $codeAndDepartments) {
            foreach ($codeAndDepartments as $divisionCode => $departments) {
                $division = Division::firstOrCreate(
                    ['code' => $divisionCode],
                    ['name' => $divisionName]
                );

                foreach ($departments as $index => $departmentName) {
                    $departmentCode = $divisionCode . '-' . ($index + 1);

                    Department::firstOrCreate(
                        [
                            'division_id' => $division->id,
                            'name' => $departmentName,
                        ],
                        ['code' => $departmentCode]
                    );
                }
            }
        }
    }
}