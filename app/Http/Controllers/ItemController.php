<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Store;
use App\Models\StoreItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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
        $item->delete();
        return response()->json(['message' => 'Item deleted successfully']);
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
