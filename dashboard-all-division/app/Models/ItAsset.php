<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'external_id',
        'type',
        'category',
        'asset_name',
        'asset_code',
        'brand_description',
        'location',
        'condition',
        'status',
        'receiver_name',
        'department',
        'division_project',
        'handover_date',
        'specification'
    ];
}
