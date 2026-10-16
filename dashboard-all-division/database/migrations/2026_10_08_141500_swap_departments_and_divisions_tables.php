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
        Schema::disableForeignKeyConstraints();

        // 1. Drop existing foreign keys on dependent tables
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropForeign(['department_id']);
        });

        Schema::table('data_entries', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropForeign(['department_id']);
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
        });

        // 2. Rename tables to swap roles:
        // 'divisions' (parent) becomes 'departments'
        // 'departments' (child) becomes 'divisions'
        Schema::rename('departments', '_temp_departments');
        Schema::rename('divisions', 'departments');
        Schema::rename('_temp_departments', 'divisions');

        // 3. Rename parent FK column in new 'divisions' table from 'division_id' to 'department_id'
        Schema::table('divisions', function (Blueprint $table) {
            $table->renameColumn('division_id', 'department_id');
        });

        // 4. Re-create foreign key constraints with the new architecture
        Schema::table('divisions', function (Blueprint $table) {
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('cascade');
        });

        Schema::table('data_entries', function (Blueprint $table) {
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('set null');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();

        // 1. Drop new foreign keys
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['division_id']);
        });

        Schema::table('data_entries', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['division_id']);
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
        });

        Schema::table('divisions', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
        });

        // 2. Rename column back
        Schema::table('divisions', function (Blueprint $table) {
            $table->renameColumn('department_id', 'division_id');
        });

        // 3. Rename tables back
        Schema::rename('divisions', '_temp_divisions');
        Schema::rename('departments', 'divisions');
        Schema::rename('_temp_divisions', 'departments');

        // 4. Re-create old foreign keys
        Schema::table('departments', function (Blueprint $table) {
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('cascade');
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('cascade');
        });

        Schema::table('data_entries', function (Blueprint $table) {
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('set null');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });

        Schema::enableForeignKeyConstraints();
    }
};
