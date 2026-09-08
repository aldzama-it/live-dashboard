<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalDocument;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

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

        // 2. MP Baseline (Kontrak Karyawan Expiring Stats)
        $mpData = $this->getMpBaselineData();
        $now = Carbon::now();
        $mpExpiringMonth = 0;
        $mpExpiring30Days = 0;

        foreach ($mpData as $emp) {
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
                'documents' => $docStats,
                'manpower' => [
                    'total_employees' => count($mpData),
                    'expiring_this_month' => $mpExpiringMonth,
                    'expiring_30_days' => $mpExpiring30Days,
                ],
                'kpi' => $kpiData['summary'],
                'budget' => $budgetData['summary'],
                'downloads_count' => [
                    'perizinan_sbu' => count(array_filter($downloads, fn($d) => $d['category'] !== 'Template Kontrak & MoU')),
                    'templates' => count(array_filter($downloads, fn($d) => $d['category'] === 'Template Kontrak & MoU')),
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

            // Filter Expiring Soon
            if ($filter === 'expiring_soon') {
                if (empty($emp['end_date'])) return false;
                try {
                    $end = Carbon::parse($emp['end_date']);
                    $days = $now->diffInDays($end, false);
                    return ($days >= -60 && $days <= 60);
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
        $category = $request->input('category', 'all');
        $search = strtolower($request->input('search', ''));

        $files = $this->getDownloadableFiles();

        if ($category !== 'all') {
            $files = array_filter($files, fn($f) => $f['category'] === $category);
        }

        if ($search) {
            $files = array_filter($files, fn($f) => 
                str_contains(strtolower($f['filename']), $search) || 
                str_contains(strtolower($f['subfolder']), $search)
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
        $targetAudience = $request->input('audience', 'Departemen HR, Jajaran Direksi, & PJO Site Terkait');
        Log::info("Legal SOP Reminder: Manpower Contract Expiration Batch sent to {$targetAudience}.");

        return response()->json([
            'status' => 'success',
            'message' => "Laporan rekapitulasi masa berlaku kontrak tenaga kerja (SOP Tanggal 1 – 5) berhasil didistribusikan kepada Departemen HR, Direksi, dan PJO / Site Manager terkait.",
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

        Log::info("Legal Monthly Batch Reminder Sent for " . $urgentDocs->count() . " documents to all PICs.");

        return response()->json([
            'status' => 'success',
            'message' => "Rekapitulasi reminder bulanan (SOP Tanggal 1-5) berhasil dikirimkan ke seluruh PIC (" . $urgentDocs->count() . " dokumen termonitor).",
            'total_notified_docs' => $urgentDocs->count(),
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
        $monthlyKPI = [
            '1' => ['review' => 4, 'drafting' => 3, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 3.5],
            '2' => ['review' => 3, 'drafting' => 4, 'advisory' => 1, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 2.8],
            '3' => ['review' => 5, 'drafting' => 2, 'advisory' => 3, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 3.1],
            '4' => ['review' => 2, 'drafting' => 3, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 4.0],
            '5' => ['review' => 4, 'drafting' => 5, 'advisory' => 1, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 3.2],
            '6' => ['review' => 3, 'drafting' => 2, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 2.9],
            '7' => ['review' => 4, 'drafting' => 3, 'advisory' => 3, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 3.4],
            '8' => ['review' => 3, 'drafting' => 4, 'advisory' => 2, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 3.0],
            '9' => ['review' => 2, 'drafting' => 2, 'advisory' => 1, 'litigasi' => 0, 'pelanggaran' => 0, 'avg_days' => 2.5],
        ];

        $ytd = [
            'total_review' => 30,
            'total_drafting' => 28,
            'total_advisory' => 17,
            'total_litigasi' => 0,
            'total_pelanggaran' => 0,
            'achievement_rate' => 100.0,
            'target_review_days' => 14,
            'actual_avg_days' => 3.1,
        ];

        $current = ($selectedMonth !== 'all' && isset($monthlyKPI[$selectedMonth])) 
            ? $monthlyKPI[$selectedMonth] 
            : $monthlyKPI['9'];

        return [
            'summary' => [
                'achievement_rate' => 100.0,
                'total_review_ytd' => $ytd['total_review'],
                'total_drafting_ytd' => $ytd['total_drafting'],
                'total_advisory_ytd' => $ytd['total_advisory'],
                'litigasi_count' => 0,
                'pelanggaran_count' => 0,
                'current_month_total' => $current['review'] + $current['drafting'] + $current['advisory'],
                'avg_duration_days' => $current['avg_days'],
            ],
            'monthly_trend' => $monthlyKPI,
            'ytd_totals' => $ytd,
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
