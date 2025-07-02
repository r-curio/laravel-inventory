<?php

namespace App\Console\Commands;

use App\Models\Diser;
use Illuminate\Console\Command;

class ResetDiserSales extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'diser:reset-sales {--dry-run : Show what would be reset without actually doing it}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all diser sales values to 0';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $query = Diser::query();
        
        if ($this->option('dry-run')) {
            $count = $query->count();
            $this->info("Would reset sales to 0 for {$count} diser records (dry run)");
            return 0;
        }
        
        $affected = $query->update(['sales' => 0]);
        
        $this->info("Successfully reset sales to 0 for {$affected} diser records.");
        
        return 0;
    }
} 