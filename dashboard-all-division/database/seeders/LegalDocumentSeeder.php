<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LegalDocument;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class LegalDocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('legal_documents')->truncate();

        $jsonPath = database_path('seeders/legal_documents.json');
        if (!File::exists($jsonPath)) {
            return;
        }

        $json = File::get($jsonPath);
        $data = json_decode($json, true);

        if (!is_array($data)) {
            return;
        }

        foreach (array_chunk($data, 50) as $chunk) {
            $records = array_map(function ($item) {
                return [
                    'category' => $item['category'],
                    'topic' => $item['topic'] ?? null,
                    'document_name' => $item['document_name'],
                    'identifier' => $item['identifier'] ?? null,
                    'related_party' => $item['related_party'] ?? null,
                    'start_date' => $item['start_date'] ?? null,
                    'expired_date' => $item['expired_date'] ?? null,
                    'extension_submission_date' => $item['extension_submission_date'] ?? null,
                    'extension_progress' => $item['extension_progress'] ?? null,
                    'location' => $item['location'] ?? null,
                    'pic_name' => $item['pic_name'] ?? null,
                    'pic_email' => $item['pic_email'] ?? null,
                    'status' => $item['status'] ?? 'Aktif',
                    'notes' => $item['notes'] ?? null,
                    'link_document' => $item['link_document'] ?? null,
                    'has_hard_file' => !empty($item['has_hard_file']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }, $chunk);

            LegalDocument::insert($records);
        }
    }
}
