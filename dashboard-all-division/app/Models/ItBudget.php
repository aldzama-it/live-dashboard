<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItBudget extends Model
{
    use HasFactory;

    protected $fillable = [
        'month',
        'year',
        'category',
        'allocated_amount',
    ];

    public function expenses()
    {
        return $this->hasMany(ItBudgetExpense::class);
    }
}
