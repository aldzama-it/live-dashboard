<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Department;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    /**
     * Get all divisions (with parent department)
     */
    public function index()
    {
        $divisions = Division::with('department')->get();
        // Add backwards-compatible alias 'division' matching parent department
        $divisions->each(function ($d) {
            $d->division = $d->department;
        });
        return response()->json($divisions);
    }

    /**
     * Get all departments (with child divisions)
     */
    public function departments()
    {
        return response()->json(Department::with('divisions')->get());
    }
}
