<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barcode extends Model
{
    protected $fillable = [
        'item_id',
        'name',
        'begbal',
        'm30',
        'apollo',
        'site3',
        'total',
        'actual',
        'purchase',
        'returns',
        'damaged',
        'endbal',
        'final_total',
        's_request',
        'f_request',
        'notes',
        'condition',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }
}
