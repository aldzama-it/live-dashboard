<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasFactory;

    protected $fillable = ['department_id', 'name', 'code'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function pages()
    {
        return $this->hasMany(Page::class);
    }
    
    public function users()
    {
        return $this->hasMany(User::class);
    }
}