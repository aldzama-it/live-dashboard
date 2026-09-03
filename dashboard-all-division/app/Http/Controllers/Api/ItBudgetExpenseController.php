<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ItBudgetExpense;
use App\Models\ItBudget;
use Carbon\Carbon;

class ItBudgetExpenseController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_date' => 'required|date',
            'description' => 'required|string',
            'group_category' => 'required|string',
            'amount' => 'required|numeric',
        ]);

        // Try to find the matching budget ID
        $budgetId = null;
        $parsedDate = Carbon::parse($validated['expense_date']);
        $monthsMap = [1=>'Januari', 2=>'Februari', 3=>'Maret', 4=>'April', 5=>'Mei', 6=>'Juni', 7=>'Juli', 8=>'Agustus', 9=>'September', 10=>'Oktober', 11=>'November', 12=>'Desember'];
        $monthIndo = $monthsMap[$parsedDate->month] ?? null;

        if ($monthIndo) {
            $budget = ItBudget::where('year', $parsedDate->year)
                ->where('month', $monthIndo)
                ->where('category', $validated['group_category'])
                ->first();
            if ($budget) {
                $budgetId = $budget->id;
            }
        }

        $validated['it_budget_id'] = $budgetId;

        $expense = ItBudgetExpense::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $expense
        ], 201);
    }

    public function destroy($id)
    {
        $expense = ItBudgetExpense::findOrFail($id);
        $expense->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data deleted successfully'
        ]);
    }
}
