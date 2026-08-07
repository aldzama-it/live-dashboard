<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('division_id')->nullable()->after('password')->constrained('divisions')->onDelete('set null');
            $table->foreignId('department_id')->nullable()->after('division_id')->constrained('departments')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropForeign(['department_id']);
            $table->dropColumn(['division_id', 'department_id']);
        });
    }
};
