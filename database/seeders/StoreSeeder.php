<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Store;
use Illuminate\Support\Facades\File;

class StoreSeeder extends Seeder
{
    public function run(): void
    {
        $jsonFiles = ['TV.json', 'HMN.json', 'RSC.json', 'SM.json', 'GAI.json', 'HX.json', 'LND.json', 'PET.json', 'WM.json'];
        
        foreach ($jsonFiles as $jsonFile) {
            $jsonPath = database_path('data/' . $jsonFile);
            $stores = json_decode(File::get($jsonPath), true);

            foreach ($stores as $store) {
                // Skip empty store names
                if (empty($store['name'])) {
                    continue;
                }

                Store::create([
                    'name' => $store['name'],
                    'dc' => $store['dc'],
                    'co' => $store['co'],
                    'class' => $store['class'],
                    'code' => $store['code'] ?? null,
                    'area_size' => $store['area_size'],
                    'overstock' => $store['overstock'],
                    'ratbites' => $store['ratbites'],
                    'closed' => $store['closed'],
                    'no_diser' => $store['no_diser'],
                    'pullout_status' => $store['pullout_status'],
                    'dgcage_status' => $store['dgcage_status'],
                    'tshirt_status' => $store['tshirt_status'],
                    'litter_box_status' => $store['litter_box_status'],
                    'pet_bed_status' => $store['pet_bed_status'],
                    'gondola_dep' => $store['gondola_dep'],
                    'date_depo_refund' => $store['date_depo_refund'],
                    'missing_deliveries' => $store['missing_deliveries'],
                    'items_overstock' => $store['items_overstock'] ?? null,
                    'po_or_limit' => $store['po_or_limit'] ?? null,
                    'items_not_allowed' => $store['items_not_allowed'] ?? null,
                    'items_order' => $store['items_order'] ?? null,
                    'others' => $store['others'] ?? null,
                ]);
            }
        }
    }
} 