<?php

namespace App\Http\Controllers;

use App\Models\Diser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DiserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $disers = Diser::orderBy('name')->get();

        // remove all disers with name null
        $disers = $disers->filter(function ($diser) {
            return $diser->name !== '';
        });

        return Inertia::render('diser-masterfile', [
            'disers' => $disers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'rsc_re' => 'nullable|string|max:255',
            'fb_name' => 'nullable|string|max:255',
            'rate' => 'nullable|numeric|min:0',
            'sales' => 'nullable|numeric|min:0',
            'others_1' => 'nullable|string|max:255',
            'hold_stop_allow' => 'nullable|string|max:255',
            'gcash_number' => 'nullable|string|max:255',
            'gcash_name' => 'nullable|string|max:255',
            'sv_only' => 'nullable|string|max:255',
            'company_sv' => 'nullable|string|max:255',
            'others_2' => 'nullable|string|max:255',
            'others_3' => 'nullable|string|max:255',
        ]);

        $diser = Diser::create($validated);

        return response()->json([
            'message' => 'Diser created successfully',
            'diser' => $diser
        ]);
    }

    /**
     * Batch update multiple disers.
     */
    public function batchUpdate(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:disers,id',
            'updates.*.changes' => 'required|array',
            'updates.*.changes.name' => 'nullable|string|max:255',
            'updates.*.changes.rsc_re' => 'nullable|string|max:255',
            'updates.*.changes.fb_name' => 'nullable|string|max:255',
            'updates.*.changes.rate' => 'nullable|numeric|min:0',
            'updates.*.changes.sales' => 'nullable|numeric|min:0',
            'updates.*.changes.others_1' => 'nullable|string|max:255',
            'updates.*.changes.hold_stop_allow' => 'nullable|string|max:255',
            'updates.*.changes.gcash_number' => 'nullable|string|max:255',
            'updates.*.changes.gcash_name' => 'nullable|string|max:255',
            'updates.*.changes.sv_only' => 'nullable|string|max:255',
            'updates.*.changes.company_sv' => 'nullable|string|max:255',
            'updates.*.changes.others_2' => 'nullable|string|max:255',
            'updates.*.changes.others_3' => 'nullable|string|max:255',
        ]); 

        $updates = collect($validated['updates']);

        DB::beginTransaction();
        try {
            foreach ($updates as $update) {
                $diser = Diser::find($update['id']);
                
                // Process changes to handle empty strings as null
                $changes = collect($update['changes'])->map(function ($value, $key) {
                    // Convert empty strings to null for all fields
                    if ($value === '') {
                        return null;
                    }
                    
                    // Handle numeric fields
                    if (in_array($key, ['rate', 'sales'])) {
                        if ($value === null || $value === '') {
                            return null;
                        }
                        return is_numeric($value) ? (float) $value : null;
                    }
                    
                    return $value;
                })->toArray();
                
                $diser->update($changes);
            }
            DB::commit();

            return response()->json([
                'message' => 'Disers updated successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to update disers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Diser $diser)
    {
        try {
            $diser->delete();
            
            return response()->json([
                'message' => 'Diser deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete diser',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
