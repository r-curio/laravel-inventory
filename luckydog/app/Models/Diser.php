<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Diser extends Model
{
    protected $table = 'disers';

    protected $fillable = [
        'name',
        'sales',
        'total',
        'rsc_re',
        'fb_name',
        'rate',
        'others_1',
        'hold_stop_allow',
        'gcash_number',
        'gcash_name',
        'sv_only',
        'company_sv',
        'others_2',
        'others_3',
    ];

    
}
