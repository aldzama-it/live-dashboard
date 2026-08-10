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
        Schema::create('it_assets', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'general' or 'individual'
            $table->string('asset_name');
            $table->string('brand_description')->nullable();
            $table->string('location')->nullable();
            $table->string('condition')->nullable();
            
            // For individual assets
            $table->string('receiver_name')->nullable();
            $table->string('department')->nullable();
            $table->string('division_project')->nullable();
            $table->date('handover_date')->nullable();
            $table->string('specification')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('it_assets');
    }
};
