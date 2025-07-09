<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\StoreItem;
use App\Models\StockLevel;
use App\Models\Diser;

class StoreController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
{
    $stores = Store::orderBy('name')->get();
    $disers = Diser::all()->keyBy('name'); // Index disers by their name

    $result = $stores->map(function($store) use ($disers) {
        $diser = $disers->get($store->name);

        // Merge store and diser attributes, prefixing diser fields to avoid collision
        return array_merge(
            $store->toArray(),
            $diser ? collect($diser)->mapWithKeys(function($value, $key) {
                return ['diser_' . $key => $value];
            })->toArray() : []
        );
    });

    return Inertia::render('store-masterfile', [
        'stores' => $result,
    ]);
}

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'co' => 'nullable|string|max:255',
            'dc' => 'nullable|string|max:255',
            'dr_stamped' => 'nullable|string|max:255',
            'area_size' => 'nullable|string|max:255',
            'overstock' => 'nullable|string|max:255',
            'ratbites' => 'nullable|string|max:255',
            'closed' => 'nullable|string|max:255',
            'no_diser' => 'nullable|string|max:255',
            'class' => 'nullable|string|max:255',
            'pullout_status' => 'nullable|string|max:255',
            'dgcage_status' => 'nullable|string|max:255',
            'tshirt_status' => 'nullable|string|max:255',
            'litter_box_status' => 'nullable|string|max:255',
            'pet_bed_status' => 'nullable|string|max:255',
            'gondola_dep' => 'nullable|string|max:255',
            'date_depo_refund' => 'nullable|string|max:255',
            'missing_deliveries' => 'nullable|string|max:255',
            'items_overstock' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:255',
            'po_or_limit' => 'nullable|string|max:255',
            'items_not_allowed' => 'nullable|string|max:255',
            'items_order' => 'nullable|string|max:255',
            'others' => 'nullable|string|max:255',
        ]);

        $store = Store::create($validated);

        $items = Item::where('co', $store->co)->get();
        foreach ($items as $item) {
            StoreItem::create([
                'store_id' => $store->id,
                'item_id' => $item->id,
                'order' => 0,
                'inventory' => 0,
                'dr_6578' => 0,
                'dr_958' => 0,
                'pic_53' => 0,
                'total' => 0,
                's_divide_2' => 0,
                's_order_2' => 0,
                's_order_5' => 0,
                'final_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),

            ]);
        }

        return response()->json([
            'message' => 'Store created successfully',
            'store' => $store
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Store $store)
    {
        $store->load(['items' => function($query) {
            $query->select('items.*')
                  ->orderBy('store_item.order');
        }]);

        // get the fb name from diser masterfile with the associated store
        $fbName = Diser::where('name', $store->name)->first()->fb_name;

        $store->fb_name = $fbName;

        // Get all the stock levels that match the store's co and class
        $stockLevels = StockLevel::where('co', $store->co)
            ->where('class', $store->class)
            ->get()
            ->keyBy('name'); // Index by name for faster lookup

        // Replace store_item order with stock_levels order
        $store->items->each(function($item) use ($stockLevels) {
            $stockLevel = $stockLevels->get($item->name);
            if ($stockLevel) {
                $item->pivot->order = $stockLevel->order;
            }
            // If no matching stock level found, keep the existing order value
        });

        return Inertia::render('stores/po', [
            'store' => $store,
            'storeItems' => $store->items->map(function($item) {
                return [
                    'id' => $item->pivot->id,
                    'store_id' => $item->pivot->store_id,
                    'item_id' => $item->pivot->item_id,
                    'order' => $item->pivot->order,
                    'inventory' => $item->pivot->inventory,
                    'dr_6578' => $item->pivot->dr_6578,
                    'dr_958' => $item->pivot->dr_958,
                    'pic_53' => $item->pivot->pic_53,
                    'total' => $item->pivot->total,
                    's_divide_2' => $item->pivot->s_divide_2,
                    's_order_2' => $item->pivot->s_order_2,
                    's_order_5' => $item->pivot->s_order_5,
                    'final_order' => $item->pivot->final_order,
                    'item_name' => $item->name,
                    'item_multiples' => $item->multiples,
                    'm_no' => $item->m_no,
                    'created_at' => $item->pivot->created_at,
                    'updated_at' => $item->pivot->updated_at,
                ];
            }),
        ]); 
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Store $store)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Store $store)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'co' => 'sometimes|string|max:255',
            'dc' => 'sometimes|string|max:255',
            'dr_stamped' => 'sometimes|string|max:255',
            'area_size' => 'sometimes|string|max:255',
            'overstock' => 'sometimes|string|max:255',
            'ratbites' => 'sometimes|string|max:255',
            'closed' => 'sometimes|string|max:255',
            'no_diser' => 'sometimes|string|max:255',
            'class' => 'sometimes|string|max:255',
            'po_or_limit' => 'sometimes|string|max:255',
        ]);

        $store->update($validated);

        return response()->json([
            'message' => 'Store updated successfully',
            'store' => $store
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Store $store)
    {
        $store->delete();

        // delete all store items for the store
        StoreItem::where('store_id', $store->id)->delete();

        return response()->json(['message' => 'Store deleted successfully']);
    }

    /**
     * Update multiple stores in storage.
     */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:stores,id',
            'updates.*.changes' => 'required|array',
            'updates.*.changes.*' => 'nullable|string|max:255',
        ]);

        $updates = collect($validated['updates']);
        
        DB::beginTransaction();
        try {
            foreach ($updates as $update) {
                $store = Store::find($update['id']);
                
                // Convert empty strings to null for consistency
                $changes = collect($update['changes'])->map(function($value) {
                    return $value === '' ? null : $value;
                })->toArray();
                
                $store->update($changes);
            }
            DB::commit();

            return response()->json([
                'message' => 'Stores updated successfully',
                'updated' => $updates->count()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update stores',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
