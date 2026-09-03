<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SynologySyncService;

class SyncSynologyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'synology:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize Excel data from Synology NAS to MySQL';

    /**
     * Execute the console command.
     */
    public function handle(SynologySyncService $syncService)
    {
        $this->info('Synology Sync Started');
        $this->line('');

        $divisions = config('synology.divisions', []);
        
        if (empty($divisions)) {
            $this->warn('No divisions configured in config/synology.php');
            return Command::SUCCESS;
        }

        foreach ($divisions as $divisionName => $config) {
            $this->info("[$divisionName]");
            
            $result = $syncService->syncDivision($divisionName, $config);
            
            $fileStr = $config['file'] ?? 'unknown_file';
            
            if ($result['status'] === 'skipped') {
                $this->line("✓ $fileStr detected");
                if ($result['message'] === 'File unchanged.') {
                    $this->line("✓ File unchanged");
                } else {
                    $this->line("! " . $result['message']);
                }
                $this->line("→ Skipped");
            } elseif ($result['status'] === 'success') {
                $this->line("✓ $fileStr detected");
                $this->line("→ Importing...");
                $this->line("✓ " . $result['message']);
            } else {
                $this->error("x Failed: " . $result['message']);
            }
            
            $this->line('');
        }

        $this->info('Sync completed.');
        
        return Command::SUCCESS;
    }
}
