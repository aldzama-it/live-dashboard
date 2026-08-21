<?php

namespace App\Imports;

use App\Models\ItBudgetExpense;
use App\Models\ItBudget;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ItBudgetExpenseImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['description']) || empty($row['amount'])) {
            return null;
        }

        $expenseDate = null;
        if (!empty($row['expense_date'])) {
            if (is_numeric($row['expense_date'])) {
                $expenseDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row['expense_date'])->format('Y-m-d');
            } else {
                try {
                    $expenseDate = Carbon::parse($row['expense_date'])->format('Y-m-d');
                } catch (\Exception $e) {
                    $expenseDate = null;
                }
            }
        }

        $budgetId = null;
        if ($expenseDate && !empty($row['group_category'])) {
            $parsedDate = Carbon::parse($expenseDate);
            $monthsMap = [1=>'Januari', 2=>'Februari', 3=>'Maret', 4=>'April', 5=>'Mei', 6=>'Juni', 7=>'Juli', 8=>'Agustus', 9=>'September', 10=>'Oktober', 11=>'November', 12=>'Desember'];
            $monthIndo = $monthsMap[$parsedDate->month] ?? null;

            if ($monthIndo) {
                $budget = ItBudget::where('year', $parsedDate->year)
                    ->where('month', $monthIndo)
                    ->where('category', $row['group_category'])
                    ->first();
                if ($budget) {
                    $budgetId = $budget->id;
                }
            }
        }

        return ItBudgetExpense::firstOrCreate([
            'description' => $row['description'],
            'amount' => $row['amount'],
            'expense_date' => $expenseDate,
            'group_category' => $row['group_category'] ?? null,
        ], [
            'it_budget_id' => $budgetId,
        ]);
    }
}
