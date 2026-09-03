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
        Schema::create('synology_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('division');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_hash')->nullable();
            $table->timestamp('file_modified_at')->nullable();
            $table->string('status')->default('PENDING'); // PENDING, SUCCESS, FAILED
            $table->integer('rows_processed')->default(0);
            $table->integer('rows_created')->default(0);
            $table->integer('rows_updated')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('synology_sync_logs');
    }
};
