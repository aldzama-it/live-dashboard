<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItEmail extends Model
{
    protected $fillable = [
        'email_address',
        'domain',
        'user_name',
        'department',
        'division_project'
    ];
}
