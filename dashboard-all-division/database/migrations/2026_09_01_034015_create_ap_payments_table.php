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
        Schema::create('ap_payments', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_no')->nullable();
            $table->date('payment_date')->nullable();
            $table->string('check_no')->nullable();
            $table->date('check_date')->nullable();
            $table->string('vendor')->nullable();
            $table->decimal('payment_amount', 20, 2)->default(0);
            $table->string('bank_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ap_payments');
    }
};
