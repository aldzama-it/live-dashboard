<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItSoftware extends Model
{
    protected $table = 'it_softwares';
    protected $fillable = ['name', 'status', 'progress', 'active_users', 'description'];
}
