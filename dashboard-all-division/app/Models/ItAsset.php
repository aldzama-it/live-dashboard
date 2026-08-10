<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'asset_name',
        'brand_description',
        'location',
        'condition',
        'receiver_name',
        'department',
        'division_project',
        'handover_date',
        'specification'
    ];
}
