<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        // Return users with their roles, department, and division
        return response()->json(User::with(['roles', 'department', 'division.department'])->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|string|exists:roles,name',
            'department_id' => 'nullable|exists:departments,id',
            'division_id' => 'nullable|exists:divisions,id'
        ]);

        $departmentId = null;
        $divisionId = null;

        if ($request->role === 'Direktur') {
            $departmentId = $request->department_id;
        } elseif ($request->role === 'Division PIC' || $request->role === 'Staff') {
            $divisionId = $request->division_id;
            if ($divisionId) {
                $div = \App\Models\Division::find($divisionId);
                $departmentId = $div ? $div->department_id : null;
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'department_id' => $departmentId,
            'division_id' => $divisionId,
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load(['roles', 'department', 'division.department'])
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'role' => 'required|string|exists:roles,name',
            'department_id' => 'nullable|exists:departments,id',
            'division_id' => 'nullable|exists:divisions,id'
        ]);

        $departmentId = null;
        $divisionId = null;

        if ($request->role === 'Direktur') {
            $departmentId = $request->department_id;
        } elseif ($request->role === 'Division PIC' || $request->role === 'Staff') {
            $divisionId = $request->division_id;
            if ($divisionId) {
                $div = \App\Models\Division::find($divisionId);
                $departmentId = $div ? $div->department_id : null;
            }
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->department_id = $departmentId;
        $user->division_id = $divisionId;
        
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        
        $user->save();

        // Sync role (removes old roles and adds the new one)
        $user->syncRoles([$request->role]);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load(['roles', 'department', 'division.department'])
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting oneself
        if (auth()->id() == $user->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
