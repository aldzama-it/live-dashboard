<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ItSoftwareSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $softwares = [
            // Launched software
            ['name' => 'HR Attendance System', 'status' => 'launched', 'progress' => 100, 'active_users' => 1250, 'description' => 'Employee attendance tracking'],
            ['name' => 'Internal Chat App', 'status' => 'launched', 'progress' => 100, 'active_users' => 3120, 'description' => 'Company-wide communication tool'],
            ['name' => 'Finance Dashboard', 'status' => 'launched', 'progress' => 100, 'active_users' => 45, 'description' => 'Financial reporting and analysis'],
            ['name' => 'Inventory Manager', 'status' => 'launched', 'progress' => 100, 'active_users' => 320, 'description' => 'Warehouse and asset management'],
            ['name' => 'CRM Portal', 'status' => 'launched', 'progress' => 100, 'active_users' => 850, 'description' => 'Customer relationship management'],
            
            // In development software
            ['name' => 'ERP System Alpha', 'status' => 'development', 'progress' => 75, 'active_users' => 0, 'description' => 'Next-gen ERP integration'],
            ['name' => 'AI Support Chatbot', 'status' => 'development', 'progress' => 40, 'active_users' => 0, 'description' => 'Automated ticketing responses'],
            ['name' => 'Mobile App v2.0', 'status' => 'development', 'progress' => 15, 'active_users' => 0, 'description' => 'Revamp of the employee portal app']
        ];

        foreach ($softwares as $sw) {
            \App\Models\ItSoftware::create($sw);
        }
    }
}
