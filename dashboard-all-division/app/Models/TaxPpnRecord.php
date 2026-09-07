<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxPpnRecord extends Model
{
    protected $fillable = [
        'type',
        'tanggal',
        'tgl_pajak',
        'no_referensi',
        'no_faktur_pajak',
        'nilai_pajak'
    ];
}
