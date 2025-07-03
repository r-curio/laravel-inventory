<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'po_number',
        'store_name',
        'box_number',
        'total_orders',
        'notes_1',
        'notes_2'
    ];

    public function storeItems()
    {
        return $this->belongsToMany(StoreItem::class, 'order_store_item')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    // Create a new order with an auto-incremented PO number
    public static function createWithPoNumber(array $attributes = [])
    {
        $attributes['po_number'] = Counter::getNextPoNumber();
        return self::create($attributes);
    }

    // Get the current PO number
    public static function getCurrentPoNumber()
    {
        return Counter::getCurrentPoNumber();
    }

}
