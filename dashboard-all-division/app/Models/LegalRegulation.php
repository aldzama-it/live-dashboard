<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LegalRegulation extends Model
{
    use HasFactory;

    protected $table = 'legal_regulations';

    protected $fillable = [
        'no',
        'regulation_name',
        'validity_status',
        'relevance',
        'follow_up',
        'nature_of_compliance',
        'related_party',
        'compliance_status',
        'sheet_name',
        'notes',
    ];
}
