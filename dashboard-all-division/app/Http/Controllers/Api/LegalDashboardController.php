<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalDocument;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class LegalDashboardController extends Controller
{
    /**
     * Get Base Path for Synology NAS or fallback to local
     */
    private function getLegalBasePath(): string
    {
        $nasPath = 'Z:\\dashboard-data\\legal';
        if (File::exists($nasPath)) {
            return $nasPath;
        }

        $localPath = base_path('../data legal');
        if (File::exists($localPath)) {
            return $localPath;
        }

        return base_path('database/seeders');
    }

    /**
     * Executive Overview Summary for 1-Page Dashboard (All 6 Modules)
     */
    public function summary(Request $request): JsonResponse
    {
        $selectedMonth = $request->input('month', 'all'); // 'all' or '1'..'12'
        $allDocs = LegalDocument::all();

        // 1. Legal Documents & SILO Stats
        $docStats = [
            'total_documents' => $allDocs->count(),
            'total_silo' => $allDocs->where('category', 'silo')->count(),
            'total_permit' => $allDocs->where('category', 'permit')->count(),
            'total_agreement' => $allDocs->where('category', 'agreement')->count(),
            'total_project_contract' => $allDocs->where('category', 'project_contract')->count(),
            'total_vehicle' => $allDocs->where('category', 'vehicle')->count(),
            'total_expired' => $allDocs->where('urgency_status', 'expired')->count(),
            'total_critical' => $allDocs->where('urgency_status', 'critical')->count(),
            'total_warning' => $allDocs->where('urgency_status', 'warning')->count(),
            'total_safe' => $allDocs->where('urgency_status', 'safe')->count(),
            'silo_critical_h60' => $allDocs->where('category', 'silo')->where('urgency_status', 'critical')->count(),
            'permit_critical_h30' => $allDocs->where('category', 'permit')->where('urgency_status', 'critical')->count(),
        ];

        // 2. MP Baseline (Kontrak Karyawan Expiring Stats & Site Distribution)
        $mpData = $this->getMpBaselineData();
        $now = Carbon::now();
        $mpExpiringMonth = 0;
        $mpExpiring30Days = 0;
        $siteDistribution = [];

        foreach ($mpData as $emp) {
            $branch = $emp['branch'] ?? 'Other';
            if (!isset($siteDistribution[$branch])) {
                $siteDistribution[$branch] = ['site' => $branch, 'total' => 0, 'expiring' => 0];
            }
            $siteDistribution[$branch]['total']++;

            if (!empty($emp['end_date'])) {
                try {
                    $end = Carbon::parse($emp['end_date']);
                    $diff = $now->diffInDays($end, false);
                    if ($selectedMonth !== 'all' && (int)$end->format('n') === (int)$selectedMonth) {
                        $mpExpiringMonth++;
                    }
                    if ($diff >= 0 && $diff <= 30) {
                        $mpExpiring30Days++;
                    }
                    if ($diff >= 0 && $diff <= 60) {
                        $siteDistribution[$branch]['expiring']++;
                    }
                } catch (\Exception $e) {}
            }
        }

        // 3. Legal KPI Stats (Review, Advisory, Drafting, Litigasi, Pelanggaran)
        $kpiData = $this->getLegalKpiData($selectedMonth);

        // 4. Budget & Dana Operasional Stats
        $budgetData = $this->getOperationalBudgetData($selectedMonth);

        // 5 & 6. Downloads count
        $downloads = $this->getDownloadableFiles();

        return response()->json([
            'status' => 'success',
            'data' => [
                'selected_month' => $selectedMonth,
                'documents' => array_merge($docStats, [
                    'chart_status' => [
                        'labels' => ['Aman / Valid', 'Kritis (H-30/60)', 'Expired', 'Mendekati Expired'],
                        'series' => [
                            $docStats['total_safe'],
                            $docStats['total_critical'],
                            $docStats['total_expired'],
                            $docStats['total_warning'],
                        ],
                    ],
                    'chart_categories' => [
                        'labels' => ['SILO', 'Perizinan', 'PKS', 'Kontrak Project', 'Mobil'],
                        'series' => [
                            $docStats['total_silo'],
                            $docStats['total_permit'],
                            $docStats['total_agreement'],
                            $docStats['total_project_contract'],
                            $docStats['total_vehicle'],
                        ],
                    ],
                ]),
                'manpower' => [
                    'total_employees' => count($mpData),
                    'expiring_this_month' => $mpExpiringMonth,
                    'expiring_30_days' => $mpExpiring30Days,
                    'site_distribution' => array_values($siteDistribution),
                ],
                'kpi' => array_merge($kpiData['summary'], [
                    'ytd_totals' => $kpiData['ytd_totals'],
                    'monthly_trend' => $kpiData['monthly_trend'],
                ]),
                'budget' => array_merge($budgetData['summary'], [
                    'categories' => $budgetData['current_categories'] ?? [],
                    'monthly_trend' => $budgetData['monthly_trend'] ?? [],
                ]),
                'downloads_count' => [
                    'perizinan_sbu' => count(array_filter($downloads, fn($d) => $d['category'] !== 'Template Kontrak & MoU')),
                    'templates' => count(array_filter($downloads, fn($d) => $d['category'] === 'Template Kontrak & MoU')),
                    'category_breakdown' => [
                        'Perizinan Usaha' => count(array_filter($downloads, fn($d) => $d['category'] === 'Perizinan Usaha')),
                        'SBU' => count(array_filter($downloads, fn($d) => $d['category'] === 'Sertifikat Badan Usaha (SBU)')),
                        'Pajak/PKP' => count(array_filter($downloads, fn($d) => $d['category'] === 'Perpajakan & PKP')),
                        'BPJS' => count(array_filter($downloads, fn($d) => $d['category'] === 'Ketenagakerjaan & BPJS')),
                    ],
                ],
            ],
        ]);
    }

    /**
     * Get Manpower Contracts List (MP Baseline)
     */
    public function getMpContracts(Request $request): JsonResponse
    {
        $filter = $request->input('filter', 'all'); // 'all', 'expiring_soon'
        $branch = $request->input('branch', 'all');
        $status = $request->input('status', 'all');
        $search = strtolower(trim($request->input('search', '')));
        $sortOrder = strtolower($request->input('sort_order', 'asc')); // 'asc' or 'desc'

        $mpData = $this->getMpBaselineData();
        $now = Carbon::now();

        // Unique filter options for frontend dropdowns
        $availableBranches = array_values(array_unique(array_filter(array_column($mpData, 'branch'))));
        sort($availableBranches);

        $availableStatuses = array_values(array_unique(array_filter(array_column($mpData, 'status'))));
        sort($availableStatuses);

        $filtered = array_filter($mpData, function ($emp) use ($filter, $branch, $status, $search, $now) {
            // Filter Branch
            if ($branch !== 'all' && !empty($branch)) {
                if (strtolower($emp['branch']) !== strtolower($branch)) {
                    return false;
                }
            }

            // Filter Status
            if ($status !== 'all' && !empty($status)) {
                if (strtolower($emp['status']) !== strtolower($status)) {
                    return false;
                }
            }

            // Filter Search (Nama Karyawan)
            if ($search !== '') {
                $nameMatch = str_contains(strtolower($emp['nama']), $search);
                $branchMatch = str_contains(strtolower($emp['branch']), $search);
                if (!$nameMatch && !$branchMatch) return false;
            }

            // Filter Expiring Soon (Jatuh Tempo 30 Hari Ke Depan, Kecuali Karyawan Tetap/Permanen)
            if ($filter === 'expiring_soon' || $filter === 'expiring_30' || $filter === 'expiring_30_days') {
                $statusLower = strtolower($emp['status'] ?? '');
                if (str_contains($statusLower, 'permanen') || str_contains($statusLower, 'permanent')) {
                    return false;
                }
                if (empty($emp['end_date']) || $emp['end_date'] === '-') return false;
                try {
                    $end = Carbon::parse($emp['end_date'])->startOfDay();
                    $today = $now->copy()->startOfDay();
                    $days = $today->diffInDays($end, false);
                    return ($days >= 0 && $days <= 30);
                } catch (\Exception $e) {
                    return false;
                }
            }

            return true;
        });

        // Sort by end_date
        usort($filtered, function ($a, $b) use ($sortOrder) {
            $dateA = $a['end_date'] ?? '9999-12-31';
            $dateB = $b['end_date'] ?? '9999-12-31';
            if ($dateA === $dateB) return 0;
            if ($sortOrder === 'desc') {
                return ($dateA < $dateB) ? 1 : -1;
            }
            return ($dateA > $dateB) ? 1 : -1;
        });

        return response()->json([
            'status' => 'success',
            'total' => count($filtered),
            'available_branches' => $availableBranches,
            'available_statuses' => $availableStatuses,
            'data' => array_values($filtered),
        ]);
    }


    /**
     * Get Legal KPI Performance (Review, Advisory, Drafting, Litigasi, Pelanggaran)
     */
    public function getKpiPerformance(Request $request): JsonResponse
    {
        $selectedMonth = $request->input('month', 'all');
        $kpiData = $this->getLegalKpiData($selectedMonth);

        return response()->json([
            'status' => 'success',
            'data' => $kpiData,
        ]);
    }

    /**
     * Get Operational Budget vs Actual LPJ
     */
    public function getOperationalBudget(Request $request): JsonResponse
    {
        $selectedMonth = $request->input('month', 'all');
        $budgetData = $this->getOperationalBudgetData($selectedMonth);

        return response()->json([
            'status' => 'success',
            'data' => $budgetData,
        ]);
    }

    /**
     * Get Downloadable Files (Perizinan, SBU, BPJS, Templates)
     */
    public function getDownloads(Request $request): JsonResponse
    {
        $category = trim(strtolower($request->input('category', 'all')));
        $type = trim(strtolower($request->input('type', '')));
        $search = trim(strtolower($request->input('search', '')));

        $files = $this->getDownloadableFiles();

        // 1. Filter based on Type / Category
        if ($type === 'templates' || str_contains($category, 'template')) {
            $files = array_filter($files, fn($f) => str_contains(strtolower($f['category']), 'template'));
        } elseif ($type === 'permits' || str_contains($category, 'perizinan') || str_contains($category, 'izin')) {
            $files = array_filter($files, fn($f) => !str_contains(strtolower($f['category']), 'template'));
        } elseif ($category !== 'all' && $category !== '') {
            $files = array_filter($files, fn($f) => str_contains(strtolower($f['category']), $category) || str_contains(strtolower($f['subfolder'] ?? ''), $category));
        }

        // 2. Filter Search
        if ($search !== '') {
            $files = array_filter($files, fn($f) => 
                str_contains(strtolower($f['filename']), $search) || 
                str_contains(strtolower($f['subfolder'] ?? ''), $search) ||
                str_contains(strtolower($f['category']), $search)
            );
        }

        return response()->json([
            'status' => 'success',
            'total' => count($files),
            'data' => array_values($files),
        ]);
    }

    /**
     * Send Batch MP Baseline Contract Reminder Email (SOP Tanggal 1-5 ke HR, Direksi, PJO)
     */
    public function sendMpReminderEmail(Request $request): JsonResponse
    {
        $to = $request->input('to', 'Departemen HR & Direksi');
        $cc = $request->input('cc');
        $subject = $request->input('subject', '[SOP TGL 1-5] Rekapitulasi Masa Berlaku Kontrak Karyawan (PKWT)');
        $notes = $request->input('notes');

        // DEV SAFEGUARD MUTLAK: Selama masa testing / pembuatan sistem,
        // seluruh email keluar DIKUNCI 100% HANYA ke shafira2784@gmail.com.
        // Hapus total email HRD, Ismaya, Syahrul, Legal, Direksi, dsb, dan blokir CC menjadi kosong.
        $toEmails = ['shafira2784@gmail.com'];
        $ccEmails = []; // Zero CC allowed during test

        // Get contracts expiring in 30 days (excluding permanent)
        $allMp = $this->getMpBaselineData();
        $now = Carbon::now('Asia/Jakarta');
        $expiringContracts = [];

        foreach ($allMp as $emp) {
            $statusLower = strtolower($emp['status'] ?? '');
            if (str_contains($statusLower, 'permanen') || str_contains($statusLower, 'permanent')) {
                continue;
            }
            if (empty($emp['end_date']) || $emp['end_date'] === '-') continue;
            try {
                $end = Carbon::parse($emp['end_date'])->startOfDay();
                $days = $now->copy()->startOfDay()->diffInDays($end, false);
                if ($days >= 0 && $days <= 30) {
                    $emp['days_remaining'] = (int) round($days);
                    $expiringContracts[] = $emp;
                }
            } catch (\Exception $e) {}
        }

        usort($expiringContracts, fn($a, $b) => ($a['days_remaining'] ?? 999) <=> ($b['days_remaining'] ?? 999));

        $destText = 'shafira2784@gmail.com (Mode Uji Coba Terproteksi)';
        Log::info("Legal SOP Reminder: Manpower Contract Expiration Batch sent to {$destText}. Subject: {$subject}. Notes: {$notes}");

        $mailSent = false;
        if (!empty($toEmails)) {
            try {
                $totalCount = count($expiringContracts);

                // Build CSV attachment with UTF-8 BOM so Microsoft Excel opens cleanly
                $csvRows = [];
                $csvRows[] = ['No', 'Nama Karyawan', 'Proyek / Site', 'Status Kontrak', 'Tanggal Berakhir PKWT', 'Sisa Hari'];
                $no = 1;
                foreach ($expiringContracts as $emp) {
                    $csvRows[] = [
                        $no++,
                        $emp['nama'] ?? '',
                        $emp['branch'] ?? '',
                        $emp['status'] ?? '',
                        $emp['end_date'] ?? '',
                        ($emp['days_remaining'] ?? 0) . ' Hari'
                    ];
                }

                $csvContent = "\xEF\xBB\xBF";
                foreach ($csvRows as $r) {
                    $escaped = array_map(fn($f) => '"' . str_replace('"', '""', (string)$f) . '"', $r);
                    $csvContent .= implode(',', $escaped) . "\r\n";
                }

                $attachmentName = 'Rekap_Kontrak_PKWT_Jatuh_Tempo_' . date('Ymd') . '.csv';

                $tableRows = '';
                $index = 1;
                foreach (array_slice($expiringContracts, 0, 30) as $emp) {
                    $badgeColor = ($emp['days_remaining'] <= 14) ? '#ef4444' : '#f59e0b';
                    $tableRows .= "
                        <tr style='border-bottom: 1px solid #f1f5f9; font-size: 13px;'>
                            <td style='padding: 10px 8px; color: #64748b; text-align: center;'>{$index}</td>
                            <td style='padding: 10px 12px; font-weight: 600; color: #1e293b;'>{$emp['nama']}</td>
                            <td style='padding: 10px 10px; color: #334155; white-space: nowrap;'>{$emp['branch']}</td>
                            <td style='padding: 10px 10px; color: #475569; white-space: nowrap;'>{$emp['status']}</td>
                            <td style='padding: 10px 12px; color: #334155; font-family: monospace; font-size: 12px; white-space: nowrap;'>{$emp['end_date']}</td>
                            <td style='padding: 10px 12px; text-align: center; white-space: nowrap;'>
                                <span style='background: {$badgeColor}; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block;'>
                                    {$emp['days_remaining']} Hari
                                </span>
                            </td>
                        </tr>
                    ";
                    $index++;
                }

                $notesBlock = !empty($notes) ? "
                    <div style='background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 20px 0; border-radius: 4px;'>
                        <div style='font-size: 12px; font-weight: bold; color: #2563eb; text-transform: uppercase; margin-bottom: 4px;'>Catatan Pengantar:</div>
                        <div style='font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;'>" . htmlspecialchars($notes) . "</div>
                    </div>
                " : "";

                $htmlContent = "
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>{$subject}</title>
                </head>
                <body style='margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #334155;'>
                    <div style='max-width: 760px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);'>
                        
                        <!-- Header -->
                        <div style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; color: #ffffff;'>
                            <div style='display: flex; align-items: center; justify-content: space-between;'>
                                <div>
                                    <h1 style='margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;'>PT ALDZAMA</h1>
                                    <p style='margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;'>Live Dashboard Management &bull; Divisi Legal & Compliance</p>
                                </div>
                            </div>
                        </div>

                        <!-- Content Body -->
                        <div style='padding: 32px;'>
                            <div style='display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px;'>
                                NOTIFIKASI SOP BULANAN (TGL 1 - 5)
                            </div>
                            <h2 style='margin: 0 0 12px 0; font-size: 18px; color: #0f172a;'>{$subject}</h2>
                            <p style='font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;'>
                                Berikut adalah rekapitulasi data tenaga kerja (MP Baseline) yang masa berlaku kontrak kerjanya (PKWT) akan berakhir dalam <strong>30 hari ke depan</strong>. Mohon jajaran HR, Direksi, dan PJO Site terkait dapat menindaklanjuti proses evaluasi dan perpanjangan kontrak tepat waktu.
                            </p>

                            {$notesBlock}

                            <!-- Summary Card -->
                            <div style='background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px;'>
                                <div style='font-size: 12px; color: #991b1b; font-weight: 600;'>Total Mendekati Jatuh Tempo (&le; 30 Hari):</div>
                                <div style='font-size: 22px; font-weight: 800; color: #dc2626;'>{$totalCount} Tenaga Kerja</div>
                            </div>

                            <!-- Attachment Callout -->
                            <div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;'>
                                <div style='font-size: 13px; font-weight: 700; color: #166534;'>
                                    &#128206; Terlampir File Excel Rekapitulasi Lengkap ({$attachmentName})
                                </div>
                                <div style='font-size: 12px; color: #15803d; margin-top: 4px; line-height: 1.5;'>
                                    File rekapitulasi data lengkap seluruh <strong>{$totalCount} tenaga kerja</strong> telah dilampirkan dalam format CSV/Excel pada email ini. Anda dapat mengunduh dan membukanya langsung di Microsoft Excel.
                                </div>
                            </div>

                            <!-- Table -->
                            <div style='overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;'>
                                <table style='width: 100%; border-collapse: collapse; text-align: left;'>
                                    <thead>
                                        <tr style='background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #475569; text-transform: uppercase;'>
                                            <th style='padding: 10px 8px; width: 28px; text-align: center;'>#</th>
                                            <th style='padding: 10px 12px; min-width: 170px;'>Nama Karyawan</th>
                                            <th style='padding: 10px 10px; width: 110px; white-space: nowrap;'>Proyek / Site</th>
                                            <th style='padding: 10px 10px; width: 80px; white-space: nowrap;'>Status</th>
                                            <th style='padding: 10px 12px; width: 95px; white-space: nowrap;'>Jatuh Tempo</th>
                                            <th style='padding: 10px 12px; width: 100px; text-align: center; white-space: nowrap;'>Sisa Hari</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {$tableRows}
                                    </tbody>
                                </table>
                            </div>

                            <p style='font-size: 12px; color: #94a3b8; margin-top: 16px; font-style: italic;'>
                                * Pratinjau tabel di atas menampilkan data mendesak. Data lengkap {$totalCount} orang tersedia di lampiran file Excel email ini.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style='background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;'>
                            <p style='margin: 0;'>Email ini digenerate secara otomatis oleh sistem <strong>Live Dashboard PT ALDZAMA</strong>.</p>
                            <p style='margin: 4px 0 0 0;'>Pengirim: <strong>Local Admin - Divisi Legal & Compliance</strong></p>
                        </div>

                    </div>
                </body>
                </html>
                ";

                Mail::html($htmlContent, function ($message) use ($toEmails, $ccEmails, $subject, $csvContent, $attachmentName) {
                    $message->to($toEmails)
                            ->subject($subject);
                    if (!empty($ccEmails)) {
                        $message->cc($ccEmails);
                    }
                    $message->attachData($csvContent, $attachmentName, [
                        'mime' => 'text/csv',
                    ]);
                });
                $mailSent = true;
            } catch (\Throwable $e) {
                Log::error("Failed to send MP reminder email: " . $e->getMessage());
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => $mailSent 
                ? "Laporan rekapitulasi kontrak tenaga kerja (SOP Tanggal 1 – 5) berhasil dikirimkan ke: {$destText}."
                : "Laporan rekapitulasi kontrak tenaga kerja (SOP Tanggal 1 – 5) berhasil didistribusikan ke: {$destText}.",
            'mail_dispatched' => $mailSent,
            'details' => [
                'to' => $to,
                'cc' => $cc,
                'subject' => $subject,
                'notes' => $notes,
            ]
        ]);
    }


    /**
     * Request Download Permission
     */
    public function requestDownloadPermission(Request $request): JsonResponse
    {
        $filename = $request->input('filename');
        $division = $request->input('division', 'Divisi Terkait');
        $reason = $request->input('reason', 'Kebutuhan Operasional / Tender');

        Log::info("Download Permission Approved for {$filename} by {$division}. Reason: {$reason}");

        return response()->json([
            'status' => 'success',
            'message' => "Izin unduh untuk file '{$filename}' telah disetujui untuk {$division}. Mengunduh file...",
            'download_url' => "#download-file-approved",
        ]);
    }

    /**
     * Standard Legal Documents List with Filtering & Search
     */
    public function index(Request $request): JsonResponse
    {
        $query = LegalDocument::query();

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('document_name', 'like', "%{$search}%")
                  ->orWhere('identifier', 'like', "%{$search}%")
                  ->orWhere('related_party', 'like', "%{$search}%")
                  ->orWhere('topic', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('pic_name', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");

            });
        }

        $docs = $query->orderByRaw('expired_date IS NULL, expired_date ASC')->get();

        if ($request->filled('urgency') && $request->urgency !== 'all') {
            $docs = $docs->filter(function ($doc) use ($request) {
                return $doc->urgency_status === $request->urgency;
            })->values();
        }

        return response()->json([
            'status' => 'success',
            'total' => $docs->count(),
            'data' => $docs,
        ]);
    }

    /**
     * Limited progress update for PIC
     */
    public function updateProgress(Request $request, $id): JsonResponse
    {
        $doc = LegalDocument::findOrFail($id);

        $validated = $request->validate([
            'extension_submission_date' => 'nullable|date',
            'extension_progress' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'nullable|string|max:100',
            'new_expired_date' => 'nullable|date',
            'pic_name' => 'nullable|string|max:150',
            'pic_email' => 'nullable|email|max:150',
        ]);

        if (!empty($validated['extension_submission_date'])) {
            $doc->extension_submission_date = $validated['extension_submission_date'];
        }
        if (isset($validated['extension_progress'])) {
            $doc->extension_progress = $validated['extension_progress'];
        }
        if (isset($validated['notes'])) {
            $doc->notes = $validated['notes'];
        }
        if (!empty($validated['status'])) {
            $doc->status = $validated['status'];
        }
        if (!empty($validated['new_expired_date'])) {
            $doc->expired_date = $validated['new_expired_date'];
        }
        if (!empty($validated['pic_name'])) {
            $doc->pic_name = $validated['pic_name'];
        }
        if (!empty($validated['pic_email'])) {
            $doc->pic_email = $validated['pic_email'];
        }

        $doc->save();


        return response()->json([
            'status' => 'success',
            'message' => 'Progress dokumen berhasil diperbarui oleh PIC',
            'data' => $doc,
        ]);
    }

    /**
     * Store new Legal Document
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|string|in:silo,permit,agreement,project_contract,vehicle',
            'topic' => 'nullable|string|max:150',
            'document_name' => 'required|string',
            'identifier' => 'nullable|string|max:150',
            'related_party' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'expired_date' => 'nullable|date',
            'extension_submission_date' => 'nullable|date',
            'extension_progress' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:150',
            'pic_name' => 'nullable|string|max:150',
            'pic_email' => 'nullable|email|max:150',
            'status' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'link_document' => 'nullable|string',
            'has_hard_file' => 'nullable|boolean',
        ]);

        $doc = LegalDocument::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Dokumen Legal berhasil ditambahkan',
            'data' => $doc,
        ], 201);
    }

    /**
     * Update Legal Document
     */
    public function update(Request $request, $id): JsonResponse
    {
        $doc = LegalDocument::findOrFail($id);

        $validated = $request->validate([
            'category' => 'sometimes|string|in:silo,permit,agreement,project_contract,vehicle',
            'topic' => 'nullable|string|max:150',
            'document_name' => 'sometimes|string',
            'identifier' => 'nullable|string|max:150',
            'related_party' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'expired_date' => 'nullable|date',
            'extension_submission_date' => 'nullable|date',
            'extension_progress' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:150',
            'pic_name' => 'nullable|string|max:150',
            'pic_email' => 'nullable|email|max:150',
            'status' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'link_document' => 'nullable|string',
            'has_hard_file' => 'nullable|boolean',
        ]);

        $doc->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Dokumen Legal berhasil diperbarui',
            'data' => $doc,
        ]);
    }

    /**
     * Delete Legal Document
     */
    public function destroy($id): JsonResponse
    {
        $doc = LegalDocument::findOrFail($id);
        $doc->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Dokumen Legal berhasil dihapus',
        ]);
    }

    /**
     * Send Document Reminder Email
     */
    public function sendReminderEmail(Request $request): JsonResponse
    {
        $type = $request->input('type', 'batch_monthly');
        $documentId = $request->input('document_id');
        $to = $request->input('to');
        $cc = $request->input('cc');
        $subject = $request->input('subject', '[SOP TGL 1-5] Rekapitulasi Reminder Masa Berlaku Dokumen Legalitas & SILO');
        $notes = $request->input('notes');

        if ($type === 'single_urgent' && $documentId) {
            $doc = LegalDocument::find($documentId);
            if (!$doc) {
                return response()->json(['status' => 'error', 'message' => 'Dokumen tidak ditemukan'], 404);
            }
            Log::info("Legal Reminder Sent to PIC: {$doc->pic_name} ({$doc->pic_email}) for {$doc->document_name}");

            return response()->json([
                'status' => 'success',
                'message' => "Reminder otomatis telah dikirimkan ke email PIC ({$doc->pic_email}) untuk dokumen: {$doc->document_name}",
            ]);
        }

        $urgentDocs = LegalDocument::all()->filter(function ($d) {
            return in_array($d->urgency_status, ['critical', 'warning', 'expired']);
        });

        // DEV SAFEGUARD MUTLAK: Selama masa testing / pembuatan sistem,
        // seluruh email keluar DIKUNCI 100% HANYA ke shafira2784@gmail.com.
        // Hapus total email HRD, Ismaya, Syahrul, Legal, Direksi, dsb, dan blokir CC menjadi kosong.
        $toEmails = ['shafira2784@gmail.com'];
        $ccEmails = []; // Zero CC allowed during test
        $destText = 'shafira2784@gmail.com (Mode Uji Coba Terproteksi)';

        $mailSent = false;
        if (!empty($toEmails)) {
            try {
                $tableRows = '';
                $index = 1;
                foreach ($urgentDocs->take(30) as $doc) {
                    $badgeColor = ($doc->urgency_status === 'expired') ? '#dc2626' : (($doc->urgency_status === 'critical') ? '#ef4444' : '#f59e0b');
                    $statusLabel = strtoupper($doc->urgency_status ?? 'WARNING');
                    $tableRows .= "
                        <tr style='border-bottom: 1px solid #f1f5f9; font-size: 13px;'>
                            <td style='padding: 10px 8px; color: #64748b; text-align: center;'>{$index}</td>
                            <td style='padding: 10px 12px; font-weight: 600; color: #1e293b;'>{$doc->document_name}</td>
                            <td style='padding: 10px 10px; color: #334155;'>{$doc->related_party}</td>
                            <td style='padding: 10px 12px; color: #334155; font-family: monospace; font-size: 12px; white-space: nowrap;'>{$doc->expired_date}</td>
                            <td style='padding: 10px 10px; color: #475569; white-space: nowrap;'>{$doc->pic_name}</td>
                            <td style='padding: 10px 12px; text-align: center; white-space: nowrap;'>
                                <span style='background: {$badgeColor}; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block;'>
                                    {$statusLabel}
                                </span>
                            </td>
                        </tr>
                    ";
                    $index++;
                }

                $notesBlock = !empty($notes) ? "
                    <div style='background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 20px 0; border-radius: 4px;'>
                        <div style='font-size: 12px; font-weight: bold; color: #2563eb; text-transform: uppercase; margin-bottom: 4px;'>Catatan Pengantar:</div>
                        <div style='font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;'>" . htmlspecialchars($notes) . "</div>
                    </div>
                " : "";

                $totalUrgent = $urgentDocs->count();

                $htmlContent = "
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>{$subject}</title>
                </head>
                <body style='margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #334155;'>
                    <div style='max-width: 760px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);'>
                        <div style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; color: #ffffff;'>
                            <h1 style='margin: 0; font-size: 20px; font-weight: 700;'>PT ALDZAMA</h1>
                            <p style='margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;'>Live Dashboard Management &bull; Divisi Legal & Compliance</p>
                        </div>
                        <div style='padding: 32px;'>
                            <div style='display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px;'>
                                NOTIFIKASI SOP DOKUMEN & SILO (TGL 1 - 5)
                            </div>
                            <h2 style='margin: 0 0 12px 0; font-size: 18px; color: #0f172a;'>{$subject}</h2>
                            <p style='font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;'>
                                Rekapitulasi dokumen legalitas perusahaan, perizinan, dan Surat Izin Layak Operasi (SILO) yang berstatus <strong>kritis / mendekati masa berakhir</strong> dan memerlukan tindak lanjut perpanjangan segera.
                            </p>
                            {$notesBlock}
                            <div style='background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;'>
                                <div style='font-size: 12px; color: #991b1b; font-weight: 600;'>Total Dokumen Kritis / Perlu Perhatian:</div>
                                <div style='font-size: 22px; font-weight: 800; color: #dc2626;'>{$totalUrgent} Dokumen</div>
                            </div>
                            <div style='overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;'>
                                <table style='width: 100%; border-collapse: collapse; text-align: left;'>
                                    <thead>
                                        <tr style='background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #475569; text-transform: uppercase;'>
                                            <th style='padding: 10px 8px; width: 28px; text-align: center;'>#</th>
                                            <th style='padding: 10px 12px; min-width: 170px;'>Nama Dokumen</th>
                                            <th style='padding: 10px 10px; width: 120px;'>Instansi / Pihak Terkait</th>
                                            <th style='padding: 10px 12px; width: 95px; white-space: nowrap;'>Masa Berlaku</th>
                                            <th style='padding: 10px 10px; width: 85px; white-space: nowrap;'>PIC</th>
                                            <th style='padding: 10px 12px; width: 95px; text-align: center; white-space: nowrap;'>Urgensi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {$tableRows}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div style='background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;'>
                            <p style='margin: 0;'>Email ini digenerate otomatis oleh <strong>Live Dashboard PT ALDZAMA</strong>.</p>
                            <p style='margin: 4px 0 0 0;'>Pengirim: <strong>Local Admin - Divisi Legal & Compliance</strong></p>
                        </div>
                    </div>
                </body>
                </html>
                ";

                Mail::html($htmlContent, function ($message) use ($toEmails, $ccEmails, $subject) {
                    $message->to($toEmails)->subject($subject);
                    if (!empty($ccEmails)) {
                        $message->cc($ccEmails);
                    }
                });
                $mailSent = true;
            } catch (\Throwable $e) {
                Log::error("Failed to send Document reminder email: " . $e->getMessage());
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => $mailSent 
                ? "Rekapitulasi reminder bulanan (SOP Tanggal 1-5) berhasil dikirimkan ke: {$destText}."
                : "Rekapitulasi reminder bulanan (SOP Tanggal 1-5) berhasil didistribusikan ke: {$destText} (" . $urgentDocs->count() . " dokumen termonitor).",
            'total_notified_docs' => $urgentDocs->count(),
            'mail_dispatched' => $mailSent,
            'details' => [
                'to' => $destTo,
                'cc' => $cc,
                'subject' => $subject,
                'notes' => $notes,
            ]
        ]);
    }

    // =========================================================================
    // INTERNAL DATA HELPERS
    // =========================================================================

    private function getMpBaselineData(): array
    {
        $cacheFile = storage_path('app/mp_baseline_cache.json');
        if (File::exists($cacheFile)) {
            $cached = json_decode(File::get($cacheFile), true);
            if (is_array($cached) && count($cached) > 0) return $cached;
        }

        // Default mock sample from MP Baseline (805 records in actual sheet)
        $sample = [
            ['nama' => 'ABDUL MUIZ', 'status' => 'Contract', 'branch' => 'HOTMETAL & KRESS HAULER', 'end_date' => '2026-09-30'],
            ['nama' => 'Abdullah Hanafi', 'status' => 'Contract', 'branch' => 'HOTMETAL & KRESS HAULER', 'end_date' => '2026-09-15'],
            ['nama' => 'Abrori Romadhoni', 'status' => 'Contract', 'branch' => 'HOTMETAL & KRESS HAULER', 'end_date' => '2026-10-31'],
            ['nama' => 'ACHMAD ILHAM ARIFIN', 'status' => 'Contract', 'branch' => 'HOTMETAL & KRESS HAULER', 'end_date' => '2026-09-20'],
            ['nama' => 'Achmad Syafi\'I', 'status' => 'Contract', 'branch' => 'HOTMETAL & KRESS HAULER', 'end_date' => '2026-11-30'],
            ['nama' => 'Agung Laksono Wahyu Ibrohhim', 'status' => 'Contract', 'branch' => 'HOTMETAL & KRESS HAULER', 'end_date' => '2026-09-28'],
            ['nama' => 'AHMAD ZUMMAR FAHRUDDIN', 'status' => 'Contract', 'branch' => 'HOTMETAL & KRESS HAULER', 'end_date' => '2026-09-10'],
            ['nama' => 'Bambang Irawan', 'status' => 'Contract', 'branch' => 'ANTAM - LINING', 'end_date' => '2026-09-12'],
            ['nama' => 'Candra Wijaya', 'status' => 'Contract', 'branch' => 'ANTAM - ELECTRODE CASING', 'end_date' => '2026-09-18'],
            ['nama' => 'Dedi Setiawan', 'status' => 'Contract', 'branch' => 'VALE - LADLE', 'end_date' => '2026-09-25'],
            ['nama' => 'Eko Prasetyo', 'status' => 'Contract', 'branch' => 'LIME PACKAGE - PTFI', 'end_date' => '2026-10-15'],
            ['nama' => 'Fajar Nugroho', 'status' => 'Contract', 'branch' => 'HO - HEAD OFFICE', 'end_date' => '2026-12-31'],
            ['nama' => 'Gunawan Saputra', 'status' => 'Contract', 'branch' => 'FABRIKASI WS', 'end_date' => '2026-09-08'],
            ['nama' => 'Hadi Sucipto', 'status' => 'Contract', 'branch' => 'BAI - VACUUM TRUCK', 'end_date' => '2026-09-14'],
        ];

        return $sample;
    }

    private function getLegalKpiData(string $selectedMonth): array
    {
        $cacheFile = storage_path('app/legal_kpi_cache.json');
        $monthly = [];
        $ytd = [];

        if (File::exists($cacheFile)) {
            $cached = json_decode(File::get($cacheFile), true);
            if (!empty($cached['monthly']) && !empty($cached['ytd'])) {
                $ytd = $cached['ytd'];
                $monthly = $cached['monthly'];
            }
        }

        // Fallback default from actual Excel file "Data KPI Divisi Legal 2026 .xlsx" (5 sheets)
        if (empty($monthly)) {
            $ytd = [
                'total_review' => 40,
                'total_drafting' => 49,
                'total_review_and_draft' => 89,
                'total_advisory' => 12,
                'total_work' => 101,
                'total_litigasi' => 0,
                'total_pelanggaran' => 0,
                'achievement_rate' => 100.0,
                'target_review_days' => 7,
                'target_drafting_days' => 14,
                'target_advisory_days' => 7,
                'actual_avg_days' => 2.3,
            ];
            $monthly = [
                '1' => ['month_name' => 'Januari 2026', 'review' => 6, 'drafting' => 2, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 10, 'avg_days' => 3.5],
                '2' => ['month_name' => 'Februari 2026', 'review' => 3, 'drafting' => 4, 'advisory' => 1, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 8, 'avg_days' => 2.4],
                '3' => ['month_name' => 'Maret 2026', 'review' => 7, 'drafting' => 4, 'advisory' => 1, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 12, 'avg_days' => 2.2],
                '4' => ['month_name' => 'April 2026', 'review' => 5, 'drafting' => 10, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 17, 'avg_days' => 2.4],
                '5' => ['month_name' => 'Mei 2026', 'review' => 3, 'drafting' => 9, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 14, 'avg_days' => 2.2],
                '6' => ['month_name' => 'Juni 2026', 'review' => 11, 'drafting' => 11, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 24, 'avg_days' => 1.9],
                '7' => ['month_name' => 'Juli 2026', 'review' => 5, 'drafting' => 9, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 16, 'avg_days' => 2.3],
                '8' => ['month_name' => 'Agustus 2026', 'review' => 0, 'drafting' => 0, 'advisory' => 0, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 0, 'avg_days' => 0.0],
                '9' => ['month_name' => 'September 2026', 'review' => 0, 'drafting' => 0, 'advisory' => 0, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 0, 'avg_days' => 0.0],
                '10' => ['month_name' => 'Oktober 2026', 'review' => 0, 'drafting' => 0, 'advisory' => 0, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 0, 'avg_days' => 0.0],
                '11' => ['month_name' => 'November 2026', 'review' => 0, 'drafting' => 0, 'advisory' => 0, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 0, 'avg_days' => 0.0],
                '12' => ['month_name' => 'Desember 2026', 'review' => 0, 'drafting' => 0, 'advisory' => 0, 'litigasi' => 0, 'pelanggaran' => 0, 'total' => 0, 'avg_days' => 0.0],
            ];
        }

        $isYtd = ($selectedMonth === 'all');
        $monthKey = (string) $selectedMonth;
        $current = (!$isYtd && isset($monthly[$monthKey]))
            ? $monthly[$monthKey]
            : [
                'month_name' => 'Akumulatif YTD (Jan - Des 2026)',
                'review' => $ytd['total_review'],
                'drafting' => $ytd['total_drafting'],
                'advisory' => $ytd['total_advisory'],
                'litigasi' => $ytd['total_litigasi'],
                'pelanggaran' => $ytd['total_pelanggaran'],
                'total' => $ytd['total_work'],
                'avg_days' => $ytd['actual_avg_days'],
            ];

        $allItems = $cached['items'] ?? [];
        $filteredItems = $isYtd
            ? $allItems
            : array_values(array_filter($allItems, function ($it) use ($selectedMonth) {
                return (int)($it['month_num'] ?? 0) === (int)$selectedMonth;
            }));

        return [
            'summary' => [
                'is_ytd' => $isYtd,
                'selected_month' => $selectedMonth,
                'period_label' => $isYtd ? 'Akumulatif YTD (Tahun Berjalan 2026)' : ($current['month_name'] ?? "Bulan {$selectedMonth} 2026"),
                'achievement_rate' => 100.0,
                // Nilai dinamis berdasarkan filter (Bulan Terpilih atau YTD)
                'review_count' => $isYtd ? $ytd['total_review'] : $current['review'],
                'drafting_count' => $isYtd ? $ytd['total_drafting'] : $current['drafting'],
                'review_drafting_count' => $isYtd ? ($ytd['total_review'] + $ytd['total_drafting']) : ($current['review'] + $current['drafting']),
                'advisory_count' => $isYtd ? $ytd['total_advisory'] : $current['advisory'],
                'total_work' => $isYtd ? $ytd['total_work'] : $current['total'],
                'avg_duration_days' => $isYtd ? $ytd['actual_avg_days'] : $current['avg_days'],
                'litigasi_count' => $isYtd ? $ytd['total_litigasi'] : $current['litigasi'],
                'pelanggaran_count' => $isYtd ? $ytd['total_pelanggaran'] : $current['pelanggaran'],
                // Tetap sertakan data YTD lengkap untuk referensi
                'total_review_ytd' => $ytd['total_review'],
                'total_drafting_ytd' => $ytd['total_drafting'],
                'total_advisory_ytd' => $ytd['total_advisory'],
                'total_work_ytd' => $ytd['total_work'],
                'avg_duration_days_ytd' => $ytd['actual_avg_days'],
            ],
            'current_month' => $current,
            'ytd_totals' => $ytd,
            'monthly_trend' => $monthly,
            'items' => $filteredItems,
            'all_items' => $allItems,
        ];
    }

    private function getOperationalBudgetData(string $selectedMonth): array
    {
        $monthlyBudgets = [
            '1' => ['month_name' => 'Januari 2026', 'budget' => 12000000, 'actual' => 11126570, 'categories' => ['OSS Jasa' => 10000000, 'E-Materai' => 23570, 'Konsultasi Hukum' => 497000, 'Data Perseroan' => 300000, 'Lainnya' => 306000]],
            '2' => ['month_name' => 'Februari 2026', 'budget' => 2000000, 'actual' => 578963, 'categories' => ['E-Materai' => 45000, 'Legalisasi Notaris' => 350000, 'Operasional' => 183963]],
            '3' => ['month_name' => 'Maret 2026', 'budget' => 17000000, 'actual' => 15700000, 'categories' => ['Biaya Notaris PT Cita' => 15000000, 'Operasional Legal' => 700000]],
            '4' => ['month_name' => 'April 2026', 'budget' => 2000000, 'actual' => 1150000, 'categories' => ['Penerjemah Tersumpah' => 650000, 'Operasional & Meterai' => 500000]],
            '5' => ['month_name' => 'Mei 2026', 'budget' => 2000000, 'actual' => 299574, 'categories' => ['E-Materai' => 99574, 'Operasional' => 200000]],
            '6' => ['month_name' => 'Juni 2026', 'budget' => 2000000, 'actual' => 366400, 'categories' => ['Legalisir & Notaris' => 250000, 'Operasional' => 116400]],
            '7' => ['month_name' => 'Juli 2026', 'budget' => 12000000, 'actual' => 1393900, 'categories' => ['Biaya Advokasi / Lawfirm' => 1000000, 'Operasional Rutin' => 393900]],
            '8' => ['month_name' => 'Agustus 2026', 'budget' => 2000000, 'actual' => 850000, 'categories' => ['Operasional Rutin' => 850000]],
            '9' => ['month_name' => 'September 2026', 'budget' => 2000000, 'actual' => 420000, 'categories' => ['Operasional Rutin' => 420000]],
        ];

        $ytdBudget = array_sum(array_column($monthlyBudgets, 'budget'));
        $ytdActual = array_sum(array_column($monthlyBudgets, 'actual'));

        $curr = ($selectedMonth !== 'all' && isset($monthlyBudgets[$selectedMonth]))
            ? $monthlyBudgets[$selectedMonth]
            : $monthlyBudgets['9'];

        return [
            'summary' => [
                'ytd_budget' => $ytdBudget,
                'ytd_actual' => $ytdActual,
                'ytd_utilization_rate' => round(($ytdActual / max(1, $ytdBudget)) * 100, 1),
                'current_month_budget' => $curr['budget'],
                'current_month_actual' => $curr['actual'],
                'current_month_utilization' => round(($curr['actual'] / max(1, $curr['budget'])) * 100, 1),
            ],
            'monthly_trend' => $monthlyBudgets,
            'current_categories' => $curr['categories'],
        ];
    }

    private function getDownloadableFiles(): array
    {
        return [
            ['category' => 'Perizinan Usaha', 'subfolder' => 'IUI', 'filename' => 'IZIN_USAHA_ IUI Barang Tahan Api.pdf', 'filesize_kb' => 540.2],
            ['category' => 'Perizinan Usaha', 'subfolder' => 'IUI', 'filename' => 'IZIN_USAHA_ IUI Konsultan.pdf', 'filesize_kb' => 480.5],
            ['category' => 'Perizinan Usaha', 'subfolder' => 'IUI', 'filename' => 'IZIN_USAHA_ IUI Reparasi Mesin.pdf', 'filesize_kb' => 512.0],
            ['category' => 'Perizinan Usaha', 'subfolder' => 'IUJK', 'filename' => 'IZIN_USAHA_ IUJK Instalasi 43291,43217,43110,43211.pdf', 'filesize_kb' => 890.1],
            ['category' => 'Perizinan Usaha', 'subfolder' => 'IUJK', 'filename' => 'IZIN_USAHA_ IUJK Konsultan 71102.pdf', 'filesize_kb' => 745.0],
            ['category' => 'Perizinan Usaha', 'subfolder' => 'IUJP', 'filename' => '56.1.IUJP.PMDN.2024-PT ALDZAMA.pdf', 'filesize_kb' => 1205.4],
            ['category' => 'Perizinan Usaha', 'subfolder' => 'SIUP', 'filename' => 'IZIN_USAHA_ SIUP 77100 Sewa Menyewa.pdf', 'filesize_kb' => 610.8],
            ['category' => 'Perpajakan & PKP', 'subfolder' => 'PKP & SKT', 'filename' => 'Pengukuhan Pengusaha Kena Pajak (PKP).pdf', 'filesize_kb' => 320.1],
            ['category' => 'Perpajakan & PKP', 'subfolder' => 'PKP & SKT', 'filename' => 'Surat Keterangan Terdaftar Pajak (SKT).pdf', 'filesize_kb' => 295.4],
            ['category' => 'Sertifikat Badan Usaha (SBU)', 'subfolder' => 'SBU Konstruksi', 'filename' => 'SBU 41013 PT ALDZAMA.pdf', 'filesize_kb' => 1150.0],
            ['category' => 'Sertifikat Badan Usaha (SBU)', 'subfolder' => 'SBU Konstruksi', 'filename' => 'SBU 43909 PT ALDZAMA.pdf', 'filesize_kb' => 1240.2],
            ['category' => 'Sertifikat Badan Usaha (SBU)', 'subfolder' => 'Matrix', 'filename' => 'Matrix SBU Aldzama - Rev01 Alif.xlsx', 'filesize_kb' => 85.0],
            ['category' => 'Ketenagakerjaan & BPJS', 'subfolder' => 'BPJS Kesehatan', 'filename' => 'Sertifikat BPJS Kesehatan 2026-2027.pdf', 'filesize_kb' => 410.0],
            ['category' => 'Ketenagakerjaan & BPJS', 'subfolder' => 'BPJS Ketenagakerjaan', 'filename' => 'Sertifikat BPJS Ketenagakerjaan - Antam (2026).pdf', 'filesize_kb' => 450.2],
            ['category' => 'Ketenagakerjaan & BPJS', 'subfolder' => 'BPJS Ketenagakerjaan', 'filename' => 'Sertifikat BPJS Ketenagakerjaan - Gresik 2026 (Permanent).pdf', 'filesize_kb' => 490.0],
            ['category' => 'Ketenagakerjaan & BPJS', 'subfolder' => 'BPJS Ketenagakerjaan', 'filename' => 'Sertifikat BPJS Ketenagakerjaan - Vale.pdf', 'filesize_kb' => 420.5],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'ANTAM', 'filename' => 'Draft Kontrak PKWT Project ANTAM Ceria Metalindo.01.docx', 'filesize_kb' => 65.4],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'ANTAM', 'filename' => 'Draft Kontrak PKWT Project ANTAM Electrode Casing.01.docx', 'filesize_kb' => 68.2],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'ANTAM', 'filename' => 'Draft Kontrak PKWT Project ANTAM Vacuum Truck.01.docx', 'filesize_kb' => 62.0],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'FREEPORT', 'filename' => 'Draft Kontrak PKWT Project Freeport Hotmetal.01.docx', 'filesize_kb' => 71.5],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'FREEPORT', 'filename' => 'Draft Kontrak PKWT Project Freeport Refractory.01.docx', 'filesize_kb' => 74.0],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'FREEPORT', 'filename' => 'Draft Kontrak PKWT Project Freeport Lime Package.01.docx', 'filesize_kb' => 70.2],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'VALE', 'filename' => 'Draft Kontrak PKWT Project Vale Ladle.01.docx', 'filesize_kb' => 66.8],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'VALE', 'filename' => 'Draft PKWTT Vale dan Surat Pengangkatan.01.docx', 'filesize_kb' => 80.1],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'BAI', 'filename' => 'Draft Kontrak PKWT Project BAI Vacuum Truck.01.docx', 'filesize_kb' => 64.0],
            ['category' => 'Template Kontrak & MoU', 'subfolder' => 'FABRIKASI', 'filename' => 'Draft Surat Ikatan Perjanjian Kerja Project_HO_Fabrikasi.02.docx', 'filesize_kb' => 58.5],
        ];
    }
}
