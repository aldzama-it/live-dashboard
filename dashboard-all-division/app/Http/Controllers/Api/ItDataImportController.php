<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ItAssetTemplateExport;
use App\Exports\ItEmailTemplateExport;
use App\Imports\ItAssetImport;
use App\Imports\ItEmailImport;

class ItDataImportController extends Controller
{
    /**
     * Download the Excel template for a specific module
     */
    public function downloadTemplate($module)
    {
        switch ($module) {
            case 'asset':
                return Excel::download(new ItAssetTemplateExport, 'it_asset_template.xlsx');
            case 'email':
                return Excel::download(new ItEmailTemplateExport, 'it_email_template.xlsx');
            case 'budgetexpenses':
                return Excel::download(new \App\Exports\ItBudgetExpenseTemplateExport, 'it_budget_expenses_template.xlsx');
            case 'budgetallocation':
                return Excel::download(new \App\Exports\ItBudgetAllocationTemplateExport, 'it_budget_allocation_template.xlsx');
            case 'software':
                return Excel::download(new \App\Exports\ItSoftwareTemplateExport, 'it_software_template.xlsx');
            case 'ticketing':
                return Excel::download(new \App\Exports\ItTicketTemplateExport, 'it_ticket_template.xlsx');
            default:
                return response()->json(['message' => 'Template for module not found'], 404);
        }
    }

    /**
     * Import Excel data for a specific module
     */
    public function importExcel(Request $request, $module)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            switch ($module) {
                case 'asset':
                    Excel::import(new ItAssetImport, $request->file('file'));
                    break;
                case 'email':
                    Excel::import(new ItEmailImport, $request->file('file'));
                    break;
                case 'budgetexpenses':
                    Excel::import(new \App\Imports\ItBudgetExpenseImport, $request->file('file'));
                    break;
                case 'budgetallocation':
                    Excel::import(new \App\Imports\ItBudgetAllocationImport, $request->file('file'));
                    break;
                case 'software':
                    Excel::import(new \App\Imports\ItSoftwareImport, $request->file('file'));
                    break;
                case 'ticketing':
                    Excel::import(new \App\Imports\ItTicketImport, $request->file('file'));
                    break;
                default:
                    return response()->json(['message' => 'Import for module not supported'], 400);
            }

            return response()->json(['message' => 'Data imported successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }
}
