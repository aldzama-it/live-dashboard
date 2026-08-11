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
        Schema::table('it_budget_expenses', function (Blueprint $table) {
            $table->string('group_category')->nullable()->after('it_budget_id');
            // Make it_budget_id nullable since not all expenses tie to a specific budget allocation
            $table->unsignedBigInteger('it_budget_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_budget_expenses', function (Blueprint $table) {
            $table->dropColumn('group_category');
            $table->unsignedBigInteger('it_budget_id')->nullable(false)->change();
        });
    }
};
