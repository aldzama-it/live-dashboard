<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    public function index()
    {
        return response()->json(Department::with('division')->get());
    }
}
