<?php

namespace App\Console\Commands;

use App\Services\TicketingApiService;
use Illuminate\Console\Command;

class SyncTicketingData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ticketing:sync {--date_from= : Start date in YYYY-MM-DD} {--date_to= : End date in YYYY-MM-DD} {--all : Sync all tickets from historical beginning}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync IT tickets from external Ticketing API into local database';

    /**
     * Execute the console command.
     */
    public function handle(TicketingApiService $ticketingService): int
    {
        $this->info('Starting IT Ticketing API sync...');

        if (!$ticketingService->isConfigured()) {
            $this->error('TICKETING_API_HOST or TICKETING_INTEGRATION_TOKEN is not configured in .env');
            return Command::FAILURE;
        }

        $dateFrom = $this->option('date_from');
        $dateTo = $this->option('date_to');

        if ($this->option('all')) {
            $dateFrom = '2020-01-01';
            $dateTo = date('Y-12-31');
        } elseif (!$dateFrom && !$dateTo) {
            // Default sinkronisasi dari awal tahun berjalan agar mencakup seluruh riwayat tahun ini
            $dateFrom = date('Y-01-01');
            $dateTo = date('Y-12-31');
        }

        $filters = array_filter([
            'date_from' => $dateFrom,
            'date_to'   => $dateTo,
        ]);

        $this->info("Rentang tanggal sinkronisasi: {$filters['date_from']} s/d {$filters['date_to']}");

        try {
            $result = $ticketingService->syncToDatabase($filters);
            $this->info($result['message']);
            return Command::SUCCESS;
        } catch (\Exception $e) {

            $this->error('Ticketing sync failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
