<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\StockLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockLevelController extends Controller
{
    public function index()
    {
        // Get unique combinations of store_name and class only
        $uniqueCombinations = StockLevel::select('store_name', 'class', 'co')
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_name' => 'required|string',
            'class' => 'required|string',
            'co' => 'required|string',
            'name' => 'required|string',
            'order' => 'required|integer',
        ]);

        $stockLevel = \App\Models\StockLevel::create([
            'store_name' => $validated['store_name'],
            'class' => $validated['class'],
            'co' => $validated['co'],
            'name' => $validated['name'],
            'order' => $validated['order'],
        ]);

        return response()->json($stockLevel);
    }

    public function storeCombination(Request $request)
    {
        $validated = $request->validate([
            'store_name' => 'required|string',
            'class' => 'required|string',
            'co' => 'required|string',
        ]);

        // Check if combination already exists
        $existingCombination = StockLevel::where('store_name', $validated['store_name'])
            ->where('class', $validated['class'])
            ->where('co', $validated['co'])
            ->first();

        if ($existingCombination) {
            return response()->json([
                'message' => 'This combination already exists'
            ], 422);
        }

        // get all items from item masterfile with the same co
        $items = Item::where('co', $validated['co'])->get();

        foreach ($items as $item) {
            StockLevel::create([
                'store_name' => $validated['store_name'],
                'class' => $validated['class'],
                'co' => $validated['co'],
                'name' => $item->name,
                'order' => 0,
            ]);
        }

        return response()->json([
            'store_name' => $validated['store_name'],
            'class' => $validated['class'],
            'co' => $validated['co'],
        ]);
    }

    public function updateCombination(Request $request)
    {
        $validated = $request->validate([
            'original_store_name' => 'required|string',
            'original_class' => 'required|string',
            'original_co' => 'required|string',
            'new_store_name' => 'required|string',
            'new_class' => 'required|string',
            'new_co' => 'required|string',
        ]);

        // Check if the new combination already exists (excluding the current one)
        $existingCombination = StockLevel::where('store_name', $validated['new_store_name'])
            ->where('class', $validated['new_class'])
            ->where('co', $validated['new_co'])
            ->whereNot(function ($query) use ($validated) {
                $query->where('store_name', $validated['original_store_name'])
                    ->where('class', $validated['original_class'])
                    ->where('co', $validated['original_co']);
            })
            ->first();

        if ($existingCombination) {
            return response()->json([
                'message' => 'This combination already exists'
            ], 422);
        }

        // Update all stock levels for this combination
        $updatedCount = StockLevel::where('store_name', $validated['original_store_name'])
            ->where('class', $validated['original_class'])
            ->where('co', $validated['original_co'])
            ->update([
                'store_name' => $validated['new_store_name'],
                'class' => $validated['new_class'],
                'co' => $validated['new_co'],
            ]);

        if ($updatedCount === 0) {
            return response()->json([
                'message' => 'Combination not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Combination updated successfully',
            'updated_count' => $updatedCount
        ]);
    }

    public function destroyCombination(Request $request)
    {
        $validated = $request->validate([
            'store_name' => 'required|string',
            'class' => 'required|string',
            'co' => 'required|string',
        ]);

        // Delete all stock levels for this combination
        $deletedCount = StockLevel::where('store_name', $validated['store_name'])
            ->where('class', $validated['class'])
            ->where('co', $validated['co'])
            ->delete();

        if ($deletedCount === 0) {
            return response()->json([
                'message' => 'Combination not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Combination deleted successfully',
            'deleted_count' => $deletedCount
        ]);
    }

    public function destroy(StockLevel $stockLevel)
    {
        try {
            $stockLevel->delete();
            return response()->json([
                'message' => 'Stock level deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete stock level'
            ], 500);
        }
    }
} 