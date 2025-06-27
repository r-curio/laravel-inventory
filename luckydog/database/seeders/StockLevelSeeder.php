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
        // Define an array of your JSON files
        $jsonFiles = ['TV-H.json', 'TV-J.json', 'TV-K.json', 'TV-L.json'];

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