<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataEntry extends Model
{
    use HasFactory;

    protected $fillable = ['page_id', 'division_id', 'department_id', 'period', 'payload', 'created_by'];

    protected $casts = [
        'payload' => 'array',
    ];

    public function page()
    {
        return $this->belongsTo(Page::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}