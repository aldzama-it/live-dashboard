<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_entries', function (Blueprint $table) {
            $table->dropForeign(['page_id']);
            $table->foreignId('page_id')->nullable()->change();
            $table->foreign('page_id')->references('id')->on('pages')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('data_entries', function (Blueprint $table) {
            $table->dropForeign(['page_id']);
            $table->foreignId('page_id')->nullable(false)->change();
            $table->foreign('page_id')->references('id')->on('pages')->onDelete('cascade');
        });
    }
};
