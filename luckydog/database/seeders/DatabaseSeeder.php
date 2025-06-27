<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        User::create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => 'admin123',
            'role' => 'admin',
        ]);

        $this->call(StoreSeeder::class);
        $this->call(ItemSeeder::class);
        $this->call(StoreItemSeeder::class);
        $this->call(DiserSeeder::class);
        $this->call(StockLevelSeeder::class);
    }
}
