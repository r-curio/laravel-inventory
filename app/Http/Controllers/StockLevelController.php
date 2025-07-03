<?php

namespace App\Http\Controllers;

use App\Models\StockLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockLevelController extends Controller
{
    public function index()
    {
        // Get unique combinations of store_name and class only
        $uniqueCombinations = StockLevel::select('store_name', 'class')
            ->distinct()
            ->orderBy('store_name')
            ->orderBy('class')
            ->get();

        return Inertia::render('stock-level', [
            'uniqueCombinations' => $uniqueCombinations
        ]);
    }

    public function show(Request $request)
    {
        $storeName = $request->query('store_name');
        $class = $request->query('class');

        $stockLevels = StockLevel::select('stock_levels.*', 'items.m_no')
            ->leftJoin('items', 'stock_levels.name', '=', 'items.name')
            ->where('stock_levels.store_name', $storeName)
            ->where('stock_levels.class', $class)
            ->orderByRaw('items.m_no IS NULL, items.m_no ASC')
            ->get();

        return response()->json($stockLevels);
    }

    public function batchUpdate(Request $request)
    {
        $updates = $request->input('updates', []);
        
        foreach ($updates as $update) {
            StockLevel::where('id', $update['id'])->update($update['changes']);
        }

        return response()->json(['message' => 'Updated successfully']);
    }
} 