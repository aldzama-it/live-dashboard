<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SynologySyncLog extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'file_modified_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
}
