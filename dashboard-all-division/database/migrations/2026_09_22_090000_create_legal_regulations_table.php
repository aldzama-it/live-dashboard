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
        Schema::create('legal_regulations', function (Blueprint $table) {
            $table->id();
            $table->integer('no')->nullable()->index();
            $table->text('regulation_name');
            $table->string('validity_status', 255)->nullable();
            $table->text('relevance')->nullable();
            $table->text('follow_up')->nullable();
            $table->string('nature_of_compliance', 100)->nullable(); // Wajib, Conditional, Opsional
            $table->string('related_party', 100)->nullable(); // Legal, HSE, HR, Transport, Operation, Finance, Exim, IT
            $table->string('compliance_status', 50)->default('Comply')->index(); // Comply, Non-Comply
            $table->string('sheet_name', 50)->default('Sheet1');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legal_regulations');
    }
};
