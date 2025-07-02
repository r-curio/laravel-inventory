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
        Schema::create('order_store_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('store_item_id')->constrained('store_item')->onDelete('cascade');
            $table->string('name')->nullable();
            $table->integer('quantity');
            $table->timestamps();
            
            // Add a unique constraint to prevent duplicate order-store_item combinations
            $table->unique(['order_id', 'store_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_store_item');
    }
};
