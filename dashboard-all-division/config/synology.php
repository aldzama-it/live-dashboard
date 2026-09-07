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

    ],
];
