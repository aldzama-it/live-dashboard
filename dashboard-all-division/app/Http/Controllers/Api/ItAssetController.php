<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItAsset;
use App\Services\AssetApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ItAssetController extends Controller
{
    public function index(Request $request, AssetApiService $assetApi)
    {
        $isRefresh = $request->query('refresh') === 'true' || $request->query('refresh') === '1';

        if ($assetApi->isConfigured()) {
            try {
                $live = $assetApi->getDashboardAssetsData($isRefresh);
                return response()->json([
                    'general'    => $live['general'],
                    'individual' => $live['individual'],
                    'total'      => $live['total'],
                    'is_live'    => true,
                ]);
            } catch (\Exception $e) {
                Log::warning('Asset API live fetch failed in ItAssetController: ' . $e->getMessage());
            }
        }

        return response()->json([
            'general' => ItAsset::where('type', 'general')->get(),
            'individual' => ItAsset::where('type', 'individual')->get(),
            'total' => ItAsset::count()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:general,individual',
            'asset_name' => 'required|string',
            'brand_description' => 'nullable|string',
            'location' => 'nullable|string',
            'condition' => 'nullable|string',
            'receiver_name' => 'nullable|string',
            'department' => 'nullable|string',
            'division_project' => 'nullable|string',
            'handover_date' => 'nullable|date',
            'specification' => 'nullable|string',
        ]);

        $asset = ItAsset::create($validated);
        return response()->json($asset, 201);
    }

    public function update(Request $request, $id)
    {
        $asset = ItAsset::findOrFail($id);
        
        $validated = $request->validate([
            'type' => 'required|in:general,individual',
            'asset_name' => 'required|string',
            'brand_description' => 'nullable|string',
            'location' => 'nullable|string',
            'condition' => 'nullable|string',
            'receiver_name' => 'nullable|string',
            'department' => 'nullable|string',
            'division_project' => 'nullable|string',
            'handover_date' => 'nullable|date',
            'specification' => 'nullable|string',
        ]);

        $asset->update($validated);
        return response()->json($asset);
    }

    public function destroy($id)
    {
        $asset = ItAsset::findOrFail($id);
        $asset->delete();
        return response()->json(['message' => 'Asset deleted']);
    }
}
