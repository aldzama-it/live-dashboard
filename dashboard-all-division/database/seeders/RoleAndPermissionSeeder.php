<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $rolePic = Role::firstOrCreate(['name' => 'Division PIC', 'guard_name' => 'web']);
        $roleTopManagement = Role::firstOrCreate(['name' => 'Top Management', 'guard_name' => 'web']);

        // Create or get the default Admin user
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@dashboard.local'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
            ]
        );

        // Assign Admin role
        if (!$adminUser->hasRole('Admin')) {
            $adminUser->assignRole($roleAdmin);
        }
    }
}
