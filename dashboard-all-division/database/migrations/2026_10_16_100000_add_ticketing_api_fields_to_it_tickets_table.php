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
        Schema::table('it_tickets', function (Blueprint $table) {
            $table->string('reporter_name')->nullable()->after('assigned_to');
            $table->string('reporter_phone')->nullable()->after('reporter_name');
            $table->string('reporter_email')->nullable()->after('reporter_phone');
            $table->string('location')->nullable()->after('reporter_email');
            $table->string('detail_url')->nullable()->after('location');
            $table->unsignedBigInteger('assigned_to_id')->nullable()->after('detail_url');
            $table->unsignedBigInteger('department_id')->nullable()->after('assigned_to_id');
            $table->unsignedBigInteger('category_id')->nullable()->after('department_id');
            $table->unsignedBigInteger('location_id')->nullable()->after('category_id');
            $table->string('attachment_path')->nullable()->after('location_id');
            $table->string('attachment_original_name')->nullable()->after('attachment_path');
            $table->string('attachment_mime')->nullable()->after('attachment_original_name');
            $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_mime');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_tickets', function (Blueprint $table) {
            $table->dropColumn([
                'reporter_name',
                'reporter_phone',
                'reporter_email',
                'location',
                'detail_url',
                'assigned_to_id',
                'department_id',
                'category_id',
                'location_id',
                'attachment_path',
                'attachment_original_name',
                'attachment_mime',
                'attachment_size',
            ]);
        });
    }
};
