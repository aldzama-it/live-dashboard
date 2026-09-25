<?php

namespace App\Imports\Legal;

use App\Models\LegalDocument;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;
use Maatwebsite\Excel\Events\BeforeImport;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class LegalSiloImport implements WithMultipleSheets, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                // Clear existing SILO records before fresh import
                LegalDocument::where('category', 'silo')->delete();
                Log::info("LegalSiloImport: Cleared existing SILO records.");
            },
        ];
    }

    public static function determineStatus(?string $rawStatus, ?string $expiredDate): string
    {
        $rawStatus = trim((string)$rawStatus);

        // Khusus SILO: jika tidak ada tanggal expired, status adalah Pending Update (bukan Permanen / Expired)
        if (!$expiredDate || strcasecmp($rawStatus, 'n/a') === 0 || strcasecmp($rawStatus, '#n/a') === 0) {
            return 'Pending Update';
        }

        if ($rawStatus !== '' && !str_starts_with($rawStatus, '=')) {
            return $rawStatus;
        }

        try {
            $today = Carbon::today();
            $exp = Carbon::parse($expiredDate)->startOfDay();
            $diff = $today->diffInDays($exp, false);

            if ($diff < 0) {
                return 'Expired';
            } elseif ($diff <= 60) {
                return 'Segera Update';
            } else {
                return 'Masih Berlaku';
            }
        } catch (\Throwable $e) {
            return 'Masih Berlaku';
        }
    }

    public static function parseExcelDate($val): ?string
    {
        if ($val === null || $val === '' || $val === '-' || $val === ' ' || $val === 'xx' || stripos((string)$val, 'permanent') !== false) {
            return null;
        }

        if (is_numeric($val)) {
            // Check if it's a negative or invalid excel serial date
            if ($val <= 0 || $val > 2958465) {
                return null;
            }
            try {
                return ExcelDate::excelToDateTimeObject($val)->format('Y-m-d');
            } catch (\Throwable $e) {}
        }

        $val = trim((string)$val);
        if ($val === '' || $val === '-' || $val === 'xx' || stripos($val, 'permanent') !== false) return null;

        // If it contains a range like "22 Mei 2023 - 22 April 2026", take the end date
        if (strpos($val, '-') !== false && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) {
            $parts = explode('-', $val);
            $val = trim(end($parts));
        }

        // Translate Indonesian month names
        $indoMonths = [
            'Januari' => 'January', 'Februari' => 'February', 'Maret' => 'March',
            'Mei' => 'May', 'Juni' => 'June', 'Juli' => 'July', 'Agustus' => 'August',
            'Desember' => 'December', 'Agt' => 'Aug', 'Agu' => 'Aug', 'Okt' => 'Oct',
            'Nop' => 'Nov', 'Des' => 'Dec'
        ];
        $cleanVal = str_ireplace(array_keys($indoMonths), array_values($indoMonths), $val);

        try {
            return Carbon::parse($cleanVal)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function sheets(): array
    {
        return [
            // 1. SHEET ALAT BERAT
            'Alat Berat' => new class implements ToCollection, WithStartRow, WithCalculatedFormulas {
                public function startRow(): int
                {
                    return 6;
                }

                public function collection(Collection $rows)
                {
                    $count = 0;
                    foreach ($rows as $row) {
                        $idAsset = trim((string)($row[1] ?? ''));
                        $jenis = trim((string)($row[2] ?? ''));
                        $namaAsset = trim((string)($row[3] ?? ''));

                        // Lewati baris kosong
                        if ($idAsset === '' && $namaAsset === '') {
                            continue;
                        }

                        $serialNo = trim((string)($row[4] ?? ''));
                        $tahunProduksi = trim((string)($row[5] ?? ''));
                        $expiredRaw = $row[6] ?? null;
                        $statusRaw = trim((string)($row[8] ?? ''));
                        $tglPengajuanRaw = $row[9] ?? null;
                        $regJoss = trim((string)($row[11] ?? ''));
                        $progress = trim((string)($row[12] ?? ''));
                        $noPo = trim((string)($row[13] ?? ''));
                        $keterangan = trim((string)($row[14] ?? ''));
                        $hardVal = $row[17] ?? false;
                        $hardFile = filter_var($hardVal, FILTER_VALIDATE_BOOLEAN) || strcasecmp((string)$hardVal, 'true') === 0;

                        $expiredDate = LegalSiloImport::parseExcelDate($expiredRaw);
                        $submissionDate = LegalSiloImport::parseExcelDate($tglPengajuanRaw);
                        $status = LegalSiloImport::determineStatus($statusRaw, $expiredDate);

                        // Susun catatan komprehensif
                        $notesArr = [];
                        if ($keterangan !== '') {
                            $notesArr[] = $keterangan;
                        }
                        if ($regJoss !== '') {
                            $notesArr[] = "No. Registrasi JOSS: {$regJoss}";
                        }
                        if ($noPo !== '') {
                            $notesArr[] = "No. PO: {$noPo}";
                        }
                        if ($tahunProduksi !== '') {
                            $notesArr[] = "Tahun Produksi: {$tahunProduksi}";
                        }
                        $finalNotes = !empty($notesArr) ? implode(' | ', $notesArr) : null;

                        LegalDocument::create([
                            'category' => 'silo',
                            'topic' => $jenis ?: 'Alat Berat',
                            'document_name' => $namaAsset ?: 'Unit Alat Berat',
                            'identifier' => $idAsset,
                            'related_party' => $serialNo,
                            'start_date' => null,
                            'expired_date' => $expiredDate,
                            'extension_submission_date' => $submissionDate,
                            'extension_progress' => $progress ?: null,
                            'location' => 'Alat Berat',
                            'pic_name' => null,
                            'pic_email' => null,
                            'status' => $status,
                            'notes' => $finalNotes,
                            'link_document' => null,
                            'has_hard_file' => $hardFile,
                        ]);
                        $count++;
                    }
                    Log::info("LegalSiloImport: Imported {$count} records from 'Alat Berat' sheet.");
                }
            },

            // 2. SHEET EQUIPMENT
            'Equipment' => new class implements ToCollection, WithStartRow, WithCalculatedFormulas {
                public function startRow(): int
                {
                    return 6;
                }

                public function collection(Collection $rows)
                {
                    $count = 0;
                    foreach ($rows as $row) {
                        $idAsset = trim((string)($row[1] ?? ''));
                        $namaAsset = trim((string)($row[2] ?? ''));
                        $brand = trim((string)($row[3] ?? ''));
                        $details = trim((string)($row[4] ?? ''));

                        // Lewati baris kosong
                        if ($idAsset === '' && $namaAsset === '') {
                            continue;
                        }

                        $serialNo = trim((string)($row[5] ?? ''));
                        $expiredRaw = $row[6] ?? null;
                        $statusRaw = trim((string)($row[8] ?? ''));
                        $tglPengajuanRaw = $row[9] ?? null;
                        $regJoss = trim((string)($row[11] ?? ''));
                        $progress = trim((string)($row[12] ?? ''));
                        $noPo = trim((string)($row[13] ?? ''));
                        $keterangan = trim((string)($row[14] ?? ''));
                        $hardVal = $row[17] ?? false;
                        $hardFile = filter_var($hardVal, FILTER_VALIDATE_BOOLEAN) || strcasecmp((string)$hardVal, 'true') === 0;

                        $expiredDate = LegalSiloImport::parseExcelDate($expiredRaw);
                        $submissionDate = LegalSiloImport::parseExcelDate($tglPengajuanRaw);
                        $status = LegalSiloImport::determineStatus($statusRaw, $expiredDate);

                        // Buat nama tampilan yang informatif
                        $displayName = $namaAsset;
                        if ($brand !== '' && !str_contains(strtolower($namaAsset), strtolower($brand))) {
                            $displayName .= " ({$brand})";
                        }

                        // Susun catatan komprehensif
                        $notesArr = [];
                        if ($keterangan !== '') {
                            $notesArr[] = $keterangan;
                        }
                        if ($details !== '') {
                            $notesArr[] = "Detail: {$details}";
                        }
                        if ($regJoss !== '') {
                            $notesArr[] = "No. Pendaftaran JOSS: {$regJoss}";
                        }
                        if ($noPo !== '') {
                            $notesArr[] = "No. PO: {$noPo}";
                        }
                        $finalNotes = !empty($notesArr) ? implode(' | ', $notesArr) : null;

                        LegalDocument::create([
                            'category' => 'silo',
                            'topic' => 'Equipment',
                            'document_name' => $displayName ?: 'Unit Equipment',
                            'identifier' => $idAsset,
                            'related_party' => $serialNo,
                            'start_date' => null,
                            'expired_date' => $expiredDate,
                            'extension_submission_date' => $submissionDate,
                            'extension_progress' => $progress ?: null,
                            'location' => 'Equipment',
                            'pic_name' => null,
                            'pic_email' => null,
                            'status' => $status,
                            'notes' => $finalNotes,
                            'link_document' => null,
                            'has_hard_file' => $hardFile,
                        ]);
                        $count++;
                    }
                    Log::info("LegalSiloImport: Imported {$count} records from 'Equipment' sheet.");
                }
            },
        ];
    }
}
