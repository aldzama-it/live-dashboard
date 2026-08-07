<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'description'];

    public function departments()
    {
        return $this->hasMany(Department::class);
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