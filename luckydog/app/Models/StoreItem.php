<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreItem extends Model
{
    protected $table = 'store_item';

    protected $fillable = [
        'store_id',
        'item_id',
        'order',
        'inventory',
        'dr_6578',
        'dr_958',
        'pic_53',
        'total',
        's_divide_2',
        's_order_2',
        's_order_5',
        'final_order',
    ];

    protected $casts = [
        'order' => 'integer',
        'inventory' => 'integer',
        'dr_6578' => 'integer',
        'dr_958' => 'integer',
        'pic_53' => 'integer',
        'total' => 'integer',
        's_divide_2' => 'integer',
        's_order_2' => 'integer',
        's_order_5' => 'integer',
        'final_order' => 'integer',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function orderStoreItems()
    {
        return $this->hasMany(OrderStoreItem::class);
    }

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_store_item')
            ->withPivot('quantity')
            ->withTimestamps();
    }
}
