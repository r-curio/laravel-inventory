<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Counter extends Model
{
    protected $fillable = [
        'po_number',
        'barcode_number'
    ];

    // Get the current PO number and increment it
    public static function getNextPoNumber()
    {
        $counter = self::first();
        if (!$counter) {
            $counter = self::create(['po_number' => 1, 'barcode_number' => 1]);
        }
        
        $poNumber = $counter->po_number;
        $counter->increment('po_number');
        
        return $poNumber;
    }

    // Get current PO number without incrementing
    public static function getCurrentPoNumber()
    {
        $counter = self::first();
        return $counter ? $counter->po_number : 1;
    }

    // Get the current barcode number and increment it
    public static function getNextBarcodeNumber()
    {
        $counter = self::first();
        if (!$counter) {
            $counter = self::create(['po_number' => 1, 'barcode_number' => 1]);
        }
        
        $barcodeNumber = $counter->barcode_number;
        $counter->increment('barcode_number');
        
        return $barcodeNumber;
    }

    // Get current barcode number without incrementing
    public static function getCurrentBarcodeNumber()
    {
        $counter = self::first();
        return $counter ? $counter->barcode_number : 1;
    }
}
