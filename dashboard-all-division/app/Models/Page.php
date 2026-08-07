<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use HasFactory;

    protected $fillable = ['division_id', 'name', 'slug', 'description', 'fields', 'is_active'];

    protected $casts = [
        'fields' => 'array',
        'is_active' => 'boolean',
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function dataEntries()
    {
        return $this->hasMany(DataEntry::class);
    }
}