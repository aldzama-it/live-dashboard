<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    // config/services.php, tambahkan array baru di return [...]
'admin' => [
    'name' => env('ADMIN_NAME', 'Super Admin'),
    'email' => env('ADMIN_EMAIL', 'admin@dashboard.local'),
    'password' => env('ADMIN_PASSWORD', 'password'),
],

'accurate' => [
    'client_id' => env('ACCURATE_CLIENT_ID'),
    'client_secret' => env('ACCURATE_CLIENT_SECRET'),
    'redirect_uri' => env('ACCURATE_REDIRECT_URI', 'http://localhost:8000/api/accurate/callback'),
    'app_key' => env('ACCURATE_APP_KEY'),
    'db_id' => env('ACCURATE_DB_ID'),
],

];
