<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Synology SMB Credentials
    |--------------------------------------------------------------------------
    |
    | Configuration for connecting to the Synology NAS via SMB.
    |
    */
    'connection' => [
        'host'     => env('SYNOLOGY_HOST', '192.168.1.50'),
        'share'    => env('SYNOLOGY_SHARE', 'dashboard-data'),
        'username' => env('SYNOLOGY_USERNAME', ''),
        'password' => env('SYNOLOGY_PASSWORD', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Division Configuration
    |--------------------------------------------------------------------------
    |
    | Mapping for each division's data files. The 'file' key should be the 
    | relative path INSIDE the share.
    |
    */
    'divisions' => [
        'IT_Assets' => [
            'file' => 'dashboard-data/it/asset.xlsx',
            'imports' => ['asset' => \App\Imports\ItAssetImport::class],
        ],

        'IT_Budget_Allocation' => [
            'file' => 'dashboard-data/it/budgetallocation.xlsx',
            'imports' => ['budget_allocation' => \App\Imports\ItBudgetAllocationImport::class],
        ],
        'IT_Budget_Expense' => [
            'file' => 'dashboard-data/it/budgetexpenses.xlsx',
            'imports' => ['budget_expense' => \App\Imports\ItBudgetExpenseImport::class],
        ],
        'IT_Software' => [
            'file' => 'dashboard-data/it/software.xlsx',
            'imports' => ['software' => \App\Imports\ItSoftwareImport::class],
        ],
        'IT_Ticketing' => [
            'file' => 'dashboard-data/it/ticketing.xlsx',
            'imports' => ['ticketing' => \App\Imports\ItTicketImport::class],
        ],
        'Finance_AP_Invoices' => [
            'file' => 'dashboard-data/finance/ap_invoices.xlsx',
            'imports' => ['ap_invoices' => \App\Imports\Finance\ApInvoiceImport::class],
        ],
        'Finance_AP_Aging' => [
            'file' => 'dashboard-data/finance/ap_aging.xlsx',
            'imports' => ['ap_aging' => \App\Imports\Finance\ApAgingImport::class],
        ],
        'Finance_AP_Payments' => [
            'file' => 'dashboard-data/finance/ap_payments.xlsx',
            'imports' => ['ap_payments' => \App\Imports\Finance\ApPaymentImport::class],
        ],
        'Finance_AP_PaymentDetails' => [
            'file' => 'dashboard-data/finance/ap_payment_details.xlsx',
            'imports' => ['ap_payment_details' => \App\Imports\Finance\ApPaymentDetailImport::class],
        ],
        'Finance_AR_Invoices' => [
            'file' => 'dashboard-data/finance/ar_invoices.xlsx',
            'imports' => ['ar_invoices' => \App\Imports\Finance\ArInvoiceImport::class],
        ],
        'Finance_AR_Aging' => [
            'file' => 'dashboard-data/finance/ar_aging.xlsx',
            'imports' => ['ar_aging' => \App\Imports\Finance\ArAgingImport::class],
        ],
        'Finance_AR_Receipts' => [
            'file' => 'dashboard-data/finance/ar_receipts.xlsx',
            'imports' => ['ar_receipts' => \App\Imports\Finance\ArReceiptImport::class],
        ],
        'Tax_PPN_Masukan' => [
            'file' => 'dashboard-data/finance/ppn_masukan.xlsx',
            'imports' => ['ppn_masukan' => \App\Imports\Tax\PpnMasukanImport::class],
        ],
        'Tax_PPN_Keluaran' => [
            'file' => 'dashboard-data/finance/ppn_keluaran.xlsx',
            'imports' => ['ppn_keluaran' => \App\Imports\Tax\PpnKeluaranImport::class],
        ],
        'Legal_Matriks_Peruu' => [
            'file' => 'dashboard-data/legal/FRM-AZM-603-012 (Matriks Peraturan Perundang-Undangan).xlsx',
            'direct_path' => 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MATRIKS PER-UU\\FRM-AZM-603-012 (Matriks Peraturan Perundang-Undangan).xlsx',
            'imports' => ['regulations' => \App\Imports\Legal\LegalRegulationImport::class],
        ],
        'Legal_Kpi' => [
            'file' => 'dashboard-data/legal/Data KPI Divisi Legal 2026 .xlsx',
            'direct_path' => 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\14. KPI, RISK REGISTER, RNR, WLA, DAN BUDGETING\\KPI\\Data KPI Divisi Legal 2026 .xlsx',
            'imports' => ['kpi' => \App\Imports\Legal\LegalKpiImport::class],
        ],
        'Legal_Budget' => [
            'file' => 'dashboard-data/legal/10. DANA OPERASIONAL/2026',
            'direct_path' => 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\10. DANA OPERASIONAL\\2026',
            'imports' => ['budget' => \App\Imports\Legal\LegalBudgetImport::class],
        ],
        'Legal_Vehicle' => [
            'file' => 'dashboard-data/legal/FRM-AZM-603-016 (Monitoring Izin Kendaraan).xlsx',
            'direct_path' => 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MONITORING KENDARAAN\\FRM-AZM-603-016 (Monitoring Izin Kendaraan).xlsx',
            'imports' => ['vehicle' => \App\Imports\Legal\LegalVehicleImport::class],
        ],
        'Legal_Contract_Permit' => [
            'file' => 'dashboard-data/legal/FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project).xlsx',
            'direct_path' => 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MONITORING KONTRAK - PERMIT\\FRM-AZM-603-008 (Rekap Masa Berlaku Dokumen Perizinan, Perjanjian, Kontrak Project).xlsx',
            'imports' => ['contract_permit' => \App\Imports\Legal\LegalContractPermitImport::class],
        ],
        'Legal_Silo' => [
            'file' => 'dashboard-data/legal/Monitoring SILO - Legal.xlsx',
            'direct_path' => 'Y:\\Google Drive Legal\\FOLDER DRIVE (NEW)\\1. LEGAL\\11. DATABASE & MONITORING\\MONITORING SILO\\Monitoring SILO - Legal.xlsx',
            'imports' => ['silo' => \App\Imports\Legal\LegalSiloImport::class],
        ],

    ],
];
