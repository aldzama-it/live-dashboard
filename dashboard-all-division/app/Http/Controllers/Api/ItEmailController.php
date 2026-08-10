<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItEmail;
use Illuminate\Http\Request;

class ItEmailController extends Controller
{
    public function index()
    {
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
