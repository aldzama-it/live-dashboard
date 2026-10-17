<?php

namespace App\Imports\Legal;

use App\Models\LegalRegulation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Events\BeforeImport;

class LegalRegulationImport implements WithMultipleSheets, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                // Clear existing records before fresh import
                LegalRegulation::truncate();
            },
        ];
    }

    public function sheets(): array
    {
        return [
            // Sheet1 only (index 0)
            0 => new class implements ToCollection, WithStartRow {
                public function startRow(): int
                {
                    return 6;
                }

                public function collection(Collection $rows)
                {
                    $counter = 1;

                    foreach ($rows as $index => $row) {
                        $regulationName = trim((string)($row[1] ?? ''));

                        // Stop if empty or if we hit the summary section
                        if (empty($regulationName) || 
                            stripos($regulationName, 'STATUS KEPATUHAN') !== false || 
                            stripos($regulationName, 'Terpenuhi') !== false ||
                            stripos($regulationName, 'Belum Terpenuhi') !== false ||
                            stripos($regulationName, 'Total Klausul') !== false ||
                            stripos($regulationName, 'Tingkat Kepatuhan') !== false) {
                            continue;
                        }

                        // Normalization
                        $validityStatus = trim((string)($row[2] ?? ''));
                        $relevance = trim((string)($row[3] ?? ''));
                        $followUp = trim((string)($row[4] ?? ''));
                        $nature = trim((string)($row[5] ?? ''));
                        if (strcasecmp($nature, 'Contidional') === 0) {
                            $nature = 'Conditional';
                        }

                        $relatedParty = trim((string)($row[6] ?? ''));
                        $rawStatus = trim((string)($row[7] ?? ''));

                        // Standardize compliance status: Comply or Non-Comply
                        if (stripos($rawStatus, 'Non') !== false || stripos($rawStatus, 'Belum') !== false) {
                            $complianceStatus = 'Non-Comply';
                        } else {
                            $complianceStatus = 'Comply';
                        }

                        $noVal = $row[0] ?? null;
                        $no = (is_numeric($noVal) && (int)$noVal > 0 && (int)$noVal < 500) ? (int)$noVal : $counter;

                        LegalRegulation::create([
                            'no' => $no,
                            'regulation_name' => $regulationName,
                            'validity_status' => $validityStatus ?: 'Berlaku',
                            'relevance' => $relevance,
                            'follow_up' => $followUp,
                            'nature_of_compliance' => $nature ?: 'Wajib',
                            'related_party' => $relatedParty ?: 'Legal',
                            'compliance_status' => $complianceStatus,
                            'sheet_name' => 'Sheet1',
                            'notes' => trim((string)($row[8] ?? '')),
                        ]);

                        $counter++;
                    }

                    Log::info("LegalRegulationImport: successfully imported " . ($counter - 1) . " regulations.");
                }
            },
        ];
    }
}
