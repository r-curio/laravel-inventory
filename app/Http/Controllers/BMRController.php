<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\StoreItem;
use App\Models\Counter;
use App\Models\Barcode;
use Illuminate\Support\Facades\Log;
use App\Models\Item;
use App\Models\Store;

class BMRController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // get all store items where store processed = true and final_order > 0
        $storeItems = StoreItem::whereHas('store', function ($query) {
            $query->where('is_processed', true);
        })->where('final_order', '>', 0)
          ->join('stores', 'store_item.store_id', '=', 'stores.id')
          ->join('items', 'store_item.item_id', '=', 'items.id')
          ->select([
              'store_item.store_id',
              'stores.name as store_name',
              'store_item.item_id',
              'items.name as item_name',
              'store_item.final_order'
          ])
          ->orderBy('stores.name')
          ->orderBy('items.name')
          ->get();

        // Get the current barcode number from counters table
        $currentBarcodeNumber = Counter::getCurrentBarcodeNumber();

        return Inertia::render('BMR/Index', [
            'storeItems' => $storeItems,
            'currentBarcodeNumber' => $currentBarcodeNumber
        ]);
    }

    /**
     * Store factory assignments for BMR items
     */
    public function assignFactories(Request $request)
    {
        $request->validate([
            'groupedItems' => 'required|array',
            'groupedItems.*' => 'required|array',
            'groupedItems.*.item_id' => 'required|exists:items,id',
            'groupedItems.*.assigned_factory' => 'required|string|in:m30,apollo,site3',
            'groupedItems.*.total_final_order' => 'required|integer',
        ]);

        $processedItemIds = [];

        try {
            foreach ($request->groupedItems as $item) {
                // Check if item_id exists in the barcodes table
                $barcode = Barcode::where('item_id', $item['item_id'])->first();

                if ($barcode) {
                    // Update existing barcode record
                    $updateData = [
                        'm30' => 0,
                        'apollo' => 0,
                        'site3' => 0,
                    ];

                    // Set the appropriate factory field based on assigned_factory
                    switch ($item['assigned_factory']) {
                        case 'm30':
                            $updateData['m30'] = $item['total_final_order'];
                            break;
                        case 'apollo':
                            $updateData['apollo'] = $item['total_final_order'];
                            break;
                        case 'site3':
                            $updateData['site3'] = $item['total_final_order'];
                            break;
                    }

                    $barcode->update($updateData);
                    Log::info("Updated barcode record for item_id: {$item['item_id']} with factory: {$item['assigned_factory']}");
                } else {
                    // Create new barcode record
                    $createData = [
                        'item_id' => $item['item_id'],
                        'name' => $item['item_name'],
                        'm30' => 0,
                        'apollo' => 0,
                        'site3' => 0,
                        'begbal' => 0,
                        'total' => 0,
                        'actual' => 0,
                        'purchase' => 0,
                        'returns' => 0,
                        'damaged' => 0,
                        'endbal' => 0,
                        'final_total' => 0,
                        's_request' => 0,
                        'f_request' => 0,
                        'notes' => '',
                        'condition' => '',
                    ];

                    // Set the appropriate factory field based on assigned_factory
                    switch ($item['assigned_factory']) {
                        case 'm30':
                            $createData['m30'] = $item['total_final_order'];
                            break;
                        case 'apollo':
                            $createData['apollo'] = $item['total_final_order'];
                            break;
                        case 'site3':
                            $createData['site3'] = $item['total_final_order'];
                            break;
                    }

                    Barcode::create($createData);
                    Log::info("Created new barcode record for item_id: {$item['item_id']} with factory: {$item['assigned_factory']}");
                }

                $processedItemIds[] = $item['item_id'];
            }

            // Store the processed item IDs in session
            session(['processed_barcode_items' => $processedItemIds]);

            // Return success response for Inertia
            return back()->with('success', 'Factory assignments saved successfully');
        } catch (\Exception $e) {
            Log::error("Error in assignFactories: " . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to save factory assignments: ' . $e->getMessage()]);
        }
    }

    public function factories()
    {
        // Get the processed item IDs from session
        $processedItemIds = session('processed_barcode_items', []);

        // Option 3: Get only the barcodes that were just processed in this session
        $barcodes = collect();
        if (!empty($processedItemIds)) {
            $barcodes = Barcode::join('items', 'barcodes.item_id', '=', 'items.id')
                ->select([
                    'barcodes.*',
                    'items.name as item_name'
                ])
                ->whereIn('barcodes.item_id', $processedItemIds)
                ->orderBy('barcodes.updated_at', 'desc')
                ->get();
        }

        return Inertia::render('BMR/Factories', [
            'barcodes' => $barcodes,
        ]);
    }

    public function barcode()
    {
        // Get the processed item IDs from session
        $processedItemIds = session('processed_barcode_items', []);

        // Get the barcodes that were just processed
        $barcodes = collect();
        if (!empty($processedItemIds)) {
            $barcodes = Barcode::join('items', 'barcodes.item_id', '=', 'items.id')
                ->select([
                    'barcodes.*',
                    'items.name as item_name'
                ])
                ->whereIn('barcodes.item_id', $processedItemIds)
                ->orderBy('barcodes.updated_at', 'desc')
                ->get();
        }

        // get the reorder_point from items table of each barcode
        $barcodes = $barcodes->map(function ($barcode) {
            $barcode->reorder_point = Item::find($barcode->item_id)->reorder_point;
            return $barcode;
        });

        return Inertia::render('BMR/Barcode', [
            'barcodes' => $barcodes,
        ]);
    }

    public function batchUpdateBarcodes(Request $request)
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:barcodes,id',
            'updates.*.changes' => 'required|array',
        ]);

        try {
            foreach ($request->updates as $update) {
                $barcode = Barcode::find($update['id']);
                if ($barcode) {
                    // set the begbal equal to the current final_total
                    $barcode->begbal = $barcode->endbal;
                    $barcode->update($update['changes']);
                }
            }

            // set all stores is_procesed to false
            Store::where('is_processed', true)->update(['is_processed' => false]);

            return response()->json(['success' => true, 'message' => 'Barcodes updated successfully']);
        } catch (\Exception $e) {
            Log::error("Error in batchUpdateBarcodes: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update barcodes'], 500);
        }
    }

    public function destroyBarcode(Barcode $barcode)
    {
        try {
            $barcode->delete();
            return response()->json(['success' => true, 'message' => 'Barcode deleted successfully']);
        } catch (\Exception $e) {
            Log::error("Error in destroyBarcode: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete barcode'], 500);
        }
    }
}
