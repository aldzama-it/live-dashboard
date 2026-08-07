<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataImport extends Model
{
    use HasFactory;

    protected $fillable = ['page_id', 'period', 'filename', 'status', 'row_count', 'error_message', 'uploaded_by'];

    public function page()
    {
        return $this->belongsTo(Page::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
