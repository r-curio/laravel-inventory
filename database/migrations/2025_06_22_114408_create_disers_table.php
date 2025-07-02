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
        Schema::create('disers', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('name')->nullable();
            $table->string('rsc_re')->nullable();
            $table->string('fb_name')->nullable();
            $table->decimal('rate', 10, 2)->nullable();
            $table->integer('sales')->nullable()->default(0);
            $table->integer('total')->nullable()->default(0);
            $table->string('others_1')->nullable();
            $table->string('hold_stop_allow')->nullable();
            $table->string('gcash_number')->nullable();
            $table->string('gcash_name')->nullable();
            $table->string('sv_only')->nullable();
            $table->string('company_sv')->nullable();
            $table->string('others_2')->nullable();
            $table->string('others_3')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disers');
    }
};
