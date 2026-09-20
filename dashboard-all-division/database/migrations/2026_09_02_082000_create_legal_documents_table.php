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
        Schema::create('legal_documents', function (Blueprint $table) {
            $table->id();
            $table->string('category', 50)->index(); // 'silo', 'permit', 'agreement', 'project_contract', 'vehicle'
            $table->string('topic', 150)->nullable();
            $table->text('document_name');
            $table->string('identifier', 150)->nullable()->index(); // ID Asset / Serial Number / No Regist / Plat No
            $table->string('related_party', 255)->nullable(); // Pihak Terkait / Instansi / Vendor / Client / PIC Unit
            $table->date('start_date')->nullable();
            $table->date('expired_date')->nullable()->index();
            $table->date('extension_submission_date')->nullable();
            $table->string('extension_progress', 255)->nullable(); // e.g. "PJK3 Sudah Release", "Submit Disnaker", dll.
            $table->string('location', 150)->nullable();
            $table->string('pic_name', 150)->nullable();
            $table->string('pic_email', 150)->nullable();
            $table->string('status', 100)->default('Aktif'); // 'Masih Berlaku', 'Expired', 'Aktif', 'On Process', dll.
            $table->text('notes')->nullable();
            $table->text('link_document')->nullable();
            $table->boolean('has_hard_file')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legal_documents');
    }
};
