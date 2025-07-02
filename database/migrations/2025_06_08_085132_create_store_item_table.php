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
        Schema::create('store_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->foreignId('item_id')->constrained()->onDelete('cascade');
            $table->integer('order')->default(0);
            $table->integer('inventory')->default(0);
            $table->integer('dr_6578')->default(0);
            $table->integer('dr_958')->default(0);
            $table->integer('pic_53')->default(0);
            $table->integer('total')->default(0);
            $table->integer('s_divide_2')->default(0);
            $table->integer('s_order_2')->default(0);
            $table->integer('s_order_5')->default(0);
            $table->integer('final_order')->default(0);
            $table->timestamps();
            
            // Add a unique constraint to prevent duplicate store-item combinations
            $table->unique(['store_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_item');
    }
};
