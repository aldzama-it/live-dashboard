<?php

namespace App\Services;

use App\Models\ItAsset;
use App\Models\ItEmail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AssetApiService
{
    protected ?string $host;
    protected ?string $token;

    public function __construct()
    {
        $this->host = config('services.asset_api.host') ?: env('ASSET_API_HOST');
        $this->token = config('services.asset_api.token') ?: env('ASSET_API_V1_TOKEN');
    }

    /**
     * Memeriksa apakah konfigurasi host dan token integrasi sudah tersedia.
     */
    public function isConfigured(): bool
    {
        return !empty($this->host) && !empty($this->token);
    }

    /**
     * Mengambil URL endpoint feed aset versi v1.
     */
    protected function getEndpointUrl(): string
    {
        $baseUrl = rtrim($this->host, '/');
        if (str_contains($baseUrl, '/api/v1/assets')) {
            return $baseUrl;
        }
        return $baseUrl . '/api/v1/assets';
    }

    /**
     * Memanggil endpoint API untuk satu halaman data aset.
     */
    public function fetchAssetsPage(array $queryParams = [], int $page = 1, int $limit = 100): array
    {
        if (!$this->isConfigured()) {
            throw new \Exception('ASSET_API_HOST atau ASSET_API_V1_TOKEN belum dikonfigurasi di .env.');
        }

        $params = array_filter(array_merge($queryParams, [
            'page'  => $page,
            'limit' => min(100, max(1, $limit)),
        ]));

        $url = $this->getEndpointUrl();

        Log::debug('Asset API Request', [
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
            Log::error('Asset API Error response', [
                'status' => $status,
                'body'   => $body,
            ]);
            throw new \Exception("Asset API merespons {$status}: {$msg}");
        }

        return $response->json() ?? [];
    }

    /**
     * Mengambil seluruh data aset fisik (paginasi otomatis).
     */
    public function fetchAllPhysicalAssets(): array
    {
        $page = 1;
        $limit = 100;
        $allAssets = [];

        do {
            $resp = $this->fetchAssetsPage(['group' => 'physical'], $page, $limit);
            $items = $resp['data'] ?? [];
            foreach ($items as $item) {
                $allAssets[] = $item;
            }

            $meta = $resp['meta'] ?? [];
            $hasNext = !empty($meta['has_next_page']);
            $totalPages = $meta['total_pages'] ?? 1;
            $page++;
        } while ($hasNext && $page <= $totalPages && $page <= 50);

        return $allAssets;
    }

    /**
     * Mengambil seluruh data aset digital email (paginasi otomatis).
     */
    public function fetchAllEmailAssets(): array
    {
        $page = 1;
        $limit = 100;
        $allEmails = [];

        do {
            $resp = $this->fetchAssetsPage(['group' => 'digital', 'category' => 'email'], $page, $limit);
            $items = $resp['data'] ?? [];
            foreach ($items as $item) {
                $allEmails[] = $item;
            }

            $meta = $resp['meta'] ?? [];
            $hasNext = !empty($meta['has_next_page']);
            $totalPages = $meta['total_pages'] ?? 1;
            $page++;
        } while ($hasNext && $page <= $totalPages && $page <= 50);

        return $allEmails;
    }

    /**
     * Mengambil data aset teragregasi untuk dashboard IT System (dengan Cache 5 menit).
     */
    public function getDashboardAssetsData(bool $isRefresh = false): array
    {
        $cacheKey = 'it_dashboard_live_assets_cache';
        if ($isRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 300, function () {
            $rawAssets = $this->fetchAllPhysicalAssets();

            $general = [];
            $individual = [];

            foreach ($rawAssets as $item) {
                $externalId = 'physical:' . ($item['category'] ?? 'asset') . ':' . $item['id'];
                $spec = $item['specification'] ?: $item['name'];
                $assetName = (!empty($item['asset_code']) ? '[' . $item['asset_code'] . '] ' : '') . $item['name'];
                $hasReceiver = !empty($item['receiver_name']) && trim($item['receiver_name']) !== '-';

                $mapped = [
                    'id'                => $item['id'],
                    'external_id'       => $externalId,
                    'type'              => $hasReceiver ? 'individual' : 'general',
                    'category'          => $item['category'] ?? null,
                    'asset_name'        => $assetName,
                    'asset_code'        => $item['asset_code'] ?? null,
                    'brand_description' => $spec,
                    'specification'     => $spec,
                    'location'          => $item['location'] ?: '-',
                    'condition'         => $item['condition'] ?: 'Baik',
                    'status'            => $item['status'] ?? null,
                    'receiver_name'     => $item['receiver_name'] ?: '-',
                    'department'        => $item['department'] ?: '-',
                    'division_project'  => $item['division_project'] ?: '-',
                    'handover_date'     => !empty($item['handover_date']) ? substr($item['handover_date'], 0, 10) : null,
                ];

                if ($hasReceiver) {
                    $individual[] = $mapped;
                } else {
                    $general[] = $mapped;
                }
            }

            return [
                'total'             => count($rawAssets),
                'total_general'     => count($general),
                'total_individual'  => count($individual),
                'general'           => $general,
                'individual'        => $individual,
                'general_assets'    => $general,
                'individual_assets' => $individual,
                'is_live'           => true,
            ];
        });
    }

    /**
     * Mengambil data email teragregasi untuk dashboard IT System (dengan Cache 5 menit).
     */
    public function getDashboardEmailsData(bool $isRefresh = false): array
    {
        $cacheKey = 'it_dashboard_live_emails_cache';
        if ($isRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 300, function () {
            $rawEmails = $this->fetchAllEmailAssets();
            $emails = [];

            foreach ($rawEmails as $item) {
                $externalId = 'digital:email:' . $item['id'];
                $emailAddr = $item['attributes']['email'] ?? $item['name'];
                $domain = $item['attributes']['domain'] ?? null;
                if (empty($domain) && str_contains($emailAddr, '@')) {
                    $parts = explode('@', $emailAddr);
                    $domain = $parts[1] ?? 'aldzama.co.id';
                }

                $userName = $item['receiver_name'] ?? null;
                if (empty($userName)) {
                    if (!empty($item['name']) && !str_contains($item['name'], '@')) {
                        $userName = $item['name'];
                    } elseif (str_contains($emailAddr, '@')) {
                        $userName = ucfirst(explode('@', $emailAddr)[0]);
                    } else {
                        $userName = 'User';
                    }
                }

                $emails[] = [
                    'id'               => $item['id'],
                    'external_id'      => $externalId,
                    'email_address'    => $emailAddr,
                    'domain'           => $domain ?: 'aldzama.co.id',
                    'user_name'        => $userName,
                    'department'       => $item['department'] ?: '-',
                    'division_project' => $item['division_project'] ?: '-',
                    'status'           => $item['status'] ?? 'Aktif',
                ];
            }

            return $emails;
        });
    }

    /**
     * Melakukan sinkronisasi data dari Asset API v1 ke database lokal (it_assets & it_emails).
     */
    public function syncToDatabase(): array
    {
        // 1. Sinkronisasi Aset Fisik
        $rawAssets = $this->fetchAllPhysicalAssets();
        $syncedAssetsCount = 0;

        foreach ($rawAssets as $item) {
            $externalId = 'physical:' . ($item['category'] ?? 'asset') . ':' . $item['id'];
            $spec = $item['specification'] ?: $item['name'];
            $assetName = (!empty($item['asset_code']) ? '[' . $item['asset_code'] . '] ' : '') . $item['name'];
            $hasReceiver = !empty($item['receiver_name']) && trim($item['receiver_name']) !== '-';

            ItAsset::updateOrCreate(
                ['external_id' => $externalId],
                [
                    'type'              => $hasReceiver ? 'individual' : 'general',
                    'category'          => $item['category'] ?? null,
                    'asset_name'        => $assetName,
                    'asset_code'        => $item['asset_code'] ?? null,
                    'brand_description' => $spec,
                    'specification'     => $spec,
                    'location'          => $item['location'] ?: null,
                    'condition'         => $item['condition'] ?: 'Baik',
                    'status'            => $item['status'] ?? null,
                    'receiver_name'     => $item['receiver_name'] ?: null,
                    'department'        => $item['department'] ?: null,
                    'division_project'  => $item['division_project'] ?: null,
                    'handover_date'     => !empty($item['handover_date']) ? substr($item['handover_date'], 0, 10) : null,
                ]
            );
            $syncedAssetsCount++;
        }

        // 2. Sinkronisasi Email Digital
        $rawEmails = $this->fetchAllEmailAssets();
        $syncedEmailsCount = 0;

        foreach ($rawEmails as $item) {
            $externalId = 'digital:email:' . $item['id'];
            $emailAddr = $item['attributes']['email'] ?? $item['name'];
            if (empty($emailAddr)) {
                continue;
            }

            $domain = $item['attributes']['domain'] ?? null;
            if (empty($domain) && str_contains($emailAddr, '@')) {
                $parts = explode('@', $emailAddr);
                $domain = $parts[1] ?? 'aldzama.co.id';
            }

            $userName = $item['receiver_name'] ?? null;
            if (empty($userName)) {
                if (!empty($item['name']) && !str_contains($item['name'], '@')) {
                    $userName = $item['name'];
                } elseif (str_contains($emailAddr, '@')) {
                    $userName = ucfirst(explode('@', $emailAddr)[0]);
                } else {
                    $userName = 'User';
                }
            }

            ItEmail::updateOrCreate(
                ['email_address' => $emailAddr],
                [
                    'external_id'      => $externalId,
                    'domain'           => $domain ?: 'aldzama.co.id',
                    'user_name'        => $userName,
                    'department'       => $item['department'] ?: null,
                    'division_project' => $item['division_project'] ?: null,
                    'status'           => $item['status'] ?? 'Aktif',
                ]
            );
            $syncedEmailsCount++;
        }

        // Invalidate live cache agar request berikutnya langsung mengambil data sinkronisasi terbaru
        Cache::forget('it_dashboard_live_assets_cache');
        Cache::forget('it_dashboard_live_emails_cache');

        return [
            'synced_assets' => $syncedAssetsCount,
            'synced_emails' => $syncedEmailsCount,
        ];
    }
}
