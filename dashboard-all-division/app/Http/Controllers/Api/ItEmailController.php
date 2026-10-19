<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItEmail;
use App\Services\AssetApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ItEmailController extends Controller
{
    public function index(Request $request, AssetApiService $assetApi)
    {
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        if ($assetApi->isConfigured()) {
            try {
                $live = $assetApi->getDashboardEmailsData($isRefresh);
                return response()->json($live);
            } catch (\Exception $e) {
                Log::warning('Asset API live fetch failed in ItEmailController: ' . $e->getMessage());
            }
        }

        return response()->json(ItEmail::orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email_address' => 'required|email|unique:it_emails,email_address',
            'domain' => 'required|string',
            'user_name' => 'required|string',
            'department' => 'nullable|string',
            'division_project' => 'nullable|string',
        ]);

        $email = ItEmail::create($validated);
        return response()->json($email, 201);
    }

    public function update(Request $request, $id)
    {
        $email = ItEmail::findOrFail($id);
        
        $validated = $request->validate([
            'email_address' => 'required|email|unique:it_emails,email_address,' . $id,
            'domain' => 'required|string',
            'user_name' => 'required|string',
            'department' => 'nullable|string',
            'division_project' => 'nullable|string',
        ]);

        $email->update($validated);
        return response()->json($email);
    }

    public function destroy($id)
    {
        $email = ItEmail::findOrFail($id);
        $email->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
