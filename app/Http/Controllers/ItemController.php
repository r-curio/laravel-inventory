<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Store;
use App\Models\StoreItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Barcode;
use App\Models\StockLevel;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $items = Item::orderBy('name', 'asc')->orderBy('m_no', 'asc')->get();
        return Inertia::render('item-masterfile', [
            'items' => $items,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:255',
            'co' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'barcode_name' => 'nullable|string|max:255',
            'price' => 'nullable|numeric',
            'inactive' => 'nullable|string|max:255',
            'reorder_point' => 'nullable|numeric',
            'multiples' => 'nullable|string|max:255',
            'damaged' => 'nullable|string|max:255',
            'item_condition' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'others_1' => 'nullable|string|max:255',
            'others_2' => 'nullable|string|max:255',
            'others_3' => 'nullable|string|max:255',
        ]);

        // get the last m_no for the co
        $lastMNo = Item::where('co', $validated['co'])->max('m_no');
        $validated['m_no'] = $lastMNo + 1;

        $item = Item::create($validated);

        // create a new store item for each store with matching co
        $stores = Store::where('co', $validated['co'])->get();
        foreach ($stores as $store) {
            StoreItem::create([
                'store_id' => $store->id,
                'item_id' => $item->id,
            ]);
        }

        // Ensure stock_levels contain entries for all items under this CO across existing combinations
        // 1) Get all existing (store_name, class, co) combinations for this CO
        $combinations = StockLevel::select('store_name', 'class', 'co')
            ->where('co', $validated['co'])
            ->distinct()
            ->get();

        if ($combinations->isNotEmpty()) {
            // 2) Get all item names for this CO (including the newly created one)
            $itemNamesForCo = Item::where('co', $validated['co'])->pluck('name')->toArray();

            foreach ($combinations as $combo) {
                // 3) Fetch existing names for this combination to avoid duplicates
                $existingNames = StockLevel::where('store_name', $combo->store_name)
                    ->where('class', $combo->class)
                    ->where('co', $combo->co)
                    ->pluck('name')
                    ->toArray();

                // 4) Determine which names are missing for this combination
                $missingNames = array_diff($itemNamesForCo, $existingNames);

                // 5) Insert missing stock_levels with order = 0
                foreach ($missingNames as $missingName) {
                    StockLevel::create([
                        'store_name' => $combo->store_name,
                        'class' => $combo->class,
                        'co' => $combo->co,
                        'name' => $missingName,
                        'order' => 0,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Item created successfully',
            'item' => $item
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'barcode' => 'sometimes|string|max:255',
            'm_no' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|max:255',
            'co' => 'sometimes|string|max:255',
            'name' => 'sometimes|string|max:255',
            'barcode_name' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric',
            'inactive' => 'sometimes|string|max:255',
            'reorder_point' => 'sometimes|numeric',
            'multiples' => 'sometimes|string|max:255',
            'damaged' => 'sometimes|string|max:255',
            'item_condition' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:255',
            'others_1' => 'sometimes|string|max:255',
            'others_2' => 'sometimes|string|max:255',
            'others_3' => 'sometimes|string|max:255',
        ]);

        $item->update($validated);

        return response()->json([
            'message' => 'Item updated successfully',
            'item' => $item
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item)
    {
        try {
            DB::transaction(function () use ($item) {
                // Delete related barcodes (no FK cascade defined in migration)
                Barcode::where('item_id', $item->id)->delete();

                // Delete related stock levels that reference this item by name and company code
                StockLevel::where('name', $item->name)
                    ->where('co', $item->co)
                    ->delete();

                // store_item rows will cascade via FK; finally delete the item
                $item->delete();
            });

            return response()->json(['message' => 'Item deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete item',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update multiple items in storage.
     */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:items,id',
            'updates.*.changes' => 'required|array',
            'updates.*.changes.*' => 'nullable|string|max:255',
        ]);

        $updates = collect($validated['updates']);
        
        DB::beginTransaction();
        try {
            foreach ($updates as $update) {
                $item = Item::find($update['id']);
                
                // Convert empty strings to null for consistency
                $changes = collect($update['changes'])->map(function($value) {
                    return $value === '' ? null : $value;
                })->toArray();
                
                $item->update($changes);
            }
            DB::commit();

            return response()->json([
                'message' => 'Items updated successfully',
                'updated' => $updates->count()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update items',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
