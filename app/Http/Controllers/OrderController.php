<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\Store;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required|integer|exists:stores,id',
            'store_name' => 'required|string',
            'box_number' => 'required|integer',
            'store_items' => 'required|array',
            'store_items.*.id' => 'required|integer|exists:store_item,id',
            'store_items.*.name' => 'required|string',
            'store_items.*.final_order' => 'required|integer|min:1',
        ]);
        
        $order = null;
        
        DB::transaction(function () use ($request, &$order) {
            $order = Order::createWithPoNumber([
                'store_name' => $request->store_name,
                'box_number' => $request->box_number,
            ]);

            // Attach store items to the order with their quantities
            foreach ($request->store_items as $item) {
                $order->storeItems()->attach($item['id'], [
                    'name' => $item['name'],
                    'quantity' => $item['final_order']
                ]);
            }

            Store::where('id', $request->store_id)->update([
                'is_processed' => true,
            ]);
        });

        return response()->json([
            'message' => 'Order created successfully',
            'po_number' => $order ? $order->po_number : null,
            'order' => $order
        ]);
    }
}
