<?php

namespace App\Imports\Tax;

use App\Models\TaxPpnRecord;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

class PpnKeluaranImport implements ToCollection, WithEvents
{
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                // Hapus data keluaran lama
                TaxPpnRecord::where('type', 'keluaran')->delete();
            },
        ];
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            // Skip baris yang tidak memiliki Nilai Pajak
            if (!isset($row[15]) || !is_numeric($row[15])) {
                continue;
            }

            try {
                $tanggalVal = $row[4];
                $tglPajakVal = $row[6];
                
                // Pastikan format tanggal valid
                if (!is_numeric($tanggalVal)) continue;

                $tanggal = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($tanggalVal)->format('Y-m-d');
                $tglPajak = is_numeric($tglPajakVal) ? \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($tglPajakVal)->format('Y-m-d') : null;

                TaxPpnRecord::create([
                    'type' => 'keluaran',
                    'tanggal' => $tanggal,
                    'tgl_pajak' => $tglPajak,
                    'no_referensi' => trim((string)($row[9] ?? '')),
                    'no_faktur_pajak' => trim((string)($row[12] ?? '')),
                    'nilai_pajak' => (float)$row[15],
                ]);
            } catch (\Exception $e) {
                Log::warning("PpnKeluaranImport: Failed to parse row $index - " . $e->getMessage());
            }
        }
    }
}
