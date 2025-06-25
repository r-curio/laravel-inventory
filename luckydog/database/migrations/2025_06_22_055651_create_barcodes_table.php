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
        Schema::create('barcodes', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->foreignId('item_id')->constrained('items');
            $table->string('name');
            $table->integer('begbal')->default(0);
            $table->integer('m30')->default(0);
            $table->integer('apollo')->default(0);
            $table->integer('site3')->default(0);
            $table->integer('total')->default(0);
            $table->integer('actual')->default(0);
            $table->integer('purchase')->default(0);
            $table->integer('returns')->default(0);
            $table->integer('damaged')->default(0);
            $table->integer('endbal')->default(0);
            $table->integer('final_total')->default(0);
            $table->integer('s_request')->default(0);
            $table->integer('f_request')->default(0);
            $table->string('notes')->nullable();
            $table->string('condition')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barcodes');
    }
};
