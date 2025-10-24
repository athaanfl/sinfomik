# 🔧 Perbaikan Error Export PDF

## ❌ Error yang Terjadi

### 1. `pdf.autoTable is not a function`
**Penyebab:** Import jspdf-autotable tidak benar
```javascript
// ❌ SALAH
import 'jspdf-autotable';

// ✅ BENAR
import autoTable from 'jspdf-autotable';
```

**Solusi:** Import dengan named import dan gunakan sebagai function
```javascript
// Cara pakai yang benar
autoTable(pdf, {
    head: [headers],
    body: rows,
    // ... config lainnya
});
```

---

### 2. `Cannot read properties of undefined (reading 'toFixed')`
**Penyebab:** Data yang di-map mengandung nilai `undefined` atau `null`

**Lokasi Error:**
- Saat mapping data student, field `item.nilai` tidak ada
- Data student menggunakan field `rata_keseluruhan` bukan `nilai`
- Tidak ada null/undefined checking sebelum call `.toFixed()`

**Solusi:** 
1. Tambahkan null checking dengan operator `||`
2. Gunakan field yang benar (`rata_keseluruhan` untuk student data)
3. Filter data sesuai subject yang dipilih sebelum export

---

## ✅ Perbaikan yang Dilakukan

### 1. Fix Import Statement
```javascript
// File: frontend/src/features/admin/analytics.js
import autoTable from 'jspdf-autotable';
```

### 2. Fix autoTable Usage
```javascript
// Ubah dari:
pdf.autoTable({ ... })

// Menjadi:
autoTable(pdf, { ... })
```

### 3. Fix Student Data Mapping
```javascript
// BEFORE (ERROR)
if (tabType === 'student') {
    rows = tableData.map(item => [
        item.nama_mapel,
        `${item.tahun_ajaran} - Sem ${item.semester}`,
        item.nilai.toFixed(2),  // ❌ item.nilai bisa undefined
        getPredikat(item.nilai)
    ]);
}

// AFTER (FIXED)
if (tabType === 'student') {
    rows = tableData.map(item => {
        const nilai = parseFloat(item.rata_keseluruhan || item.nilai || 0);
        return [
            item.nama_mapel || '-',
            `${item.tahun_ajaran || '-'} - Sem ${item.semester || '-'}`,
            nilai > 0 ? nilai.toFixed(2) : '-',
            nilai > 0 ? getPredikat(nilai) : '-'
        ];
    });
}
```

### 4. Fix Data Filtering for Student Export
```javascript
// BEFORE (ERROR) - Kirim semua data
exportChartToPDF(
    studentChartRef,
    filename,
    title,
    studentData.data,  // ❌ Kirim semua data tanpa filter
    'student'
);

// AFTER (FIXED) - Filter dulu sesuai mata pelajaran
onClick={() => {
    const mapelName = mataPelajaranList.find(m => m.id === parseInt(selectedMapelStudent))?.nama || 'Mata Pelajaran';
    
    // Filter data untuk mata pelajaran yang dipilih
    const filteredData = Array.isArray(studentData.data)
        ? studentData.data.filter(it => parseInt(it.id_mapel, 10) === parseInt(selectedMapelStudent, 10))
        : [];
    
    exportChartToPDF(
        studentChartRef,
        `laporan_${studentData.student.nama_siswa}_${mapelName}`,
        `Grafik Perkembangan Nilai - ${studentData.student.nama_siswa} - ${mapelName}`,
        filteredData,  // ✅ Kirim data yang sudah difilter
        'student'
    );
}}
```

### 5. Add Null Safety for All Tab Types
```javascript
// School Data
if (tabType === 'school') {
    rows = tableData.map(item => [
        item.nama_mapel || '-',
        `${item.tahun_ajaran || '-'} - Sem ${item.semester || '-'}`,
        item.rata_rata_sekolah || '-',
        item.jumlah_siswa || '0',
        item.nilai_terendah || '-',
        item.nilai_tertinggi || '-'
    ]);
}

// Angkatan Data
if (tabType === 'angkatan') {
    rows = tableData.map(item => [
        item.nama_mapel || '-',
        `${item.tahun_ajaran || '-'} - Sem ${item.semester || '-'}`,
        item.rata_rata_angkatan || '-',
        item.jumlah_siswa || '0',
        item.nilai_terendah || '-',
        item.nilai_tertinggi || '-'
    ]);
}
```

### 6. Add Debug Logging
```javascript
const exportChartToPDF = async (chartRef, filename, title, tableData, tabType) => {
    // ... validation

    console.log('📄 Starting PDF export...');
    console.log('📊 Table Data:', tableData);
    console.log('📋 Tab Type:', tabType);
    console.log('🔢 Data length:', tableData?.length);

    try {
        // ... export logic
    }
}
```

---

## 🧪 Testing Checklist

Setelah perbaikan, test semua skenario:

### ✅ Test Student Analytics Export
1. Pilih siswa dari dropdown
2. Pilih mata pelajaran
3. Klik "Export ke PDF"
4. Verify:
   - PDF berhasil didownload
   - Grafik muncul dengan jelas
   - Tabel berisi data mata pelajaran yang dipilih saja
   - Nilai dan predikat benar

### ✅ Test School Analytics Export
1. Pilih mata pelajaran
2. Klik "Export ke PDF"
3. Verify:
   - PDF berhasil didownload
   - Grafik trend sekolah muncul
   - Tabel berisi semua periode untuk mata pelajaran tersebut
   - Nilai min/max dengan warna yang benar

### ✅ Test Angkatan Analytics Export
1. Pilih angkatan
2. Pilih mata pelajaran
3. Klik "Export ke PDF"
4. Verify:
   - PDF berhasil didownload
   - Grafik perkembangan angkatan muncul
   - Tabel berisi data angkatan untuk mata pelajaran tersebut

---

## 🔍 Root Cause Analysis

### Mengapa Error Terjadi?

1. **Import Issue**
   - `jspdf-autotable` menggunakan default export
   - Harus diimport sebagai named import
   - Tidak bisa digunakan sebagai `pdf.autoTable()` method

2. **Data Structure Mismatch**
   - API endpoint berbeda mengembalikan struktur data berbeda
   - Student API: menggunakan `rata_keseluruhan`
   - School/Angkatan API: menggunakan `rata_rata_sekolah` / `rata_rata_angkatan`
   - Kode awal tidak handle perbedaan ini

3. **No Null Safety**
   - Data dari database bisa null/undefined
   - Langsung call `.toFixed()` tanpa checking
   - Menyebabkan runtime error

4. **Data Filtering Issue**
   - Student data berisi semua mata pelajaran
   - Perlu difilter dulu sesuai `selectedMapelStudent`
   - Export button mengirim unfiltered data

---

## 📚 Lessons Learned

1. **Always Check Data Structure**
   - Verify API response structure
   - Don't assume field names are consistent
   - Add console.log for debugging

2. **Null Safety is Important**
   - Always use `|| '-'` or `|| 0` as fallback
   - Check if value exists before calling methods
   - Use optional chaining `?.`

3. **Read Library Documentation**
   - jspdf-autotable uses `autoTable(pdf, config)`
   - Not `pdf.autoTable(config)`
   - Check examples in documentation

4. **Filter Data Before Processing**
   - Don't pass raw API data to export
   - Filter/transform data as needed
   - Match the data structure expected by export function

---

## 🚀 Next Steps (Optional Improvements)

1. **Add Loading State**
   ```javascript
   const [isExporting, setIsExporting] = useState(false);
   
   const exportChartToPDF = async (...) => {
       setIsExporting(true);
       try {
           // ... export logic
       } finally {
           setIsExporting(false);
       }
   }
   ```

2. **Better Error Messages**
   ```javascript
   catch (error) {
       console.error('Error exporting to PDF:', error);
       if (error.message.includes('toFixed')) {
           alert('❌ Error: Data tidak lengkap. Silakan refresh halaman.');
       } else {
           alert('❌ Gagal membuat PDF: ' + error.message);
       }
   }
   ```

3. **Add Progress Indicator**
   - Show "Generating PDF..." toast
   - Progress bar for large datasets
   - Success confirmation

4. **Validate Data Before Export**
   ```javascript
   if (!tableData || tableData.length === 0) {
       alert('⚠️ Tidak ada data untuk di-export');
       return;
   }
   ```

---

## 📝 Summary

**Errors Fixed:**
- ✅ `pdf.autoTable is not a function` → Import dan usage diperbaiki
- ✅ `Cannot read properties of undefined (reading 'toFixed')` → Null safety ditambahkan
- ✅ Wrong data structure for student → Field name diperbaiki
- ✅ Unfiltered data sent to export → Filtering ditambahkan

**Files Modified:**
- `frontend/src/features/admin/analytics.js`
  - Import statement
  - exportChartToPDF function
  - Student export button onClick handler
  - Data mapping for all tab types

**Result:**
🎉 Export PDF sekarang berfungsi dengan baik untuk semua tab (Student, School, Angkatan)!
