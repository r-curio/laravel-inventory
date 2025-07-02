<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB; // Use DB Facade for insertOrIgnore/updateOrInsert
use Illuminate\Support\Facades\File;

// If you still want to use a model for other operations, ensure it's properly set up
// use App\Models\StockLevel; // Only uncomment if you have a StockLevel model mapping directly to this structure

class StockLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define an array of all your JSON files
        $jsonFiles = [
            'PET EXPRESS-K.json',
            'PET EXPRESS-J.json',
            'PET EXPRESS-H.json',
            'PET EXPRESS-G.json',
            'PET EXPRESS-F.json',
            'PET EXPRESS-E.json',
            'PET EXPRESS-D.json',
            'PET EXPRESS-C.json',
            'GAISANO-K.json',
            'GAISANO-J.json',
            'GAISANO-H.json',
            'GAISANO-G.json',
            'SM-A.json',
            'SM-B.json',
            'SM-C.json',
            'SM-E.json',
            'SM-F.json',
            'SM-G.json',
            'SM-H.json',
            'SM-J.json',
            'SM-K.json',
            'SM-L.json',
            'SM-D.json',
            'Waltermart-CLASS J (1).json',
            'Waltermart-CLASS K  (1).json',
            'RSC-F.json',
            'RSC-H.json',
            'RSC-J.json',
            'RSC-K.json',
            'RSC-L.json',
            'RSC-G.json',
            'MNDPRO-C.json',
            'HX-J.json',
            'HX-K.json',
            'HX-L.json',
            'HMN-F.json',
            'HMN-G.json',
            'HMN-H.json',
            'HMN-J.json',
            'HMN-K.json',
            'HMN-L.json',
            'TV-K.json',
            'TV-H.json',
            'TV-J.json',
            'TV-L.json'
        ];

        // Define the table name explicitly for DB::table()
        $tableName = 'stock_levels'; 

        foreach ($jsonFiles as $fileName) {
            $jsonPath = database_path('data/stock_level/' . $fileName);

            // Check if the file exists
            if (!File::exists($jsonPath)) {
                $this->command->warn("Skipping '{$fileName}': File not found at {$jsonPath}");
                continue; // Skip to the next file if not found
            }

            // Get JSON content
            $jsonContent = File::get($jsonPath);
            $stockLevelsData = json_decode($jsonContent, true);

            // Check for JSON decoding errors
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->command->error("Error decoding JSON from '{$fileName}': " . json_last_error_msg());
                continue; // Skip to the next file
            }

            // Ensure the 'class' key exists at the top level
            $productClass = $stockLevelsData['class'] ?? null;
            $productStoreName = $stockLevelsData['name'] ?? null;
            $productCo = $stockLevelsData['co'] ?? null;
            if (is_null($productClass)) {
                $this->command->warn("Skipping '{$fileName}': 'class' key not found in JSON data.");
                continue;
            }

            // Loop through each product entry in the 'products' array
            foreach ($stockLevelsData['products'] as $productEntry) {
                // Each $productEntry is an array like ["TV-1SR" => ["order" => 15]]
                foreach ($productEntry as $productName => $details) {
                    $orderQuantity = $details['order'] ?? null; // Get the 'order' value, handling potential missing key

                    // Use DB::table()->insertOrIgnore() for composite primary keys
                    // This will insert if the (name, class, co) combination is new,
                    // and do nothing if it already exists.
                    DB::table($tableName)->insertOrIgnore([
                        'store_name' => $productStoreName,
                        'name' => $productName, // The actual product name (e.g., 'TV-1SR')
                        'class' => $productClass,        // The class (e.g., 'K', 'J')
                        'co' => $productCo,
                        'order' => $orderQuantity, // The order value (e.g., 15)       
                    ]);
                }
            }
            $this->command->info("Successfully seeded data from '{$fileName}'.");
        }
    }
}