<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Item;
use Illuminate\Support\Facades\File;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonFiles = ['TV.json', 'HMN.json', 'RSC.json', 'SM.json', 'GAI.json', 'HX.json', 'LM.json', 'PET.json', 'WM.json', 'MP.json'];
        $allItems = [];
        
        foreach ($jsonFiles as $jsonFile) {
            $jsonPath = database_path('data/items/' . $jsonFile);
            if (File::exists($jsonPath)) {
                $items = json_decode(File::get($jsonPath), true);
                if (is_array($items)) {
                    $allItems = array_merge($allItems, $items);
                }
            }
        }

        foreach ($allItems as $item) {
            // Ensure all required fields are present and properly formatted
            $itemData = [
                'barcode' => $item['barcode'] ?? null,
                'm_no' => $item['m_no'] ?? null,
                'sku' => $item['sku'] ?? null,
                'co' => $item['co'] ?? null,
                'name' => $item['name'] ?? null,
                'barcode_name' => $item['barcode_name'] ?? null,
                'price' => $item['price'] ?? 0,
                'inactive' => $item['inactive'] ?? null,
                'reorder_point' => $item['reorder_point'] ?? 0,
                'multiples' => $item['multiples'] ?? null,
                'damaged' => $item['damaged'] ?? null,
                'item_condition' => $item['item_condition'] ?? null,
                'category' => $item['category'] ?? null,
                'others_1' => $item['others_1'] ?? null,
                'others_2' => $item['others_2'] ?? null,
                'others_3' => $item['others_3'] ?? null,
            ];

            Item::create($itemData);
        }
    }
}
