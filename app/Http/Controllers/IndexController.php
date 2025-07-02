<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Inertia\Inertia;

class IndexController extends Controller
{
    public function index()
    {
        $stores = Store::all();
        return Inertia::render('dashboard', [
            'stores' => $stores,
        ]);
    }
}
