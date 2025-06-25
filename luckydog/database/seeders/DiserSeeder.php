<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Diser;
use Illuminate\Support\Facades\File;

class DiserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('data/diser/disers_file.json');
        $disers = json_decode(File::get($jsonPath), true);
        
        // Check if the data is an array or single object
        if (is_array($disers)) {
            // If it's an array, create each diser
            foreach ($disers as $diser) {
                Diser::create($diser);
            }
        } else {
            // If it's a single object, create it directly
            Diser::create($disers);
        }
    }
}
