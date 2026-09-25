<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AccurateApiService
{
    protected $apiToken;
    protected $signatureSecret;
    protected $host;

    /** Jumlah request yang sudah dipanggil dalam satu lifecycle (untuk monitoring) */
    protected int $requestCount = 0;

    public function __construct()
    {
        $this->apiToken        = env('ACCURATE_API_TOKEN');
        $this->signatureSecret = env('ACCURATE_SIGNATURE_SECRET');
        $this->host            = env('ACCURATE_HOST', 'https://account.accurate.id');
    }

    /**
     * Get Timestamp in format dd/mm/yyyy hh:nn:ss
     */
    protected function getTimestamp()
    {
        return Carbon::now('Asia/Jakarta')->format('d/m/Y H:i:s');
    }

    /**
     * Generate HMAC SHA-256 Signature Base64 Encoded
     */
    protected function generateSignature($timestamp)
    {
        $hash = hash_hmac('sha256', $timestamp, $this->signatureSecret, true);
        return base64_encode($hash);
    }

    /**
     * Build Headers for API Request
     */
    protected function buildHeaders()
    {
        $timestamp = $this->getTimestamp();
        $signature = $this->generateSignature($timestamp);

        return [
            'Authorization'    => 'Bearer ' . $this->apiToken,
            'X-Api-Timestamp'  => $timestamp,
            'X-Api-Signature'  => $signature,
            'Accept'           => 'application/json',
            'X-Language-Profile' => 'ID',
        ];
    }

    /**
     * Jumlah API request yang sudah terjadi (untuk monitoring).
     */
    public function getRequestCount(): int
    {
        return $this->requestCount;
    }

    /**
     * Perform GET Request dengan retry jika kena rate limit (HTTP 429).
     *
     * @param string $endpoint
     * @param array  $params
     * @param int    $maxRetries  Max percobaan ulang saat 429
     * @return array
     */
    public function get($endpoint, $params = [], int $maxRetries = 3)
    {
        $url     = rtrim($this->host, '/') . '/' . ltrim($endpoint, '/');
        $attempt = 0;

        while ($attempt <= $maxRetries) {
            $headers  = $this->buildHeaders();
            $this->requestCount++;

            Log::debug('Accurate API Request', [
                'request_no' => $this->requestCount,
                'url'        => $url,
                'attempt'    => $attempt + 1,
            ]);

            try {
                $response = Http::withOptions(['allow_redirects' => true])
                    ->withHeaders($headers)
                    ->get($url, $params);

                // Handle Accurate 308 Permanent Redirect
                if ($response->status() == 308) {
                    $respData = $response->json();
                    $newHost  = $respData['host'] ?? null;

                    if ($newHost) {
                        $this->host = $newHost;
                        $url = rtrim($this->host, '/') . '/' . ltrim($endpoint, '/');
                        // Retry dengan host baru (tidak increment attempt)
                        continue;
                    }
                }

                // Rate limit — tunggu lalu retry
                if ($response->status() == 429) {
                    $waitMs = (int) pow(2, $attempt) * 500; // 500ms, 1s, 2s, 4s
                    Log::warning('Accurate API 429 Rate Limit', [
                        'url'        => $url,
                        'attempt'    => $attempt + 1,
                        'wait_ms'    => $waitMs,
                    ]);
                    usleep($waitMs * 1000);
                    $attempt++;
                    continue;
                }

                if ($response->successful()) {
                    return $response->json();
                }

                Log::error('Accurate API GET Request Failed', [
                    'url'        => $url,
                    'status'     => $response->status(),
                    'response'   => $response->json(),
                ]);

                return [
                    's'           => false,
                    'error'       => $response->json() ?? 'Unknown API Error',
                    'status_code' => $response->status(),
                ];

            } catch (\Exception $e) {
                Log::error('Accurate API GET Exception: ' . $e->getMessage());
                return [
                    's'     => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        // Semua retry habis
        Log::error('Accurate API GET: Max retries exceeded', ['url' => $url]);
        return [
            's'     => false,
            'error' => 'Rate limit exceeded after ' . $maxRetries . ' retries',
        ];
    }

    /**
     * Check Connection & Get Correct Host
     */
    public function checkConnection()
    {
        // Token Endpoint untuk Accurate berada di account.accurate.id
        $this->host = 'https://account.accurate.id';
        return $this->get('/api/api-token.do');
    }
}
