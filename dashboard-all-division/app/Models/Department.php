<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'description'];

    public function divisions()
    {
        return $this->hasMany(Division::class);
    }
    
    public function users()
    {
        return $this->hasMany(User::class);
    }
}