<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'manage-divisions',
            'manage-departments',
            'manage-pages',
            'manage-users',
            'upload-data',
            'export-data',
            'view-data',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->syncPermissions(Permission::all());

        $divisionAdmin = Role::firstOrCreate(['name' => 'division-admin']);
        $divisionAdmin->syncPermissions([
            'manage-departments',
            'manage-pages',
            'upload-data',
            'export-data',
            'view-data',
        ]);

        $staff = Role::firstOrCreate(['name' => 'department-staff']);
        $staff->syncPermissions([
            'upload-data',
            'export-data',
            'view-data',
        ]);

        $viewer = Role::firstOrCreate(['name' => 'viewer']);
        $viewer->syncPermissions([
            'view-data',
        ]);
    }
}