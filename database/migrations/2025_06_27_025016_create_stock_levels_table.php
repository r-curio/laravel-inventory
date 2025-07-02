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
        Schema::create('stock_levels', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('store_name', 100);
            $table->string('name', 100);
            $table->string('co', 50);
            $table->string('class', 50);
            $table->integer('order');

            $table->unique(['store_name', 'name', 'class', 'co']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_levels');
    }
};
