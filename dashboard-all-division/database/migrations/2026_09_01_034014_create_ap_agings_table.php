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
        Schema::create('ap_agings', function (Blueprint $table) {
            $table->id();
            $table->string('currency')->nullable();
            $table->string('vendor')->nullable();
            $table->string('invoice_no')->nullable();
            $table->date('invoice_date')->nullable();
            $table->decimal('total_utang', 20, 2)->default(0);
            $table->decimal('belum_tempo', 20, 2)->default(0);
            $table->decimal('aging_1_15', 20, 2)->default(0);
            $table->decimal('aging_16_30', 20, 2)->default(0);
            $table->decimal('aging_31_45', 20, 2)->default(0);
            $table->decimal('aging_46_60', 20, 2)->default(0);
            $table->decimal('aging_over_60', 20, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ap_agings');
    }
};
