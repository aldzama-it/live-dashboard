<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ItSoftware;

class ItSoftwareController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'status' => 'required|in:launched,development',
            'progress' => 'nullable|integer|min:0|max:100',
            'active_users' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $software = ItSoftware::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $software
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $software = ItSoftware::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string',
            'status' => 'required|in:launched,development',
            'progress' => 'nullable|integer|min:0|max:100',
            'active_users' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $software->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $software
        ]);
    }

    public function destroy($id)
    {
        $software = ItSoftware::findOrFail($id);
        $software->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data deleted successfully'
        ]);
    }
}
