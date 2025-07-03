<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Store extends Model
{
    use HasFactory;

    protected $table = 'stores';


    protected $fillable = [
        'is_processed',
        'name',
        'co',
        'dc',
        'dr_stamped',
        'area_size',
        'overstock',
        'ratbites',
        'closed',
        'no_diser',
        'class',
        'pullout_status',
        'dgcage_status',
        'dgcage_comment',
        'tshirt_status',
        'tshirt_comment',
        'litter_box_status',
        'litter_box_comment',
        'pet_bed_status',
        'pet_bed_comment',
        'gondola_dep',
        'date_depo_refund',
        'missing_deliveries',
        'items_overstock',
        'code',
        'po_or_limit',
        'items_not_allowed',
        'items_order',
        'others',
        'others_2',
        'others_3',
        'date',
    ];

    public function items()
    {
        return $this->belongsToMany(Item::class, 'store_item')
                    ->withPivot([
                        'id',
                        'order',
                        'inventory',
                        'dr_6578',
                        'dr_958',
                        'pic_53',
                        'total',
                        's_divide_2',
                        's_order_2',
                        's_order_5',
                        'final_order'
                    ])
                    ->orderBy('store_item.order');
    }
}
