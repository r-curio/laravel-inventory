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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('barcode')->nullable();
            $table->integer('m_no')->nullable();
            $table->string('sku')->nullable();
            $table->string('co')->nullable();
            $table->string('name')->nullable();
            $table->string('barcode_name')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->string('inactive')->nullable();
            $table->decimal('reorder_point', 10, 2)->default(0);
            $table->string('multiples')->nullable();
            $table->string('damaged')->nullable();
            $table->string('item_condition')->nullable();
            $table->string('category')->nullable();
            $table->string('others_1')->nullable();
            $table->string('others_2')->nullable();
            $table->string('others_3')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
