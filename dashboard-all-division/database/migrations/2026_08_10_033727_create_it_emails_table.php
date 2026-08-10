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
        Schema::create('it_emails', function (Blueprint $table) {
            $table->id();
            $table->string('email_address')->unique();
            $table->string('domain');
            $table->string('user_name');
            $table->string('department')->nullable();
            $table->string('division_project')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('it_emails');
    }
};
