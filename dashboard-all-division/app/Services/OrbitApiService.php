<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrbitApiService
{
    protected ?string $baseUrl;
    protected ?string $token;

    public function __construct()
    {
        $this->baseUrl = trim(config('services.orbit.base_url') ?: (env('ORBIT_BASE_URL') ?: ''));
        $this->token = trim(config('services.orbit.token') ?: (env('ORBIT_API_TOKEN') ?: ''));
    }

    /**
     * Memeriksa apakah konfigurasi host dan token integrasi AZM ORBIT sudah tersedia.
     */
    public function isConfigured(): bool
    {
        return !empty($this->baseUrl) && !empty($this->token);
    }

    /**
     * Mengambil endpoint projects v1.
     */
    protected function getProjectsEndpoint(): string
    {
        $base = trim($this->baseUrl);
        if (!preg_match('#^https?://#i', $base)) {
            $base = 'https://' . $base;
        }
        $base = rtrim($base, '/');
        if (str_contains($base, '/api/v1/projects')) {
            return $base;
        }
        return $base . '/api/v1/projects';
    }

    /**
     * Mengambil satu halaman data project dari AZM ORBIT menggunakan cursor pagination.
     */
    public function fetchProjectsPage(?int $cursor = null, int $limit = 100): array
    {
        if (!$this->isConfigured()) {
            throw new \Exception('ORBIT_BASE_URL atau ORBIT_API_TOKEN belum dikonfigurasi di .env.');
        }

        $url = $this->getProjectsEndpoint();
        $params = [
            'limit' => min(100, max(1, $limit)),
        ];

        if (!empty($cursor)) {
            $params['cursor'] = $cursor;
        }

        Log::debug('ORBIT API Request', [
            'url'    => $url,
            'params' => $params,
        ]);

        $response = Http::withToken($this->token)
            ->timeout(20)
            ->acceptJson()
            ->get($url, $params);

        if (!$response->successful()) {
            $status = $response->status();
            $body = $response->json();
            $msg = $body['message'] ?? $response->body();
            Log::error('ORBIT API Error response', [
                'status' => $status,
                'body'   => $body,
            ]);
            throw new \Exception("ORBIT API merespons {$status}: {$msg}");
        }

        return $response->json() ?? [];
    }

    /**
     * Mengambil semua project Software AZM ORBIT melalui cursor pagination.
     */
    public function fetchAllSoftwareProjects(): array
    {
        $allProjects = [];
        $cursor = null;
        $pageCount = 0;
        $maxPages = 50; // Safety guard agar tidak looping tak berujung

        do {
            $pageCount++;
            $response = $this->fetchProjectsPage($cursor, 100);
            $items = $response['data'] ?? [];

            foreach ($items as $item) {
                $allProjects[] = $item;
            }

            $hasMore = !empty($response['has_more']);
            $cursor = $response['next_cursor'] ?? null;
        } while ($hasMore && !empty($cursor) && $pageCount < $maxPages);

        return $allProjects;
    }

    /**
     * Mengambil data teragregasi untuk Dashboard IT System (Cached 5 menit).
     */
    public function getDashboardSoftwareData(bool $isRefresh = false): array
    {
        $cacheKey = 'it_dashboard_orbit_software_projects';

        if ($isRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 300, function () {
            $rawProjects = $this->fetchAllSoftwareProjects();

            $launchedList = [];
            $developmentList = [];

            foreach ($rawProjects as $project) {
                $isCompleted = (bool)($project['is_completed'] ?? false);
                $progress = (int)($project['progress'] ?? 0);

                $formattedItem = [
                    'id'               => $project['id'] ?? null,
                    'name'             => $project['title'] ?? 'Untitled Software',
                    'title'            => $project['title'] ?? 'Untitled Software',
                    'description'      => $project['description'] ?? '',
                    'progress'         => $progress,
                    'status'           => $isCompleted ? 'launched' : 'development',
                    'is_completed'     => $isCompleted,
                    'approval_status'  => $project['approval_status'] ?? 'APPROVED',
                    'start_date'       => $project['start_date'] ?? null,
                    'deadline'         => $project['extended_deadline'] ?: ($project['deadline'] ?? null),
                    'completed_at'     => $project['completed_at'] ?? null,
                    'pic_name'         => $project['pic']['name'] ?? null,
                    'pic'              => $project['pic'] ?? null,
                    'division_name'    => $project['division']['name'] ?? null,
                    'department_name'  => $project['division']['department']['name'] ?? null,
                    'status_name'      => $project['status']['name'] ?? null,
                    'priority'         => $project['priority']['name'] ?? null,
                    'source'           => 'orbit',
                ];

                if ($isCompleted) {
                    $launchedList[] = $formattedItem;
                } else {
                    $developmentList[] = $formattedItem;
                }
            }

            return [
                'summary' => [
                    'launched'    => count($launchedList),
                    'development' => count($developmentList),
                    'total'       => count($launchedList) + count($developmentList),
                    'source'      => 'orbit',
                ],
                'launched_list'    => $launchedList,
                'development_list' => $developmentList,
            ];
        });
    }
}
