<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$budgets = App\Models\ItBudget::where('allocated_amount', '>', 0)->get();
$expenses = App\Models\ItBudgetExpense::with('budget')->get();

echo "### Data Alokasi Anggaran ###\n";
echo "| Bulan | Kategori | Nominal (Rp) |\n";
echo "|---|---|---|\n";
foreach($budgets as $b) {
    echo "| {$b->month} {$b->year} | {$b->category} | " . number_format($b->allocated_amount, 0, ',', '.') . " |\n";
}

echo "\n### Data Pengeluaran Berdasarkan 4 Kategori Utama ###\n";
$groupedExpenses = $expenses->groupBy('group_category');
echo "| Kategori Utama | Total Pengeluaran (Rp) |\n";
echo "|---|---|\n";
foreach(['Asset', 'Subscription', 'Maintenance', 'Operational'] as $catName) {
    $total = isset($groupedExpenses[$catName]) ? $groupedExpenses[$catName]->sum('amount') : 0;
    echo "| {$catName} | " . number_format($total, 0, ',', '.') . " |\n";
}

echo "\n### Rincian Data Pengeluaran ###\n";
echo "| Tanggal | Keterangan | Kategori Utama | Kategori Anggaran | Nominal (Rp) |\n";
echo "|---|---|---|---|\n";
foreach($expenses as $e) {
    $cat = $e->budget ? $e->budget->category : '-';
    echo "| {$e->expense_date} | {$e->description} | {$e->group_category} | {$cat} | " . number_format($e->amount, 0, ',', '.') . " |\n";
}
