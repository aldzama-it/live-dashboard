<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('spt_tax_reports', function (Blueprint $table) {
            $table->string('payment_status')->default('Belum Setor')->after('status'); // 'Belum Setor', 'Sudah Setor'
            $table->string('ntpn_number')->nullable()->after('bpe_number'); // Nomor NTPN / Bukti Setor Bank
            $table->timestamp('paid_at')->nullable()->after('reported_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('spt_tax_reports', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'ntpn_number', 'paid_at']);
        });
    }
};
