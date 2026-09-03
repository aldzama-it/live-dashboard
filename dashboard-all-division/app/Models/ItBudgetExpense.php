<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItBudgetExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'it_budget_id',
        'group_category',
        'description',
        'amount',
        'expense_date',
    ];

    public function budget()
    {
        return $this->belongsTo(ItBudget::class, 'it_budget_id');
    }
}
