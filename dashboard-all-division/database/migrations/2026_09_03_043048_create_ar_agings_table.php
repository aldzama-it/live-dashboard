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
        Schema::create('ar_agings', function (Blueprint $table) {
            $table->id();
            $table->string('customer')->nullable();
            $table->decimal('total_outstanding', 20, 2)->default(0);
            $table->decimal('not_due', 20, 2)->default(0);
            $table->decimal('days_1_15', 20, 2)->default(0);
            $table->decimal('days_16_30', 20, 2)->default(0);
            $table->decimal('days_31_45', 20, 2)->default(0);
            $table->decimal('days_46_60', 20, 2)->default(0);
            $table->decimal('days_over_60', 20, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ar_agings');
    }
};
