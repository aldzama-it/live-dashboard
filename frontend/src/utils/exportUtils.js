import * as XLSX from 'xlsx';

/**
 * Membersihkan nilai sel agar aman untuk diekspor ke Excel / CSV
 * - Menghapus enter/newline di dalam sel agar baris data tidak terputus
 * - Mengonversi null/undefined ke tanda strip '-'
 */
export const cleanExportValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }
  if (typeof value === 'number') {
    return value;
  }
  // Replace internal linebreaks with space so CSV & Excel stay single-line per record
  return String(value)
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
};

/**
 * Ekspor data ke format Microsoft Excel (.xlsx) murni
 * Menggunakan SheetJS dengan kalkulasi lebar kolom otomatis (auto-fit width)
 */
export const exportToExcel = (filename, sheetName, headers, rows) => {
  try {
    const safeSheetName = (sheetName || 'Data').replace(/[\\/?*[\]]/g, '').substring(0, 31);
    const resolvedRows = typeof rows === 'function' ? rows() : rows;

    // Bersihkan nilai data
    const cleanedRows = resolvedRows.map(row =>
      row.map(val => cleanExportValue(val))
    );

    // Buat array data dengan header
    const data = [headers, ...cleanedRows];

    // Buat worksheet dan workbook
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();

    // Hitung lebar kolom otomatis (auto column width)
    const colWidths = headers.map((header, colIdx) => {
      let maxLen = String(header || '').length;
      cleanedRows.forEach(row => {
        const val = row[colIdx];
        if (val !== null && val !== undefined) {
          const str = String(val);
          // Batasi perhitungan panjang ke max 50 karakter agar kolom deskripsi tidak terlalu lebar
          const len = Math.min(str.length, 50);
          if (len > maxLen) maxLen = len;
        }
      });
      return { wch: Math.max(maxLen + 4, 10) };
    });

    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

    // Pastikan ekstensi .xlsx
    const cleanFilename = (filename || 'export')
      .replace(/\.csv$/i, '')
      .replace(/\.xlsx$/i, '');
    const finalFilename = `${cleanFilename}.xlsx`;

    XLSX.writeFile(wb, finalFilename);
    return true;
  } catch (err) {
    console.error('Gagal mengekspor ke Excel:', err);
    // Fallback ke CSV jika terjadi kesalahan
    exportToCsv(filename, headers, rows);
    return false;
  }
};

/**
 * Ekspor data ke format CSV (.csv) yang kompatibel dengan Excel Indonesia/Windows
 * - Menggunakan delimiter titik-koma (;) dengan header `sep=;`
 * - Dilengkapi UTF-8 BOM (\uFEFF) untuk teks berbahasa Indonesia
 * - Membersihkan enter/newline di dalam sel agar baris tabel tidak terpecah
 */
export const exportToCsv = (filename, headers, rows) => {
  try {
    const resolvedRows = typeof rows === 'function' ? rows() : rows;

    const formatCsvCell = (val) => {
      const cleaned = cleanExportValue(val);
      const str = String(cleaned).replace(/"/g, '""');
      return `"${str}"`;
    };

    // sep=; memastikan Microsoft Excel langsung memisahkan kolom tanpa perlu Text Import Wizard
    const csvLines = [
      'sep=;',
      headers.map(h => formatCsvCell(h)).join(';'),
      ...resolvedRows.map(row => row.map(v => formatCsvCell(v)).join(';'))
    ];

    const csvContent = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanFilename = (filename || 'export')
      .replace(/\.xlsx$/i, '')
      .replace(/\.csv$/i, '');
    const finalFilename = `${cleanFilename}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Gagal mengekspor ke CSV:', err);
    return false;
  }
};
