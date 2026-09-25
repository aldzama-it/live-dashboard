<?php

namespace App\Imports\Legal;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class LegalKpiImport implements WithEvents
{
    protected ?string $customFilePath = null;

    public function __construct(?string $customFilePath = null)
    {
        $this->customFilePath = $customFilePath;
    }

    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                /** @var Spreadsheet $spreadsheet */
                $spreadsheet = $event->reader->getDelegate();
                $this->processSpreadsheet($spreadsheet);
            },
        ];
    }

    /**
     * Process the loaded spreadsheet and update storage/app/legal_kpi_cache.json
     */
    public function processSpreadsheet(Spreadsheet $spreadsheet): array
    {
        $monthNames = [
            1 => 'Januari 2026', 2 => 'Februari 2026', 3 => 'Maret 2026', 4 => 'April 2026',
            5 => 'Mei 2026', 6 => 'Juni 2026', 7 => 'Juli 2026', 8 => 'Agustus 2026',
            9 => 'September 2026', 10 => 'Oktober 2026', 11 => 'November 2026', 12 => 'Desember 2026'
        ];

        $monthMap = [
            'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4, 'mei' => 5, 'may' => 5,
            'jun' => 6, 'jul' => 7, 'agu' => 8, 'aug' => 8, 'sep' => 9, 'okt' => 10,
            'oct' => 10, 'nov' => 11, 'des' => 12, 'dec' => 12
        ];

        $resolveMonthNum = function ($str) use ($monthMap) {
            if (empty($str)) return null;
            if (is_numeric($str) && (float)$str > 30000 && (float)$str < 60000) {
                return (int) ExcelDate::excelToDateTimeObject($str)->format('n');
            }
            $s = strtolower(trim((string)$str));
            foreach ($monthMap as $prefix => $num) {
                if (strpos($s, $prefix) !== false) return $num;
            }
            return null;
        };

        $parseDate = function ($val) {
            if (empty($val)) return null;
            if (is_numeric($val) && (float)$val > 30000 && (float)$val < 60000) {
                return ExcelDate::excelToDateTimeObject($val)->format('Y-m-d');
            }
            $clean = trim((string)$val);
            $ts = strtotime($clean);
            if ($ts !== false && $ts > 0) {
                return date('Y-m-d', $ts);
            }
            return $clean;
        };

        $items = [];
        $idCounter = 1;

        // 1. Sheet: Legal Review
        $shReview = $spreadsheet->getSheetByName('Legal Review');
        if ($shReview) {
            $curMonth = 1;
            $highestRow = $shReview->getHighestRow();
            for ($r = 4; $r <= $highestRow; $r++) {
                $mVal = $shReview->getCellByColumnAndRow(2, $r)->getValue();
                $mResolved = $resolveMonthNum($mVal);
                if ($mResolved) $curMonth = $mResolved;

                $proj = trim((string)$shReview->getCellByColumnAndRow(3, $r)->getValue());
                if (empty($proj) || stripos($proj, 'total') !== false || stripos($proj, 'rekap') !== false) continue;

                $topic = trim((string)$shReview->getCellByColumnAndRow(1, $r)->getValue()) ?: '-';
                $regNo = trim((string)$shReview->getCellByColumnAndRow(4, $r)->getValue()) ?: '-';
                $party = trim((string)$shReview->getCellByColumnAndRow(5, $r)->getValue()) ?: '-';
                $requester = trim((string)$shReview->getCellByColumnAndRow(6, $r)->getValue()) ?: '-';
                $dateIn = $parseDate($shReview->getCellByColumnAndRow(7, $r)->getValue());
                $dateOut = $parseDate($shReview->getCellByColumnAndRow(8, $r)->getValue());
                $dur = $shReview->getCellByColumnAndRow(9, $r)->getValue();
                $dur = is_numeric($dur) ? (float)$dur : ($dateIn && $dateOut ? max(1, (strtotime($dateOut) - strtotime($dateIn))/86400 + 1) : null);
                $slaTarget = trim((string)$shReview->getCellByColumnAndRow(10, $r)->getValue()) ?: '7 hari kerja';
                $notes = trim((string)$shReview->getCellByColumnAndRow(11, $r)->getValue()) ?: 'Done';
                $slaComp = ($dur !== null && $dur <= 7) ? 'Memenuhi SLA' : ($dur !== null ? 'Melebihi SLA' : 'Dalam Proses');
                $status = (!empty($dateOut) || stripos($notes, 'done') !== false) ? 'Done' : 'Proses';

                $items[] = [
                    'id' => $idCounter++,
                    'category' => 'review',
                    'category_label' => 'Legal Review',
                    'topic' => $topic,
                    'month_num' => $curMonth,
                    'month_name' => $monthNames[$curMonth] ?? "Bulan $curMonth 2026",
                    'project_name' => $proj,
                    'register_no' => $regNo,
                    'party' => $party,
                    'requester' => $requester,
                    'date_in' => $dateIn,
                    'date_out' => $dateOut,
                    'duration_days' => $dur,
                    'sla_target' => $slaTarget,
                    'sla_compliance' => $slaComp,
                    'status' => $status,
                    'notes' => $notes,
                ];
            }
        }

        // 2. Sheet: Legal Advisory
        $shAdv = $spreadsheet->getSheetByName('Legal Advisory');
        if ($shAdv) {
            $curMonth = 1;
            $highestRow = $shAdv->getHighestRow();
            for ($r = 4; $r <= $highestRow; $r++) {
                $mVal = $shAdv->getCellByColumnAndRow(2, $r)->getValue();
                $mResolved = $resolveMonthNum($mVal);
                if ($mResolved) $curMonth = $mResolved;

                $issue = trim((string)$shAdv->getCellByColumnAndRow(3, $r)->getValue());
                if (empty($issue) || stripos($issue, 'total') !== false || stripos($issue, 'rekap') !== false) continue;

                $topic = trim((string)$shAdv->getCellByColumnAndRow(1, $r)->getValue()) ?: '-';
                $requester = trim((string)$shAdv->getCellByColumnAndRow(4, $r)->getValue()) ?: '-';
                $dateIn = $parseDate($shAdv->getCellByColumnAndRow(5, $r)->getValue());
                $dateOut = $parseDate($shAdv->getCellByColumnAndRow(6, $r)->getValue());
                $dur = $shAdv->getCellByColumnAndRow(7, $r)->getValue();
                $dur = is_numeric($dur) ? (float)$dur : ($dateIn && $dateOut ? max(1, (strtotime($dateOut) - strtotime($dateIn))/86400 + 1) : null);
                $slaTarget = trim((string)$shAdv->getCellByColumnAndRow(8, $r)->getValue()) ?: '7 hari kerja';
                $notes = trim((string)$shAdv->getCellByColumnAndRow(9, $r)->getValue()) ?: 'Done';
                $slaComp = ($dur !== null && $dur <= 7) ? 'Memenuhi SLA' : ($dur !== null ? 'Melebihi SLA' : 'Dalam Proses');
                $status = (!empty($dateOut) || stripos($notes, 'done') !== false) ? 'Done' : 'Proses';

                $items[] = [
                    'id' => $idCounter++,
                    'category' => 'advisory',
                    'category_label' => 'Legal Advisory',
                    'topic' => $topic,
                    'month_num' => $curMonth,
                    'month_name' => $monthNames[$curMonth] ?? "Bulan $curMonth 2026",
                    'project_name' => $issue,
                    'register_no' => '-',
                    'party' => '-',
                    'requester' => $requester,
                    'date_in' => $dateIn,
                    'date_out' => $dateOut,
                    'duration_days' => $dur,
                    'sla_target' => $slaTarget,
                    'sla_compliance' => $slaComp,
                    'status' => $status,
                    'notes' => $notes,
                ];
            }
        }

        // 3. Sheet: Legal Drafting
        $shDraft = $spreadsheet->getSheetByName('Legal Drafting');
        if ($shDraft) {
            $curMonth = 1;
            $highestRow = $shDraft->getHighestRow();
            for ($r = 4; $r <= $highestRow; $r++) {
                $mVal = $shDraft->getCellByColumnAndRow(2, $r)->getValue();
                $mResolved = $resolveMonthNum($mVal);
                if ($mResolved) $curMonth = $mResolved;

                $docType = trim((string)$shDraft->getCellByColumnAndRow(3, $r)->getValue());
                if (empty($docType) || stripos($docType, 'total') !== false || stripos($docType, 'rekap') !== false) continue;

                $topic = trim((string)$shDraft->getCellByColumnAndRow(1, $r)->getValue()) ?: '-';
                $requester = trim((string)$shDraft->getCellByColumnAndRow(4, $r)->getValue()) ?: '-';
                $dateIn = $parseDate($shDraft->getCellByColumnAndRow(5, $r)->getValue());
                $dateOut = $parseDate($shDraft->getCellByColumnAndRow(6, $r)->getValue());
                $dur = $shDraft->getCellByColumnAndRow(7, $r)->getValue();
                $dur = is_numeric($dur) ? (float)$dur : ($dateIn && $dateOut ? max(1, (strtotime($dateOut) - strtotime($dateIn))/86400 + 1) : null);
                $slaTarget = trim((string)$shDraft->getCellByColumnAndRow(8, $r)->getValue()) ?: '14 hari kerja';
                $notes = trim((string)$shDraft->getCellByColumnAndRow(9, $r)->getValue()) ?: 'Done';
                $slaComp = ($dur !== null && $dur <= 14) ? 'Memenuhi SLA' : ($dur !== null ? 'Melebihi SLA' : 'Dalam Proses');
                $status = (!empty($dateOut) || stripos($notes, 'done') !== false) ? 'Done' : 'Proses';

                $items[] = [
                    'id' => $idCounter++,
                    'category' => 'drafting',
                    'category_label' => 'Legal Drafting',
                    'topic' => $topic,
                    'month_num' => $curMonth,
                    'month_name' => $monthNames[$curMonth] ?? "Bulan $curMonth 2026",
                    'project_name' => $docType,
                    'register_no' => '-',
                    'party' => $requester,
                    'requester' => $requester,
                    'date_in' => $dateIn,
                    'date_out' => $dateOut,
                    'duration_days' => $dur,
                    'sla_target' => $slaTarget,
                    'sla_compliance' => $slaComp,
                    'status' => $status,
                    'notes' => $notes,
                ];
            }
        }

        // 4. Sheet: Litigasi
        $shLit = $spreadsheet->getSheetByName('Litigasi');
        if ($shLit) {
            $curMonth = 1;
            $highestRow = $shLit->getHighestRow();
            for ($r = 4; $r <= $highestRow; $r++) {
                $mVal = $shLit->getCellByColumnAndRow(2, $r)->getValue();
                $mResolved = $resolveMonthNum($mVal);
                if ($mResolved) $curMonth = $mResolved;

                $suratMasuk = trim((string)$shLit->getCellByColumnAndRow(3, $r)->getValue());
                if (empty($suratMasuk) || stripos($suratMasuk, 'total') !== false || stripos($suratMasuk, 'rekap') !== false) continue;

                $topic = trim((string)$shLit->getCellByColumnAndRow(1, $r)->getValue()) ?: 'Litigasi';
                $aph = trim((string)$shLit->getCellByColumnAndRow(4, $r)->getValue()) ?: '-';
                $noReg = trim((string)$shLit->getCellByColumnAndRow(5, $r)->getValue()) ?: '-';
                $tglPelaksanaan = $parseDate($shLit->getCellByColumnAndRow(6, $r)->getValue());

                $items[] = [
                    'id' => $idCounter++,
                    'category' => 'litigasi',
                    'category_label' => 'Litigasi',
                    'topic' => $topic,
                    'month_num' => $curMonth,
                    'month_name' => $monthNames[$curMonth] ?? "Bulan $curMonth 2026",
                    'project_name' => $suratMasuk,
                    'register_no' => $noReg,
                    'party' => $aph,
                    'requester' => $aph,
                    'date_in' => $tglPelaksanaan,
                    'date_out' => null,
                    'duration_days' => null,
                    'sla_target' => '-',
                    'sla_compliance' => 'Penanganan Perkara',
                    'status' => 'Proses',
                    'notes' => "Dinas/APH: $aph" . ($tglPelaksanaan ? " | Tgl Pelaksanaan: $tglPelaksanaan" : ''),
                ];
            }
        }

        // 5. Sheet: Pelanggaran
        $shPel = $spreadsheet->getSheetByName('Pelanggaran');
        if ($shPel) {
            $curMonth = 1;
            $highestRow = $shPel->getHighestRow();
            for ($r = 4; $r <= $highestRow; $r++) {
                $mVal = $shPel->getCellByColumnAndRow(2, $r)->getValue();
                $mResolved = $resolveMonthNum($mVal);
                if ($mResolved) $curMonth = $mResolved;

                $suratMasuk = trim((string)$shPel->getCellByColumnAndRow(3, $r)->getValue());
                if (empty($suratMasuk) || stripos($suratMasuk, 'total') !== false || stripos($suratMasuk, 'rekap') !== false) continue;

                $topic = trim((string)$shPel->getCellByColumnAndRow(1, $r)->getValue()) ?: 'Pelanggaran';
                $aph = trim((string)$shPel->getCellByColumnAndRow(4, $r)->getValue()) ?: '-';
                $noReg = trim((string)$shPel->getCellByColumnAndRow(5, $r)->getValue()) ?: '-';
                $tglPelaksanaan = $parseDate($shPel->getCellByColumnAndRow(6, $r)->getValue());

                $items[] = [
                    'id' => $idCounter++,
                    'category' => 'pelanggaran',
                    'category_label' => 'Pelanggaran / Sengketa',
                    'topic' => $topic,
                    'month_num' => $curMonth,
                    'month_name' => $monthNames[$curMonth] ?? "Bulan $curMonth 2026",
                    'project_name' => $suratMasuk,
                    'register_no' => $noReg,
                    'party' => $aph,
                    'requester' => $aph,
                    'date_in' => $tglPelaksanaan,
                    'date_out' => null,
                    'duration_days' => null,
                    'sla_target' => '-',
                    'sla_compliance' => 'Penanganan Kasus',
                    'status' => 'Proses',
                    'notes' => "Dinas/APH: $aph" . ($tglPelaksanaan ? " | Tgl Pelaksanaan: $tglPelaksanaan" : ''),
                ];
            }
        }

        // Monthly aggregation
        $monthly = [];
        for ($m = 1; $m <= 12; $m++) {
            $mItems = array_filter($items, fn($it) => $it['month_num'] === $m);
            $revCount = count(array_filter($mItems, fn($it) => $it['category'] === 'review'));
            $draftCount = count(array_filter($mItems, fn($it) => $it['category'] === 'drafting'));
            $advCount = count(array_filter($mItems, fn($it) => $it['category'] === 'advisory'));
            $litCount = count(array_filter($mItems, fn($it) => $it['category'] === 'litigasi'));
            $pelCount = count(array_filter($mItems, fn($it) => $it['category'] === 'pelanggaran'));
            $tot = count($mItems);

            $durations = array_filter(array_column($mItems, 'duration_days'), fn($d) => $d !== null && $d > 0);
            $avgDays = count($durations) > 0 ? round(array_sum($durations) / count($durations), 1) : 0.0;

            $monthly[(string)$m] = [
                'month_name' => $monthNames[$m],
                'review' => $revCount,
                'drafting' => $draftCount,
                'advisory' => $advCount,
                'litigasi' => $litCount,
                'pelanggaran' => $pelCount,
                'total' => $tot,
                'avg_days' => $avgDays,
            ];
        }

        // YTD aggregation
        $totalReview = count(array_filter($items, fn($it) => $it['category'] === 'review'));
        $totalDrafting = count(array_filter($items, fn($it) => $it['category'] === 'drafting'));
        $totalAdvisory = count(array_filter($items, fn($it) => $it['category'] === 'advisory'));
        $totalLitigasi = count(array_filter($items, fn($it) => $it['category'] === 'litigasi'));
        $totalPelanggaran = count(array_filter($items, fn($it) => $it['category'] === 'pelanggaran'));
        $allDurations = array_filter(array_column($items, 'duration_days'), fn($d) => $d !== null && $d > 0);
        $actualAvgDays = count($allDurations) > 0 ? round(array_sum($allDurations) / count($allDurations), 1) : 2.4;

        $ytd = [
            'total_review' => $totalReview,
            'total_drafting' => $totalDrafting,
            'total_review_and_draft' => $totalReview + $totalDrafting,
            'total_advisory' => $totalAdvisory,
            'total_work' => count($items),
            'total_litigasi' => $totalLitigasi,
            'total_pelanggaran' => $totalPelanggaran,
            'achievement_rate' => 100.0,
            'target_review_days' => 7,
            'target_drafting_days' => 14,
            'target_advisory_days' => 7,
            'actual_avg_days' => $actualAvgDays,
        ];

        $payload = [
            'updated_at' => date('Y-m-d H:i:s'),
            'source_file' => 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\14. KPI, RISK REGISTER, RNR, WLA, DAN BUDGETING\\KPI\\Data KPI Divisi Legal 2026 .xlsx',
            'ytd' => $ytd,
            'monthly' => $monthly,
            'items' => $items,
        ];

        $cachePath = storage_path('app/legal_kpi_cache.json');
        File::put($cachePath, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        Log::info("LegalKpiImport successfully updated {$cachePath} with " . count($items) . " records.");

        return $payload;
    }
}
