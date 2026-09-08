<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LegalDocument extends Model
{
    use HasFactory;

    protected $table = 'legal_documents';

    protected $fillable = [
        'category',
        'topic',
        'document_name',
        'identifier',
        'related_party',
        'start_date',
        'expired_date',
        'extension_submission_date',
        'extension_progress',
        'location',
        'pic_name',
        'pic_email',
        'status',
        'notes',
        'link_document',
        'has_hard_file',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'expired_date' => 'date:Y-m-d',
        'extension_submission_date' => 'date:Y-m-d',
        'has_hard_file' => 'boolean',
    ];

    protected $appends = [
        'days_remaining',
        'urgency_status',
    ];

    public function getDaysRemainingAttribute(): ?int
    {
        if (!$this->expired_date) {
            return null;
        }

        try {
            $dateStr = (string)$this->expired_date;
            $now = Carbon::today();
            $expired = Carbon::parse($dateStr)->startOfDay();

            return (int) $now->diffInDays($expired, false);
        } catch (\Throwable $e) {
            return null;
        }
    }


    public function getUrgencyStatusAttribute(): string
    {
        $days = $this->days_remaining;

        if ($days === null) {
            return 'no_expiry';
        }

        if ($days <= 0) {
            return 'expired'; // Expired
        }

        // Khusus SILO alert H-60, kategori lain alert H-30
        $criticalThreshold = ($this->category === 'silo') ? 60 : 30;

        if ($days <= $criticalThreshold) {
            return 'critical'; // Perlu perpanjangan segera
        }

        if ($days <= 90) {
            return 'warning'; // Mendekati jatuh tempo
        }

        return 'safe'; // Masih berlaku aman
    }
}
