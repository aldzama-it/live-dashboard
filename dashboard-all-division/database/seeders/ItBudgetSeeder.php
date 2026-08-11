<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ItBudget;
use App\Models\ItBudgetExpense;

class ItBudgetSeeder extends Seeder
{
    public function run(): void
    {
        $budgetsRaw = [
            ['Januari', 2026, 'Software License Solidworks (Lifetime)', 0],
            ['Januari', 2026, 'Software License AutoCAD (Annual)', 35000000],
            ['Januari', 2026, 'Software SketchUp (Annual)', 7000000],
            ['Januari', 2026, 'PC', 0],
            ['Januari', 2026, 'Motherboard (1 unit)', 0],
            ['Januari', 2026, 'Software Adobe Illustrator & Photoshop', 350000],
            ['Januari', 2026, 'Canva Pro (Monthly)', 95000],
            ['Januari', 2026, 'Mouse', 1200000],
            ['Januari', 2026, 'Pembayaran accurate system', 3000000],
            ['Januari', 2026, 'Pembayaran ortax', 0],
            ['Januari', 2026, 'Berlangganan google Drive', 500000],
            ['Januari', 2026, 'Accurate (DB Lama sampai Maret\'26)', 2500000],
            ['Januari', 2026, 'Internet dan PABX', 4000000],
            ['Januari', 2026, 'CCTV', 4200000],
            ['Januari', 2026, 'CCTV', 0],
            ['Januari', 2026, 'VPS, Server Email, dan Domain', 0],
            ['Januari', 2026, 'Zoom Meeting', 1800000],
            ['Januari', 2026, 'Microsoft Office', 3850000],
            ['Januari', 2026, 'Windows 11 Pro', 5670000],
            ['Januari', 2026, 'Tinta', 2500000],
            ['Januari', 2026, 'PC', 0],
            ['Januari', 2026, 'Data Base Safety (operations)', 300000],
            
            ['Februari', 2026, 'Software License Solidworks (Lifetime)', 0],
            ['Februari', 2026, 'Software License AutoCAD (Annual)', 0],
            ['Februari', 2026, 'Software SketchUp (Annual)', 0],
            ['Februari', 2026, 'PC', 0],
            ['Februari', 2026, 'Motherboard (1 unit)', 3000000],
            ['Februari', 2026, 'Software Adobe Illustrator & Photoshop', 350000],
            ['Februari', 2026, 'Canva Pro (Monthly)', 95000],
            ['Februari', 2026, 'Mouse', 0],
            ['Februari', 2026, 'Pembayaran accurate system', 3000000],
            ['Februari', 2026, 'Pembayaran ortax', 0],
            ['Februari', 2026, 'Berlangganan google Drive', 0],
            ['Februari', 2026, 'Accurate (DB Lama sampai Maret\'26)', 2500000],
            ['Februari', 2026, 'Internet dan PABX', 3700000],
            ['Februari', 2026, 'CCTV', 4200000],
            ['Februari', 2026, 'CCTV', 0],
            ['Februari', 2026, 'VPS, Server Email, dan Domain', 0],
            ['Februari', 2026, 'Zoom Meeting', 1800000],
            ['Februari', 2026, 'Microsoft Office', 3850000],
            ['Februari', 2026, 'Windows 11 Pro', 5670000],
            ['Februari', 2026, 'Tinta', 2500000],
            ['Februari', 2026, 'PC', 0],
            ['Februari', 2026, 'Data Base Safety (operations)', 300000],

            ['Maret', 2026, 'Software License Solidworks (Lifetime)', 0],
            ['Maret', 2026, 'Software License AutoCAD (Annual)', 0],
            ['Maret', 2026, 'Software SketchUp (Annual)', 0],
            ['Maret', 2026, 'PC', 30000000],
            ['Maret', 2026, 'Motherboard (1 unit)', 0],
            ['Maret', 2026, 'Software Adobe Illustrator & Photoshop', 350000],
            ['Maret', 2026, 'Canva Pro (Monthly)', 95000],
            ['Maret', 2026, 'Mouse', 0],
            ['Maret', 2026, 'Pembayaran accurate system', 3000000],
            ['Maret', 2026, 'Pembayaran ortax', 0],
            ['Maret', 2026, 'Berlangganan google Drive', 0],
            ['Maret', 2026, 'Accurate (DB Lama sampai Maret\'26)', 2500000],
            ['Maret', 2026, 'Internet dan PABX', 3700000],
            ['Maret', 2026, 'CCTV', 4200000],
            ['Maret', 2026, 'CCTV', 0],
            ['Maret', 2026, 'VPS, Server Email, dan Domain', 0],
            ['Maret', 2026, 'Zoom Meeting', 1800000],
            ['Maret', 2026, 'Microsoft Office', 3850000],
            ['Maret', 2026, 'Windows 11 Pro', 5670000],
            ['Maret', 2026, 'Tinta', 2500000],
            ['Maret', 2026, 'PC', 0],
            ['Maret', 2026, 'Data Base Safety (operations)', 300000],

            ['April', 2026, 'Software License Solidworks (Lifetime)', 0],
            ['April', 2026, 'Software License AutoCAD (Annual)', 0],
            ['April', 2026, 'Software SketchUp (Annual)', 0],
            ['April', 2026, 'PC', 0],
            ['April', 2026, 'Motherboard (1 unit)', 0],
            ['April', 2026, 'Software Adobe Illustrator & Photoshop', 350000],
            ['April', 2026, 'Canva Pro (Monthly)', 95],
            ['April', 2026, 'Mouse', 0],
            ['April', 2026, 'Pembayaran accurate system', 1500000],
            ['April', 2026, 'Pembayaran ortax', 0],
            ['April', 2026, 'Berlangganan google Drive', 0],
            ['April', 2026, 'Accurate (DB Lama sampai Maret\'26)', 1700000],
            ['April', 2026, 'Internet dan PABX', 3700000],
            ['April', 2026, 'CCTV', 4200000],
            ['April', 2026, 'CCTV', 0],
            ['April', 2026, 'VPS, Server Email, dan Domain', 0],
            ['April', 2026, 'Zoom Meeting', 0],
            ['April', 2026, 'Microsoft Office', 3300000],
            ['April', 2026, 'Windows 11 Pro', 4860000],
            ['April', 2026, 'Tinta', 2500000],
            ['April', 2026, 'PC', 50000000],
            ['April', 2026, 'Data Base Safety (operations)', 300000],

            ['Mei', 2026, 'Software License Solidworks (Lifetime)', 350000000],
            ['Mei', 2026, 'Software License AutoCAD (Annual)', 0],
            ['Mei', 2026, 'Software SketchUp (Annual)', 0],
            ['Mei', 2026, 'PC', 0],
            ['Mei', 2026, 'Motherboard (1 unit)', 0],
            ['Mei', 2026, 'Software Adobe Illustrator & Photoshop', 350000],
            ['Mei', 2026, 'Canva Pro (Monthly)', 95000],
            ['Mei', 2026, 'Mouse', 0],
            ['Mei', 2026, 'Pembayaran accurate system', 1500000],
            ['Mei', 2026, 'Pembayaran ortax', 0],
            ['Mei', 2026, 'Berlangganan google Drive', 0],
            ['Mei', 2026, 'Accurate (DB Lama sampai Maret\'26)', 1700000],
            ['Mei', 2026, 'Internet dan PABX', 3700000],
            ['Mei', 2026, 'CCTV', 4200000],
            ['Mei', 2026, 'CCTV', 0],
            ['Mei', 2026, 'VPS, Server Email, dan Domain', 0],
            ['Mei', 2026, 'Zoom Meeting', 0],
            ['Mei', 2026, 'Microsoft Office', 3300000],
            ['Mei', 2026, 'Windows 11 Pro', 4860000],
            ['Mei', 2026, 'Tinta', 2000000],
            ['Mei', 2026, 'PC', 0],
            ['Mei', 2026, 'Data Base Safety (operations)', 300000],
        ];

        // Store budget map to link expenses
        $budgetMap = [];

        foreach ($budgetsRaw as $b) {
            $budget = ItBudget::create([
                'month' => $b[0],
                'year' => $b[1],
                'category' => $b[2],
                'allocated_amount' => $b[3],
            ]);
            
            // Map by month to easily associate expenses below
            // Some expenses might not map perfectly by name, we map them to a catch-all if not found,
            // or just pick the first budget of that month for simplicity if we can't find an exact category match.
            if (!isset($budgetMap[$b[0]])) {
                $budgetMap[$b[0]] = [];
            }
            // For this dummy logic, we just grab any budget id in that month to attach the expense to.
            // A more robust app would have explicit category mapping.
            $budgetMap[$b[0]][] = $budget->id;
        }

        $expensesRaw = [
            ['Januari', 2026, 'Pengambilan Mouse oleh Mas Joni untuk Tim QMS HO', 244495],
            ['Januari', 2026, 'Pengambilan CCCTV & Cooling Pad Laptop oleh Mas Joni', 878368],
            ['Januari', 2026, 'Internet, Listrik WS, Listrik WS meduran Januari 2026', 1142190],
            ['Januari', 2026, 'Accurate DB Baru 19 Jan-18 Feb 2026', 1676100],
            
            ['Februari', 2026, 'Accurate Database Lama 10 Jan - 12 Feb 26', 8436],
            ['Februari', 2026, 'Listrik Ws, Listrik HO, Internet Februari 2026', 1142190],
            ['Februari', 2026, 'Pengambilan mouse oleh Syahrul Tim IT', 3222840],
            ['Februari', 2026, 'pertanggung jawaban Op IT jan 26 (PJ-2600027) reff MM.2026.01.00036', 2899602],
            ['Februari', 2026, 'Pengambilan CCTV untuk Modular Tim Demolish HO', 2927928],
            ['Februari', 2026, 'Pengambilan Bracket TV oleh Ridho', 18018],
            
            ['Maret', 2026, 'Zoom Pro Annual', 1723241],
            ['Maret', 2026, 'Accurate DB lama 15 Feb-12 Mar 26', 7881],
            ['Maret', 2026, 'Accurate DB Baru 22 Feb - 21 Mar 26', 1587300],
            ['Maret', 2026, 'Subscription IT', 2537691],
            ['Maret', 2026, 'Op IT Feb 26 (PJ-2600090) reff MM.2026.02.00060', 3725400],
            ['Maret', 2026, 'Accurate DB Lama dana DB Baru', 7437],
            ['Maret', 2026, 'Accurate DB Lama dana DB Baru', 1587300],
            
            ['April', 2026, 'Subscription, web service', 950000],
            ['April', 2026, 'Accurate DB Lama 13 Mar-12 April 26', 743700],
            ['April', 2026, 'Accurate DB Baru 13 Mar-12 April 26', 1587300],
            ['April', 2026, 'starlink dascoland, service printer, adaptor laptop, biznet kantor, wifi gamping mar 26', 3193230],
            ['April', 2026, 'Internet WS Baru April', 1142190],
            ['April', 2026, 'subscribe GPT', 349000],
            
            ['Mei', 2026, 'Pengambilan Barang oleh Hildan tim IT', 1928530],
            ['Mei', 2026, 'Listrik WS Baru, Listrik WS 85, Internet Mei 26', 1142190],
            ['Mei', 2026, 'Accurate Db Lama dan Baru Mei 2026', 765900],
            ['Mei', 2026, 'Accurate Db Lama dan Baru Mei 2026', 1709400],
            ['Mei', 2026, 'Op IT April 26 (PJ-2600181) reff MM.2026.04.00016', 3464049],
            ['Mei', 2026, 'pertanggung jawaban Op Finance Mar II (PJ-2600156) reff MM.2026.03.00068', 346585],
        ];

        foreach ($expensesRaw as $e) {
            $month = $e[0];
            $year = $e[1];
            $desc = $e[2];
            $amount = $e[3];
            
            // Remove fallback. Let it be null if not found.
            $budgetId = null;
            
            // Broad category classification (4 categories)
            $descLower = strtolower($desc);
            $groupCategory = 'Operational'; // Default
            
            if (str_contains($descLower, 'mouse') || str_contains($descLower, 'cctv') || str_contains($descLower, 'bracket') || str_contains($descLower, 'laptop') || str_contains($descLower, 'barang') || str_contains($descLower, 'cooling pad') || str_contains($descLower, 'adaptor')) {
                $groupCategory = 'Asset';
            } elseif (str_contains($descLower, 'accurate') || str_contains($descLower, 'zoom') || str_contains($descLower, 'subscription') || str_contains($descLower, 'subscribe')) {
                $groupCategory = 'Subscription';
            } elseif (str_contains($descLower, 'service') || str_contains($descLower, 'repair') || str_contains($descLower, 'maintenance')) {
                $groupCategory = 'Maintenance';
            } elseif (str_contains($descLower, 'internet') || str_contains($descLower, 'biznet') || str_contains($descLower, 'starlink') || str_contains($descLower, 'wifi') || str_contains($descLower, 'listrik')) {
                $groupCategory = 'Operational';
            } else {
                $groupCategory = 'Operational';
            }
            
            // Basic keyword mapping to exact budget ID
            $categoriesInMonth = ItBudget::where('month', $month)->where('year', $year)->get();
            foreach($categoriesInMonth as $cat) {
                $catLower = strtolower($cat->category);
                if (str_contains($descLower, 'mouse') && str_contains($catLower, 'mouse')) { $budgetId = $cat->id; break; }
                if (str_contains($descLower, 'cctv') && str_contains($catLower, 'cctv')) { $budgetId = $cat->id; break; }
                if (str_contains($descLower, 'accurate') && str_contains($catLower, 'accurate')) { $budgetId = $cat->id; break; }
                if (str_contains($descLower, 'internet') && str_contains($catLower, 'internet')) { $budgetId = $cat->id; break; }
                if (str_contains($descLower, 'zoom') && str_contains($catLower, 'zoom')) { $budgetId = $cat->id; break; }
            }

            // Generate a random date in that month
            $monthNum = match($month) {
                'Januari' => 1, 'Februari' => 2, 'Maret' => 3, 'April' => 4, 'Mei' => 5, default => 1
            };
            $date = sprintf('%04d-%02d-%02d', $year, $monthNum, rand(1, 28));
            
            ItBudgetExpense::create([
                'it_budget_id' => $budgetId, // Can be null now
                'group_category' => $groupCategory,
                'description' => $desc,
                'amount' => $amount,
                'expense_date' => $date
            ]);
        }
    }
}
