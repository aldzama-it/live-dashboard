<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Division;
use App\Models\Department;

class DataEntryController extends Controller
{
    public function index(Request $request)
    {
        $division_id = $request->query('division_id') ?? $request->query('department_id');
        $period = $request->query('period');

        if (!$division_id || !$period) {
            return response()->json(['message' => 'Missing division_id or period'], 400);
        }

        $entry = DB::table('data_entries')
            ->where(function ($q) use ($division_id) {
                $q->where('division_id', $division_id)
                  ->orWhere('department_id', $division_id);
            })
            ->where('period', $period)
            ->first();

        if ($entry) {
            return response()->json(json_decode($entry->payload, true));
        }

        return response()->json([]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'division_id' => 'nullable|exists:divisions,id',
            'department_id' => 'nullable|exists:departments,id',
            'period' => 'required|string',
            'payload' => 'required|array',
        ]);

        $divisionId = $validated['division_id'] ?? null;
        $departmentId = $validated['department_id'] ?? null;

        if ($divisionId) {
            $division = Division::find($divisionId);
            if ($division) {
                $departmentId = $division->department_id;
            }
        } elseif (!$departmentId) {
            return response()->json(['message' => 'division_id or department_id is required'], 422);
        }

        // Use updateOrInsert to either update existing period or create new
        DB::table('data_entries')->updateOrInsert(
            [
                'division_id' => $divisionId,
                'period' => $validated['period'],
            ],
            [
                'department_id' => $departmentId,
                'payload' => json_encode($validated['payload']),
                'created_by' => $request->user()->id,
                'updated_at' => now(),
            ]
        );

        return response()->json(['message' => 'Data entry saved successfully'], 201);
    }
}
