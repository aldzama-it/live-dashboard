<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['division_id', 'name', 'code'];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
    
    public function users()
    {
        return $this->hasMany(User::class);
    }
}