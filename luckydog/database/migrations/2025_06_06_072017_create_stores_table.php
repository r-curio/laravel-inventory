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
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->boolean('is_processed')->default(false);
            $table->string('name')->require();
            $table->string('co')->nullable();
            $table->string('dc')->nullable();
            $table->string('dr_stamped')->nullable();
            $table->string('area_size')->nullable();
            $table->string('overstock')->nullable();
            $table->string('ratbites')->nullable();
            $table->string('closed')->nullable();
            $table->string('no_diser')->nullable();
            $table->string('class')->nullable();
            $table->string('pullout_status')->nullable();
            $table->string('dgcage_status')->nullable();
            $table->string('dgcage_comment')->nullable();
            $table->string('tshirt_status')->nullable();
            $table->string('tshirt_comment')->nullable();
            $table->string('litter_box_status')->nullable();
            $table->string('litter_box_comment')->nullable();
            $table->string('pet_bed_status')->nullable();
            $table->string('pet_bed_comment')->nullable();
            $table->string('gondola_dep')->nullable();
            $table->string('date_depo_refund')->nullable();
            $table->string('missing_deliveries')->nullable();
            $table->string('items_overstock')->nullable();
            $table->string('code')->nullable();
            $table->string('po_or_limit')->nullable();
            $table->string('items_not_allowed')->nullable();
            $table->string('items_order')->nullable();
            $table->string('others')->nullable();
            $table->string('others_2')->nullable();
            $table->string('others_3')->nullable();
            $table->string('date')->nullable();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
