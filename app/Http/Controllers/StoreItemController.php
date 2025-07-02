<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\StoreItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StoreItemController extends Controller
{
    public function store(Request $request, Store $store)
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|exists:items,id',
            'order' => 'required|integer|min:0',
            'inventory' => 'nullable|integer|min:0',
            'dr_6578' => 'nullable|integer|min:0',
            'dr_958' => 'nullable|integer|min:0',
            'pic_53' => 'nullable|integer|min:0',
            'total' => 'nullable|integer|min:0',
            's_divide_2' => 'nullable|integer|min:0',
            's_order_2' => 'nullable|integer|min:0',
            's_order_5' => 'nullable|integer|min:0',
            'final_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $storeItem = $store->items()->create([
            'item_id' => $request->item_id,
            'order' => $request->order,
            'inventory' => $request->inventory,
            'dr_6578' => $request->dr_6578,
            'dr_958' => $request->dr_958,
            'pic_53' => $request->pic_53,
            'total' => $request->total,
            's_divide_2' => $request->s_divide_2,
            's_order_2' => $request->s_order_2,
            's_order_5' => $request->s_order_5,
            'final_order' => $request->final_order,
        ]);

        return response()->json([
            'message' => 'Store item created successfully',
            'storeItem' => $storeItem->load('item'),
        ]);
    }

    public function batchUpdate(Request $request, Store $store)
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:store_item,id',
            'updates.*.changes' => 'required|array',
            'updates.*.changes.order' => 'nullable|integer',
            'updates.*.changes.inventory' => 'nullable|integer',
            'updates.*.changes.dr_6578' => 'nullable|integer',
            'updates.*.changes.dr_958' => 'nullable|integer',
            'updates.*.changes.pic_53' => 'nullable|integer',
            'updates.*.changes.total' => 'nullable|integer',
            'updates.*.changes.s_divide_2' => 'nullable|integer',
            'updates.*.changes.s_order_2' => 'nullable|integer',
            'updates.*.changes.s_order_5' => 'nullable|integer',
            'updates.*.changes.final_order' => 'nullable|integer',
        ]);

        $updates = $request->input('updates');
        $updatedItems = [];

        foreach ($updates as $update) {
            $storeItem = StoreItem::findOrFail($update['id']);
            
            // Verify the store item belongs to the correct store
            if ($storeItem->store_id !== $store->id) {
                continue;
            }

            $storeItem->update($update['changes']);
            $updatedItems[] = $storeItem;
        }

        return response()->json([
            'message' => 'Items updated successfully',
            'updated_items' => $updatedItems
        ]);
    }

    public function destroy(Store $store, StoreItem $storeItem)
    {
        // Verify the store item belongs to the correct store
        if ($storeItem->store_id !== $store->id) {
            return response()->json(['message' => 'Invalid store item'], 403);
        }

        $storeItem->delete();

        return response()->json([
            'message' => 'Store item deleted successfully',
        ]);
    }
} 