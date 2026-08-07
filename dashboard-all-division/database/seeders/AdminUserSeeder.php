<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => config('services.admin.email')],
            [
                'name' => config('services.admin.name'),
                'password' => bcrypt(config('services.admin.password')),
                'email_verified_at' => now(),
            ]
        );

        $user->assignRole('super-admin');

        $this->command->info('Admin user siap: ' . $user->email);
    }
}