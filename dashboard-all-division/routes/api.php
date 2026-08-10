<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\ItDashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DivisionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

// Auth routes
Route::middleware('auth:sanctum')->group(function () {
    // User Management Routes
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    
    // Data Entry Routes
    Route::get('/data-entries', [\App\Http\Controllers\Api\DataEntryController::class, 'index']);
    Route::post('/data-entries', [\App\Http\Controllers\Api\DataEntryController::class, 'store']);
    
    // IT Assets Routes
    Route::apiResource('it-assets', \App\Http\Controllers\Api\ItAssetController::class);
    
    // IT Emails Routes
    Route::apiResource('it-emails', \App\Http\Controllers\Api\ItEmailController::class);

    // Divisions
    Route::get('/divisions', [DivisionController::class, 'index']);

    // IT Dashboard Routes
    Route::get('/it-dashboard/assets', [ItDashboardController::class, 'getAssets']);
    Route::get('/it-dashboard/emails', [ItDashboardController::class, 'getEmails']);
    Route::get('/it-dashboard/tickets', [ItDashboardController::class, 'getTickets']);
});
