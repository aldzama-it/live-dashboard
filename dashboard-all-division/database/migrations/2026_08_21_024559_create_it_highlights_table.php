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
        Schema::create('it_highlights', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // Highlight, Risk, Achievement, Plan
            $table->text('description')->nullable();
            $table->string('month')->nullable(); // e.g. Agustus
            $table->integer('year')->nullable(); // e.g. 2026
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('it_highlights');
    }
};
