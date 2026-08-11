<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            RoleAndPermissionSeeder::class, // Added to prevent RBAC loss
            AdminUserSeeder::class,
            DivisionDepartmentSeeder::class,
            ItTicketSeeder::class, // Added to ensure ticket data is seeded
            ItBudgetSeeder::class,
        ]);
    }
}