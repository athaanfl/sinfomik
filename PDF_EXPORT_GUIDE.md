# 📄 Panduan Export PDF Profesional

## Fitur Export PDF yang Telah Ditambahkan

### ✨ Fitur Utama

1. **Header Profesional**
   - Logo SINFOMIK (Sistem Informasi Nilai Akademik)
   - Background biru elegan
   - Judul laporan yang jelas

2. **Grafik Berkualitas Tinggi**
   - Resolusi tinggi (scale 2x)
   - Background putih bersih
   - Ukuran optimal di PDF

3. **Tabel Data Lengkap**
   - Format profesional dengan striped rows
   - Header berwarna biru
   - Data terorganisir dengan baik
   
4. **Footer Informatif**
   - Tanggal dan waktu cetak lengkap
   - Nomor halaman
   - Garis pemisah elegan

---

## 📊 Jenis Laporan yang Tersedia

### 1. Laporan Analisis Siswa
**File Output:** `laporan_[Nama Siswa]_[Mata Pelajaran].pdf`

**Konten:**
- Grafik perkembangan nilai siswa per mata pelajaran
- Tabel detail nilai dengan kolom:
  - Mata Pelajaran
  - Periode (Tahun Ajaran - Semester)
  - Nilai
  - Predikat (A/B/C/D/E)

**Predikat Nilai:**
- A (Sangat Baik): 90-100
- B (Baik): 80-89
- C (Cukup): 70-79
- D (Kurang): 60-69
- E (Sangat Kurang): <60

### 2. Laporan Analisis Sekolah
**File Output:** `laporan_sekolah_[Mata Pelajaran].pdf`

**Konten:**
- Grafik trend rata-rata nilai sekolah
- Tabel data dengan kolom:
  - Mata Pelajaran
  - Periode
  - Rata-rata
  - Jumlah Siswa
  - Nilai Terendah (merah)
  - Nilai Tertinggi (hijau)

### 3. Laporan Analisis Angkatan
**File Output:** `laporan_angkatan_[Angkatan]_[Mata Pelajaran].pdf`

**Konten:**
- Grafik perkembangan angkatan
- Tabel data dengan kolom:
  - Mata Pelajaran
  - Periode
  - Rata-rata Angkatan
  - Jumlah Siswa
  - Nilai Terendah (merah)
  - Nilai Tertinggi (hijau)

---

## 🎨 Desain PDF

### Color Scheme
- **Primary Color:** `#2980b9` (Blue) - Header dan aksen
- **Text Color:** `#000000` (Black) - Konten utama
- **Accent Red:** `#dc3545` - Nilai terendah
- **Accent Green:** `#28a745` - Nilai tertinggi
- **Gray:** `#646464` - Footer text

### Layout
- **Format:** A4 Portrait
- **Margins:** 15mm (kiri-kanan), 10mm (atas-bawah)
- **Font:** Helvetica (bold untuk header, normal untuk body)
- **Font Sizes:**
  - Logo: 28pt
  - Judul: 14pt
  - Sub-judul: 11-12pt
  - Tabel Header: 9pt
  - Tabel Body: 8pt
  - Footer: 8pt

---

## 📝 Cara Menggunakan

1. **Buka Dashboard Analytics**
   - Pilih tab yang ingin di-export (Siswa/Sekolah/Angkatan)

2. **Pilih Data yang Ingin Ditampilkan**
   - Pilih siswa (untuk analisis siswa)
   - Pilih angkatan (untuk analisis angkatan)
   - Pilih mata pelajaran yang ingin dilihat

3. **Klik Tombol Export**
   - Tombol "📥 Export ke PDF" akan muncul di pojok kanan atas grafik
   - Klik tombol tersebut

4. **PDF Akan Otomatis Terdownload**
   - File akan tersimpan di folder Downloads
   - Nama file otomatis sesuai dengan jenis laporan

---

## 🔧 Dependencies yang Digunakan

```json
{
  "html2canvas": "^1.4.1",
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4"
}
```

### Penjelasan Dependencies

1. **html2canvas**
   - Mengkonversi DOM element (grafik) menjadi canvas
   - High quality image capture

2. **jspdf**
   - Library untuk generate PDF
   - Support berbagai format dan orientasi

3. **jspdf-autotable**
   - Plugin untuk membuat tabel profesional di PDF
   - Auto pagination
   - Styling yang fleksibel

---

## 💡 Tips & Tricks

### Untuk PDF yang Lebih Baik:

1. **Pastikan Grafik Terlihat Penuh**
   - Scroll grafik ke posisi yang terlihat sepenuhnya
   - Jangan ada elemen yang tertutup

2. **Pilih Data yang Relevan**
   - Export hanya mata pelajaran yang diperlukan
   - Tabel akan otomatis menyesuaikan jumlah data

3. **Nama File Otomatis**
   - Nama file sudah otomatis sesuai konten
   - Format: `laporan_[jenis]_[nama]_[mapel].pdf`

### Customization (untuk Developer):

Jika ingin mengubah logo atau warna:

```javascript
// Di file: frontend/src/features/admin/analytics.js
// Fungsi: exportChartToPDF

// Ubah warna header
pdf.setFillColor(41, 128, 185); // Ganti RGB sesuai keinginan

// Ubah teks logo
pdf.text('SINFOMIK', pageWidth / 2, 15, { align: 'center' });

// Untuk menambahkan logo image (jika ada):
// pdf.addImage(logoBase64, 'PNG', x, y, width, height);
```

---

## 📱 Browser Compatibility

✅ **Tested & Working:**
- Google Chrome
- Microsoft Edge
- Firefox
- Safari

⚠️ **Note:**
- Pastikan browser mengizinkan download otomatis
- Pop-up blocker tidak menghalangi download

---

## 🐛 Troubleshooting

### PDF Tidak Terdownload
- Cek pop-up blocker browser
- Pastikan ada izin download otomatis
- Lihat console browser (F12) untuk error

### Grafik Tidak Muncul di PDF
- Pastikan grafik sudah ter-render sempurna sebelum export
- Tunggu beberapa detik setelah memilih mata pelajaran
- Refresh halaman jika perlu

### Tabel Terputus
- Library autotable sudah handle pagination otomatis
- Jika data terlalu banyak, akan lanjut ke halaman berikutnya

### Error "chartRef is null"
- Pastikan grafik sudah tampil
- Pilih mata pelajaran terlebih dahulu sebelum export

---

## 📚 Struktur Code

```
frontend/src/features/admin/analytics.js
│
├── Import Dependencies
│   ├── html2canvas
│   ├── jspdf
│   └── jspdf-autotable
│
├── Helper Functions
│   └── getPredikat() - Convert nilai ke predikat huruf
│
├── Main Export Function
│   └── exportChartToPDF(chartRef, filename, title, tableData, tabType)
│       ├── Capture chart dengan html2canvas
│       ├── Create PDF dengan header profesional
│       ├── Add chart image
│       ├── Generate table dengan autotable
│       └── Add footer dengan timestamp
│
└── Export Buttons (3 lokasi)
    ├── Student Analytics Tab
    ├── School Analytics Tab
    └── Angkatan Analytics Tab
```

---

## 🎯 Future Enhancements (Opsional)

1. **Logo Upload**
   - Admin bisa upload logo sekolah
   - Logo otomatis muncul di PDF

2. **Watermark**
   - Tambah watermark "CONFIDENTIAL" atau cap sekolah

3. **Email Export**
   - Kirim PDF langsung via email

4. **Batch Export**
   - Export multiple siswa/mapel sekaligus

5. **Custom Template**
   - Admin bisa pilih template PDF
   - Different color schemes

6. **QR Code**
   - QR code untuk verifikasi dokumen

---

## 📞 Support

Jika ada pertanyaan atau masalah, silakan:
1. Check console browser untuk error message
2. Pastikan semua dependencies terinstall
3. Verify data tersedia di database

---

**Version:** 1.0.0  
**Last Updated:** Oktober 2025  
**Developed for:** SINFOMIK - Sistem Informasi Nilai Akademik
