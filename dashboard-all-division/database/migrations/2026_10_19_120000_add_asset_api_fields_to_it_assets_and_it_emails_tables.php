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
        Schema::table('it_assets', function (Blueprint $table) {
            $table->string('external_id', 100)->nullable()->unique()->after('id');
            $table->string('category', 50)->nullable()->after('type');
            $table->string('asset_code', 50)->nullable()->after('asset_name');
            $table->string('status', 50)->nullable()->after('condition');
        });

        Schema::table('it_emails', function (Blueprint $table) {
            $table->string('external_id', 100)->nullable()->unique()->after('id');
            $table->string('status', 50)->nullable()->after('division_project');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_assets', function (Blueprint $table) {
            $table->dropColumn(['external_id', 'category', 'asset_code', 'status']);
        });

        Schema::table('it_emails', function (Blueprint $table) {
            $table->dropColumn(['external_id', 'status']);
        });
    }
};
