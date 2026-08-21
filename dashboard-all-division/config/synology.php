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
            'file' => 'dashboard-data/asset.xlsx',
            'imports' => ['asset' => \App\Imports\ItAssetImport::class],
        ],
        'IT_Emails' => [
            'file' => 'dashboard-data/email.xlsx',
            'imports' => ['email' => \App\Imports\ItEmailImport::class],
        ],
        'IT_Budget_Allocation' => [
            'file' => 'dashboard-data/budgetallocation.xlsx',
            'imports' => ['budget_allocation' => \App\Imports\ItBudgetAllocationImport::class],
        ],
        'IT_Budget_Expense' => [
            'file' => 'dashboard-data/budgetexpenses.xlsx',
            'imports' => ['budget_expense' => \App\Imports\ItBudgetExpenseImport::class],
        ],
        'IT_Software' => [
            'file' => 'dashboard-data/software.xlsx',
            'imports' => ['software' => \App\Imports\ItSoftwareImport::class],
        ],
        'IT_Ticketing' => [
            'file' => 'dashboard-data/ticketing.xlsx',
            'imports' => ['ticketing' => \App\Imports\ItTicketImport::class],
        ],
        'IT_Highlights' => [
            'file' => 'dashboard-data/highlights.xlsx',
            'imports' => ['highlights' => \App\Imports\ItHighlightImport::class],
        ],
    ],
];
