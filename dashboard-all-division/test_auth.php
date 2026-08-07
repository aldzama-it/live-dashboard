<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = App\Models\User::first();
$user->password = Hash::make('password');
$user->save();

dump('Auth Attempt Result: ' . (Auth::attempt(['email' => $user->email, 'password' => 'password']) ? 'TRUE' : 'FALSE'));
