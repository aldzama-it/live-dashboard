<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ItTicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        $tickets = [
            [
                'ticket_number' => 'INC-1001',
                'subject' => 'Jaringan Wifi di lantai 2 sangat lambat',
                'description' => 'Halo tim IT, jaringan wifi di ruang meeting lantai 2 HRD putus nyambung dari pagi. Tolong dicek. Email saya budi@aldzama.com atau hubungi 081234567890.',
                'assigned_to' => 'Andi Pratama',
                'created_at' => clone $now->subMinutes(120),
                'resolved_at' => clone $now->subMinutes(30),
            ],
            [
                'ticket_number' => 'INC-1002',
                'subject' => 'Lupa password email',
                'description' => 'Saya lupa password email perusahaan aldzama.com. Tolong resetkan password saya secepatnya.',
                'assigned_to' => 'Budi Santoso',
                'created_at' => clone $now->subMinutes(300),
                'resolved_at' => clone $now->subMinutes(100),
            ],
            [
                'ticket_number' => 'INC-1003',
                'subject' => 'Printer error paper jam',
                'description' => 'Printer Brother di ruangan finance nyangkut kertasnya (paper jam). Tolong mekanik segera perbaiki.',
                'assigned_to' => 'Budi Santoso',
                'created_at' => clone $now->subMinutes(60),
                'resolved_at' => clone $now->subMinutes(10),
            ],
            [
                'ticket_number' => 'INC-1004',
                'subject' => 'Koneksi internet lambat sekali',
                'description' => 'Jaringan internet dan LAN sangat lambat untuk upload dokumen ke server.',
                'assigned_to' => 'Siti Aminah',
                'created_at' => clone $now->subMinutes(400),
                'resolved_at' => clone $now->subMinutes(250),
            ],
            [
                'ticket_number' => 'INC-1005',
                'subject' => 'Password reset untuk akun ERP',
                'description' => 'Mohon bantu reset password untuk aplikasi ERP, akun saya terkunci.',
                'assigned_to' => 'Andi Pratama',
                'created_at' => clone $now->subMinutes(500),
                'resolved_at' => clone $now->subMinutes(400),
            ]
        ];

        foreach ($tickets as $t) {
            DB::table('it_tickets')->insert($t);
        }
    }
}
