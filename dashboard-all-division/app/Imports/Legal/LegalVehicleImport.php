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

class LegalVehicleImport implements WithMultipleSheets, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                // Clear existing vehicle records before fresh import
                LegalDocument::where('category', 'vehicle')->delete();
                Log::info("LegalVehicleImport: Cleared existing vehicle records.");
            },
        ];
    }

    public function sheets(): array
    {
        return [
            'Monitoring Kendaraan' => new class implements ToCollection, WithStartRow {
                public function startRow(): int
                {
                    return 2;
                }

                private function parseExcelDate($val): ?string
                {
                    if ($val === null || $val === '' || $val === '-' || $val === ' ') {
                        return null;
                    }

                    if (is_numeric($val)) {
                        try {
                            return ExcelDate::excelToDateTimeObject($val)->format('Y-m-d');
                        } catch (\Throwable $e) {}
                    }

                    $val = trim((string)$val);
                    if ($val === '' || $val === '-') return null;

                    // If it contains a range like "22 Mei 2023 - 22 April 2026", take the end date
                    if (strpos($val, '-') !== false && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) {
                        $parts = explode('-', $val);
                        $val = trim(end($parts));
                    }
                    if (strpos($val, "\n") !== false) {
                        $lines = explode("\n", $val);
                        $val = trim(end($lines));
                    }
                    if (strpos($val, ';') !== false) {
                        $lines = explode(';', $val);
                        $val = trim(end($lines));
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

                public function collection(Collection $rows)
                {
                    $importedCount = 0;

                    foreach ($rows as $index => $row) {
                        $nama = trim((string)($row[1] ?? ''));
                        $nopol = trim((string)($row[2] ?? ''));

                        // Stop / skip if both name and license plate are empty
                        if ($nama === '' && $nopol === '') {
                            continue;
                        }

                        $noVal = trim((string)($row[0] ?? ''));
                        $tahun = trim((string)($row[3] ?? ''));
                        $bpkb = trim((string)($row[4] ?? ''));
                        $hardFileVal = $row[5] ?? false;
                        $hardFile = filter_var($hardFileVal, FILTER_VALIDATE_BOOLEAN) || strcasecmp((string)$hardFileVal, 'true') === 0;

                        $leasing = trim((string)($row[6] ?? ''));
                        $asuransi = trim((string)($row[7] ?? ''));
                        $thirdParty = trim((string)($row[8] ?? ''));
                        $bantex = trim((string)($row[9] ?? ''));
                        $noka = trim((string)($row[10] ?? ''));
                        $nosin = trim((string)($row[11] ?? ''));
                        $noSeri = trim((string)($row[12] ?? ''));
                        $rawUsia = trim((string)($row[13] ?? ''));
                        if (is_numeric($rawUsia)) {
                            $usia = (string)(int)$rawUsia;
                        } elseif (is_numeric($tahun) && (int)$tahun > 1900) {
                            $usia = (string)(Carbon::now()->year - (int)$tahun);
                        } else {
                            $usia = '-';
                        }
                        $project = trim((string)($row[14] ?? ''));
                        $lokasi = trim((string)($row[15] ?? ''));

                        // Tanggal Pajak (Col 16 Q), Jatuh Tempo Pajak (Col 17 R)
                        $tglPajakVal = $row[16] ?? null;
                        $taxVal = $row[17] ?? null;
                        // Jatuh Tempo STNK / Ganti Plat (Col 19 T)
                        $stnkVal = $row[19] ?? null;
                        // Tanggal KIR (Col 22 W), Tanggal KIR Berikutnya (Col 23 X)
                        $kirVal = $row[22] ?? null;
                        $kirNextVal = $row[23] ?? null;

                        $taxDate = $this->parseExcelDate($taxVal);
                        $stnkDate = $this->parseExcelDate($stnkVal);
                        $kirDate = $this->parseExcelDate($kirVal) ?? $this->parseExcelDate($kirNextVal);
                        $leasingDate = $this->parseExcelDate($leasing);
                        $asuransiDate = $this->parseExcelDate($asuransi);

                        // Urutan prioritas untuk expired_date tercepat
                        $candidates = array_filter([$taxDate, $stnkDate, $kirDate, $leasingDate, $asuransiDate]);
                        sort($candidates);
                        $expiredDate = !empty($candidates) ? $candidates[0] : null;

                        $identifier = $nopol !== '' ? $nopol : ('NO-' . ($noVal ?: ($index + 1)));

                        $locationParts = array_filter([$project, $lokasi]);
                        $locationStr = !empty($locationParts) ? implode(' - ', $locationParts) : 'Head Office';

                        $startDate = (is_numeric($tahun) && strlen($tahun) === 4) ? "{$tahun}-01-01" : null;

                        $notesData = [
                            'tax_due_date' => $taxDate ?: '-',
                            'stnk_due_date' => $stnkDate ?: '-',
                            'kir_due_date' => $kirDate ?: '-',
                            'project' => $project ?: 'Head Office',
                            'location' => $lokasi ?: 'Gresik',
                            'bpkb' => $bpkb ?: 'PT. ALDZAMA',
                            'noka' => $noka ?: '-',
                            'nosin' => $nosin ?: '-',
                            'leasing' => $leasing ?: '-',
                            'asuransi' => $asuransi ?: '-',
                            'third_party_liability' => $thirdParty ?: '-',
                            'bantex' => $bantex ?: '-',
                            'no_seri' => $noSeri ?: '-',
                            'usia_kendaraan' => $usia ?: '-',
                        ];

                        LegalDocument::create([
                            'category' => 'vehicle',
                            'topic' => 'Izin Kendaraan & Peralatan',
                            'document_name' => $nama,
                            'identifier' => $identifier,
                            'related_party' => $bpkb ?: 'PT. ALDZAMA',
                            'start_date' => $startDate,
                            'expired_date' => $expiredDate,
                            'location' => $locationStr,
                            'pic_name' => $project ?: 'GA / Logistik',
                            'pic_email' => 'ga@aldzama.com',
                            'status' => 'Masih Berlaku',
                            'notes' => json_encode($notesData, JSON_UNESCAPED_UNICODE),
                            'has_hard_file' => $hardFile,
                        ]);

                        $importedCount++;
                    }

                    Log::info("LegalVehicleImport: Successfully imported {$importedCount} vehicles.");
                }
            },
        ];
    }
}
