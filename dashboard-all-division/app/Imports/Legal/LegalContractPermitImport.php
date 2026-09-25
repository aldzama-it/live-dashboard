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
use Maatwebsite\Excel\Events\BeforeImport;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class LegalContractPermitImport implements WithMultipleSheets, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                // Hapus data lama untuk permit, agreement, dan project_contract
                LegalDocument::whereIn('category', ['permit', 'agreement', 'project_contract'])->delete();
                Log::info("LegalContractPermitImport: Cleared existing permit, agreement, and project_contract records.");
            },
        ];
    }

    public static function parseExcelDate($val): ?string
    {
        if ($val === null || $val === '' || $val === '-' || $val === ' ' || $val === 'xx' || stripos((string)$val, 'permanent') !== false) {
            return null;
        }

        if (is_numeric($val)) {
            try {
                return ExcelDate::excelToDateTimeObject($val)->format('Y-m-d');
            } catch (\Throwable $e) {}
        }

        $val = trim((string)$val);
        if ($val === '' || $val === '-' || $val === 'xx' || stripos($val, 'permanent') !== false) return null;

        // Translate Indonesian month names
        $indoMonths = [
            'Januari' => 'January', 'Februari' => 'February', 'Maret' => 'March',
            'Mei' => 'May', 'Juni' => 'June', 'Juli' => 'July', 'Agustus' => 'August',
            'Desember' => 'December', 'Agt' => 'Aug', 'Agu' => 'Aug', 'Okt' => 'Oct',
            'Nop' => 'Nov', 'Des' => 'Dec'
        ];
        $cleanVal = str_ireplace(array_keys($indoMonths), array_values($indoMonths), $val);

        // Format "Maret 2025" -> 2025-03-01
        if (preg_match('/^([a-zA-Z]+)\s+(\d{4})$/', $cleanVal, $m)) {
            try {
                return Carbon::parse("1 {$m[1]} {$m[2]}")->format('Y-m-d');
            } catch (\Throwable $e) {}
        }

        try {
            return Carbon::parse($cleanVal)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function sheets(): array
    {
        return [
            // 1. SHEET PERMIT
            'Permit' => new class implements ToCollection, WithStartRow {
                public function startRow(): int
                {
                    return 8;
                }

                public function collection(Collection $rows)
                {
                    $count = 0;
                    foreach ($rows as $row) {
                        $topic = trim((string)($row[0] ?? ''));
                        $name = trim((string)($row[1] ?? ''));
                        if ($topic === '' && $name === '') continue;

                        $pihak = trim((string)($row[2] ?? ''));
                        $mulaiRaw = $row[3] ?? null;
                        $selesaiRaw = $row[4] ?? null;
                        $ket = trim((string)($row[5] ?? ''));
                        $hardVal = $row[7] ?? false;
                        $hardFile = filter_var($hardVal, FILTER_VALIDATE_BOOLEAN) || strcasecmp((string)$hardVal, 'true') === 0;
                        $link = trim((string)($row[8] ?? ''));
                        $notes = trim((string)($row[9] ?? ''));
                        $noReg = trim((string)($row[11] ?? ''));

                        $startDate = LegalContractPermitImport::parseExcelDate($mulaiRaw);
                        $expiredDate = LegalContractPermitImport::parseExcelDate($selesaiRaw);

                        LegalDocument::create([
                            'category' => 'permit',
                            'topic' => $topic ?: 'Perizinan Usaha',
                            'document_name' => $name ?: $topic,
                            'identifier' => $noReg ?: null,
                            'related_party' => $pihak ?: 'OSS',
                            'start_date' => $startDate,
                            'expired_date' => $expiredDate,
                            'location' => 'Head Office',
                            'pic_name' => 'Legal',
                            'pic_email' => 'legal@aldzama.com',
                            'status' => $ket ?: 'Aktif',
                            'notes' => $notes ?: ($ket ?: null),
                            'link_document' => $link ?: null,
                            'has_hard_file' => $hardFile,
                        ]);
                        $count++;
                    }
                    Log::info("LegalContractPermitImport: Successfully imported {$count} permit records.");
                }
            },

            // 2. SHEET AGREEMENT
            'Agreement' => new class implements ToCollection, WithStartRow {
                public function startRow(): int
                {
                    return 4;
                }

                public function collection(Collection $rows)
                {
                    $count = 0;
                    foreach ($rows as $row) {
                        $topic = trim((string)($row[0] ?? ''));
                        $name = trim((string)($row[1] ?? ''));
                        if ($topic === '' && $name === '') continue;

                        $pihak = trim((string)($row[2] ?? ''));
                        $mulaiRaw = $row[3] ?? null;
                        $selesaiRaw = $row[4] ?? null;
                        $ket = trim((string)($row[5] ?? ''));
                        $hardVal = $row[7] ?? false;
                        $hardFile = filter_var($hardVal, FILTER_VALIDATE_BOOLEAN) || strcasecmp((string)$hardVal, 'true') === 0;
                        $link = trim((string)($row[8] ?? ''));
                        $notes = trim((string)($row[9] ?? ''));

                        $startDate = LegalContractPermitImport::parseExcelDate($mulaiRaw);
                        $expiredDate = LegalContractPermitImport::parseExcelDate($selesaiRaw);

                        LegalDocument::create([
                            'category' => 'agreement',
                            'topic' => $topic ?: 'Perjanjian Kerjasama (PKS)',
                            'document_name' => $name ?: $topic,
                            'identifier' => null,
                            'related_party' => $pihak ?: 'Mitra / Vendor',
                            'start_date' => $startDate,
                            'expired_date' => $expiredDate,
                            'location' => 'Head Office',
                            'pic_name' => 'Legal',
                            'pic_email' => 'legal@aldzama.com',
                            'status' => $ket ?: 'Aktif',
                            'notes' => $notes ?: ($ket ?: null),
                            'link_document' => $link ?: null,
                            'has_hard_file' => $hardFile,
                        ]);
                        $count++;
                    }
                    Log::info("LegalContractPermitImport: Successfully imported {$count} agreement records.");
                }
            },

            // 3. SHEET KONTRAK PROJECT
            'Kontrak Project' => new class implements ToCollection, WithStartRow {
                public function startRow(): int
                {
                    return 4;
                }

                public function collection(Collection $rows)
                {
                    $count = 0;
                    foreach ($rows as $row) {
                        $topic = trim((string)($row[0] ?? ''));
                        $name = trim((string)($row[1] ?? ''));
                        $noReg = trim((string)($row[2] ?? ''));
                        if ($name === '' && $noReg === '') continue;
                        if (stripos($name, 'TAMBAH KOLOM') !== false) continue;

                        $pihak = trim((string)($row[3] ?? ''));
                        $mulaiRaw = $row[4] ?? null;
                        $selesaiRaw = $row[5] ?? null;
                        $ket = trim((string)($row[6] ?? ''));
                        $hardVal = $row[8] ?? false;
                        $hardFile = filter_var($hardVal, FILTER_VALIDATE_BOOLEAN) || strcasecmp((string)$hardVal, 'true') === 0;
                        $link = trim((string)($row[9] ?? ''));
                        $notes = trim((string)($row[10] ?? ''));

                        $startDate = LegalContractPermitImport::parseExcelDate($mulaiRaw);
                        $expiredDate = LegalContractPermitImport::parseExcelDate($selesaiRaw);

                        LegalDocument::create([
                            'category' => 'project_contract',
                            'topic' => $topic ?: 'Induk',
                            'document_name' => $name,
                            'identifier' => $noReg ?: null,
                            'related_party' => $pihak ?: 'Pemberi Kerja',
                            'start_date' => $startDate,
                            'expired_date' => $expiredDate,
                            'location' => $pihak ?: 'Site Project',
                            'pic_name' => 'Project PIC',
                            'pic_email' => 'project@aldzama.com',
                            'status' => $ket ?: 'Aktif',
                            'notes' => $notes ?: ($ket ?: null),
                            'link_document' => $link ?: null,
                            'has_hard_file' => $hardFile,
                        ]);
                        $count++;
                    }
                    Log::info("LegalContractPermitImport: Successfully imported {$count} project_contract records.");
                }
            },
        ];
    }
}
