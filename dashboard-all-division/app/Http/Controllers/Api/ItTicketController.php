<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ItTicket;

class ItTicketController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ticket_number' => 'required|string|unique:it_tickets',
            'department' => 'nullable|string',
            'category' => 'nullable|string',
            'subject' => 'required|string',
            'description' => 'nullable|string',
            'status' => 'required|string',
            'priority' => 'required|string',
            'assigned_to' => 'nullable|string',
            'resolved_at' => 'nullable|date',
        ]);

        $ticket = ItTicket::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $ticket
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $ticket = ItTicket::findOrFail($id);

        $validated = $request->validate([
            'ticket_number' => 'required|string|unique:it_tickets,ticket_number,'.$id,
            'department' => 'nullable|string',
            'category' => 'nullable|string',
            'subject' => 'required|string',
            'description' => 'nullable|string',
            'status' => 'required|string',
            'priority' => 'required|string',
            'assigned_to' => 'nullable|string',
            'resolved_at' => 'nullable|date',
        ]);

        $ticket->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $ticket
        ]);
    }

    public function destroy($id)
    {
        $ticket = ItTicket::findOrFail($id);
        $ticket->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data deleted successfully'
        ]);
    }
}
