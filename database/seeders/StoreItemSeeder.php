<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Store;
use App\Models\Item;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class StoreItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all stores and items
        $stores = Store::all();
        $items = Item::all();

        // Group items by their company code
        $itemsByCompany = $items->groupBy('co');

        // For each store, assign items that match their company code
        foreach ($stores as $store) {
            // Get items for this store's company code
            $storeItems = $itemsByCompany->get($store->co, collect());
            
            foreach ($storeItems as $item) {
                $order = 0;
                
                DB::table('store_item')->insert([
                    'store_id' => $store->id,
                    'item_id' => $item->id,
                    'order' => $order,
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
        }
    }
}
