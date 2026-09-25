<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SptTaxReport extends Model
{
    use HasFactory;

    protected $table = 'spt_tax_reports';

    protected $fillable = [
        'period',
        'tax_type',
        'total_tax_amount',
        'status',
        'bpe_number',
        'bpe_file_path',
        'reported_at',
        'reported_by',
        'notes',
    ];

    protected $casts = [
        'total_tax_amount' => 'decimal:2',
        'reported_at' => 'datetime',
    ];
}
