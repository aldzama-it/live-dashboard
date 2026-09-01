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
        Schema::create('ap_payment_details', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_no')->nullable();
            $table->string('invoice_no')->nullable();
            $table->date('invoice_date')->nullable();
            $table->decimal('total_invoice_amount', 20, 2)->default(0);
            $table->decimal('payment_amount', 20, 2)->default(0);
            $table->decimal('discount_amount', 20, 2)->default(0);
            $table->decimal('total_payment', 20, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ap_payment_details');
    }
};
