<?php

namespace App\Services;

use App\Models\ItTicket;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class TicketingApiService
{
    protected ?string $host;
    protected ?string $token;

    public function __construct()
    {
        $this->host = config('services.ticketing.host') ?: env('TICKETING_API_HOST');
        $this->token = config('services.ticketing.token') ?: env('TICKETING_INTEGRATION_TOKEN');
    }

    /**
     * Memeriksa apakah konfigurasi host dan token integrasi sudah tersedia.
     */
    public function isConfigured(): bool
    {
        return !empty($this->host) && !empty($this->token);
    }

    /**
     * Mengambil URL endpoint feed tiket berversi v1.
     */
    protected function getEndpointUrl(): string
    {
        $baseUrl = rtrim($this->host, '/');
        // Jika host sudah berisi path api/v1/integrations/assets/tickets
        if (str_contains($baseUrl, '/integrations/assets/tickets')) {
            return $baseUrl;
        }
        return $baseUrl . '/api/v1/integrations/assets/tickets';
    }

    /**
     * Memanggil endpoint Ticketing API untuk halaman tertentu.
     *
     * @param array $filters (date_from, date_to, status, priority)
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function fetchTicketsPage(array $filters = [], int $page = 1, int $perPage = 100): array
    {
        if (!$this->isConfigured()) {
            throw new \Exception('Ticketing API host atau token integrasi belum dikonfigurasi di .env.');
        }

        $params = array_filter([
            'date_from' => $filters['date_from'] ?? null,
            'date_to'   => $filters['date_to'] ?? null,
            'status'    => $filters['status'] ?? null,
            'priority'  => $filters['priority'] ?? null,
            'page'      => $page,
            'per_page'  => min(100, max(1, $perPage)),
        ]);

        $url = $this->getEndpointUrl();

        Log::debug('Ticketing API Request', [
            'url'    => $url,
            'params' => $params,
            'page'   => $page,
        ]);

        $response = Http::withHeaders([
            'X-Integration-Token' => $this->token,
            'Accept'              => 'application/json',
        ])
        ->timeout(20)
        ->get($url, $params);

        if (!$response->successful()) {
            $errorMsg = 'Ticketing API request failed (HTTP ' . $response->status() . '): ' . $response->body();
            Log::error($errorMsg, [
                'url'    => $url,
                'status' => $response->status(),
            ]);
            throw new \Exception($errorMsg);
        }

        return $response->json() ?? [];
    }

    /**
     * Mengambil seluruh tiket dalam rentang tanggal dengan pagination otomatis sampai last_page.
     *
     * @param array $filters
     * @param int $maxPages Batas pengaman jumlah halaman
     * @return array
     */
    public function fetchAllTickets(array $filters = [], int $maxPages = 50): array
    {
        $currentPage = 1;
        $allTickets = [];
        $apiSummary = [];
        $statusBreakdown = [];
        $trend = [];

        do {
            $json = $this->fetchTicketsPage($filters, $currentPage, 100);
            $data = $json['data'] ?? [];

            // Simpan agregasi envelope dari response pertama
            if ($currentPage === 1) {
                $apiSummary = $data['summary'] ?? [];
                $statusBreakdown = $data['status_breakdown'] ?? [];
                $trend = $data['trend'] ?? [];
            }

            $ticketsContainer = $data['tickets'] ?? [];
            $ticketsData = $ticketsContainer['data'] ?? [];
            $pagination = $ticketsContainer['pagination'] ?? [];
            $lastPage = (int)($pagination['last_page'] ?? 1);

            foreach ($ticketsData as $ticket) {
                $allTickets[] = $ticket;
            }

            $currentPage++;
        } while ($currentPage <= $lastPage && $currentPage <= $maxPages);

        return [
            'summary'          => $apiSummary,
            'status_breakdown' => $statusBreakdown,
            'trend'            => $trend,
            'tickets'          => $allTickets,
            'total'            => count($allTickets),
        ];
    }

    /**
     * Mengambil data tiket teragregasi yang disesuaikan untuk dashboard IT System.
     * Dilengkapi mekanisme caching agar performa live dashboard tetap optimal.
     */
    public function getDashboardTicketsData(?string $startDate = null, ?string $endDate = null, bool $forceRefresh = false): array
    {
        $startDate = $startDate ?: date('Y-m-01');
        $endDate = $endDate ?: date('Y-m-t');

        $cacheKey = 'it_dashboard_live_tickets_' . md5($startDate . '_' . $endDate);

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 180, function () use ($startDate, $endDate) {
            $fetched = $this->fetchAllTickets([
                'date_from' => $startDate,
                'date_to'   => $endDate,
            ]);

            $tickets = $fetched['tickets'] ?? [];

            return $this->computeDashboardMetrics($tickets, $startDate, $endDate, $fetched['summary'] ?? []);
        });
    }

    /**
     * Menghitung metric KPI, grafik donut, grafik bar volume, dan tren resolusi dari koleksi tiket.
     */
    public function computeDashboardMetrics(array $tickets, string $startDate, string $endDate, array $apiSummary = []): array
    {
        $resolvedCount = 0;
        $totalMinutes = 0;
        $categoriesCount = [];
        $workloadCount = [];
        $statusCount = [];

        $dailyResolution = [];
        $weeklyVolume = [
            1 => 0, // Senin
            2 => 0, // Selasa
            3 => 0, // Rabu
            4 => 0, // Kamis
            5 => 0, // Jumat
            6 => 0, // Sabtu
            7 => 0  // Minggu
        ];

        foreach ($tickets as $t) {
            $status = $t['status'] ?? 'NEW';
            $category = $t['category'] ?? 'Uncategorized';
            $assignedTo = $t['assigned_to'] ?? 'Unassigned';

            // Kategori
            if (!empty($category)) {
                $categoriesCount[$category] = ($categoriesCount[$category] ?? 0) + 1;
            }

            // Workload
            if (!empty($assignedTo)) {
                $workloadCount[$assignedTo] = ($workloadCount[$assignedTo] ?? 0) + 1;
            }

            // Status Breakdown
            $statusCount[$status] = ($statusCount[$status] ?? 0) + 1;

            // Resolusi & Waktu
            $isResolved = in_array(strtoupper($status), ['RESOLVED', 'CLOSED']) || !empty($t['resolved_at']);
            if ($isResolved) {
                $resolvedCount++;

                if (!empty($t['created_at']) && !empty($t['resolved_at'])) {
                    try {
                        $created = Carbon::parse($t['created_at']);
                        $resolved = Carbon::parse($t['resolved_at']);
                        $minutes = abs($resolved->diffInMinutes($created));
                        $totalMinutes += $minutes;

                        $dateKey = $created->format('Y-m-d');
                        if (!isset($dailyResolution[$dateKey])) {
                            $dailyResolution[$dateKey] = ['total_minutes' => 0, 'count' => 0];
                        }
                        $dailyResolution[$dateKey]['total_minutes'] += $minutes;
                        $dailyResolution[$dateKey]['count'] += 1;
                    } catch (\Exception $e) {}
                }
            }

            // Volume per hari dalam minggu (1 = Senin s/d 7 = Minggu)
            if (!empty($t['created_at'])) {
                try {
                    $created = Carbon::parse($t['created_at']);
                    $dayOfWeek = (int)$created->format('N');
                    if (isset($weeklyVolume[$dayOfWeek])) {
                        $weeklyVolume[$dayOfWeek]++;
                    }
                } catch (\Exception $e) {}
            }
        }

        // Hitung rata-rata waktu resolusi
        $avgMinutes = $resolvedCount > 0 ? ($totalMinutes / $resolvedCount) : 0;
        $avgHours = floor($avgMinutes / 60);
        $avgMins = $avgMinutes % 60;
        $resolutionTimeStr = "{$avgHours}h {$avgMins}m";

        // Format Kategori untuk Donut Chart
        $formattedCategories = [];
        foreach ($categoriesCount as $cat => $total) {
            $formattedCategories[] = [
                'category' => $cat,
                'total'    => $total,
            ];
        }
        usort($formattedCategories, fn($a, $b) => $b['total'] <=> $a['total']);

        // Format Workload
        $formattedWorkload = [];
        foreach ($workloadCount as $user => $total) {
            $formattedWorkload[] = [
                'assigned_to'   => $user,
                'total_tickets' => $total,
            ];
        }
        usort($formattedWorkload, fn($a, $b) => $b['total_tickets'] <=> $a['total_tickets']);

        // Format Status Breakdown
        $formattedStatus = [];
        foreach ($statusCount as $st => $total) {
            $formattedStatus[] = [
                'status' => $st,
                'total'  => $total,
            ];
        }

        // Daily Resolution Chart (Line Chart)
        $dailyResolutionData = [];
        $dailyResolutionLabels = [];
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dateKey = $date->format('Y-m-d');
            $dailyResolutionLabels[] = $date->format('d M');

            if (isset($dailyResolution[$dateKey]) && $dailyResolution[$dateKey]['count'] > 0) {
                $avgMin = $dailyResolution[$dateKey]['total_minutes'] / $dailyResolution[$dateKey]['count'];
                $dailyResolutionData[] = round($avgMin / 60, 2);
            } else {
                $dailyResolutionData[] = 0;
            }
        }

        // Daily Ticket Volume (Bar Chart Mon-Sun)
        $dailyVolumeData = [];
        for ($i = 1; $i <= 7; $i++) {
            $dailyVolumeData[] = $weeklyVolume[$i] ?? 0;
        }

        return [
            'avg_resolution_time'    => $resolutionTimeStr,
            'total_resolved'         => $resolvedCount,
            'categories'             => $formattedCategories,
            'workload'               => $formattedWorkload,
            'status_breakdown'       => $formattedStatus,
            'daily_resolution_time'   => $dailyResolutionData,
            'daily_resolution_labels' => $dailyResolutionLabels,
            'daily_ticket_volume'     => $dailyVolumeData,
            'raw_tickets'            => $tickets,
            'summary'                => $apiSummary,
            'is_live'                => true,
            'has_token'              => true,
        ];
    }

    /**
     * Melakukan sinkronisasi data dari Ticketing API ke database tabel it_tickets.
     */
    public function syncToDatabase(array $filters = []): array
    {
        $fetched = $this->fetchAllTickets($filters);
        $tickets = $fetched['tickets'] ?? [];

        if (empty($tickets)) {
            return [
                'synced' => 0,
                'total'  => 0,
                'message' => 'Tidak ada tiket yang ditemukan dari Ticketing API.',
            ];
        }

        // Cek kolom yang tersedia pada tabel it_tickets
        $hasColumnTable = [];
        try {
            $columns = Schema::getColumnListing('it_tickets');
            foreach ($columns as $col) {
                $hasColumnTable[$col] = true;
            }
        } catch (\Exception $e) {
            Log::warning('Gagal membaca schema it_tickets: ' . $e->getMessage());
        }

        $syncedCount = 0;

        foreach ($tickets as $t) {
            $ticketNumber = $t['ticket_number'] ?? null;
            if (empty($ticketNumber)) {
                continue;
            }

            $resolvedAt = null;
            if (!empty($t['resolved_at'])) {
                try {
                    $resolvedAt = Carbon::parse($t['resolved_at'])->format('Y-m-d H:i:s');
                } catch (\Exception $e) {}
            }

            $createdAt = null;
            if (!empty($t['created_at'])) {
                try {
                    $createdAt = Carbon::parse($t['created_at'])->format('Y-m-d H:i:s');
                } catch (\Exception $e) {}
            }

            $payload = [
                'subject'                  => $t['subject'] ?? 'No Subject',
                'department'               => $t['department'] ?? null,
                'category'                 => $t['category'] ?? null,
                'description'              => $t['description'] ?? null,
                'status'                   => $t['status'] ?? 'NEW',
                'priority'                 => $t['priority'] ?? 'Medium',
                'assigned_to'              => $t['assigned_to'] ?? null,
                'resolved_at'              => $resolvedAt,
            ];

            if ($createdAt) {
                $payload['created_at'] = $createdAt;
            }

            // Tambahkan kolom baru hanya jika kolom tersebut ada di tabel database
            $optionalFields = [
                'reporter_name'            => $t['reporter_name'] ?? null,
                'reporter_phone'           => $t['reporter_phone'] ?? null,
                'reporter_email'           => $t['reporter_email'] ?? null,
                'location'                 => $t['location'] ?? null,
                'detail_url'               => $t['detail_url'] ?? null,
                'assigned_to_id'           => $t['assigned_to_id'] ?? null,
                'department_id'            => $t['department_id'] ?? null,
                'category_id'              => $t['category_id'] ?? null,
                'location_id'              => $t['location_id'] ?? null,
                'attachment_path'          => $t['attachment_path'] ?? null,
                'attachment_original_name' => $t['attachment_original_name'] ?? null,
                'attachment_mime'          => $t['attachment_mime'] ?? null,
                'attachment_size'          => $t['attachment_size'] ?? null,
            ];

            foreach ($optionalFields as $field => $val) {
                if (empty($hasColumnTable) || isset($hasColumnTable[$field])) {
                    $payload[$field] = $val;
                }
            }

            ItTicket::updateOrCreate(
                ['ticket_number' => $ticketNumber],
                $payload
            );

            $syncedCount++;
        }

        return [
            'synced' => $syncedCount,
            'total'  => count($tickets),
            'message' => "Berhasil menyinkronkan {$syncedCount} tiket ke database lokal.",
        ];
    }
}
