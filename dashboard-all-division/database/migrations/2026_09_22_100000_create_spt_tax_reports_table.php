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
        Schema::create('spt_tax_reports', function (Blueprint $table) {
            $table->id();
            $table->string('period')->index(); // e.g. '2026-08' or '2026-09'
            $table->string('tax_type')->index(); // e.g. 'PPN Masa', 'PPh 23', 'PPh 4(2)', 'PPh 21'
            $table->decimal('total_tax_amount', 15, 2)->default(0);
            $table->string('status')->default('Belum Lapor'); // 'Belum Lapor', 'Draft', 'Sudah Lapor DJP'
            $table->string('bpe_number')->nullable(); // Nomor BPE DJP Online
            $table->string('bpe_file_path')->nullable(); // Path PDF BPE
            $table->timestamp('reported_at')->nullable();
            $table->string('reported_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['period', 'tax_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('spt_tax_reports');
    }
};
