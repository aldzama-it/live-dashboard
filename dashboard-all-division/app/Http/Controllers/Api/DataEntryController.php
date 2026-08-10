<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Department;

class DataEntryController extends Controller
{
    public function index(Request $request)
    {
        $department_id = $request->query('department_id');
        $period = $request->query('period');

        if (!$department_id || !$period) {
            return response()->json(['message' => 'Missing department_id or period'], 400);
        }

        $entry = DB::table('data_entries')
            ->where('department_id', $department_id)
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
            'department_id' => 'required|exists:departments,id',
            'period' => 'required|string',
            'payload' => 'required|array',
        ]);

        $department = Department::findOrFail($validated['department_id']);

        // Use updateOrInsert to either update existing period or create new
        DB::table('data_entries')->updateOrInsert(
            [
                'department_id' => $department->id,
                'period' => $validated['period'],
            ],
            [
                'division_id' => $department->division_id,
                'payload' => json_encode($validated['payload']),
                'created_by' => $request->user()->id,
                'updated_at' => now(),
            ]
        );

        return response()->json(['message' => 'Data entry saved successfully'], 201);
    }
}
