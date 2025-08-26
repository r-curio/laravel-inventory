<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $table = 'items';

    protected $fillable = [
        'barcode',
        'm_no',
        'sku',
        'co',
        'name',
        'barcode_name',
        'price',
        'inactive',
        'reorder_point',
        'multiples',
        'damaged',
        'item_condition',
        'category',
        'others_1',
        'others_2',
        'others_3'
    ];

    public function stores()
    {
        return $this->belongsToMany(Store::class, 'store_item')
                    ->withPivot('order')
                    ->orderBy('store_item.order');
    }

    public function barcode()
    {
        return $this->hasOne(Barcode::class, 'item_id');
    }
}
