<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderStoreItem extends Model
{
    protected $table = 'order_store_item';

    protected $fillable = [
        'order_id',
        'store_item_id',
        'quantity',
    ];
    
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
    
    public function storeItem()
    {
        return $this->belongsTo(StoreItem::class);
    }
    
}
