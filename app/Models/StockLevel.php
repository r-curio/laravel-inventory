<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockLevel extends Model
{
    protected $table = 'stock_levels';

    protected $fillable = [
        'id',
        'store_name',
        'name',
        'co',
        'class',
        'order',
    ];

    public $timestamps = true;
}
