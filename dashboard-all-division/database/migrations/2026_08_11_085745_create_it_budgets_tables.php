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
        Schema::create('it_budgets', function (Blueprint $table) {
            $table->id();
            $table->string('month')->nullable(); // e.g., 'Januari'
            $table->integer('year');
            $table->string('category');
            $table->decimal('allocated_amount', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('it_budget_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('it_budget_id')->constrained('it_budgets')->onDelete('cascade');
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('expense_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('it_budget_expenses');
        Schema::dropIfExists('it_budgets');
    }
};
