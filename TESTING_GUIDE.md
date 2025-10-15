# 🧪 Panduan Testing Fitur ATP Viewer

## ✅ Fitur yang Sudah Dibuat:

1. **Backend:**
   - ✅ Kolom `file_path` ditambahkan ke tabel `CapaianPembelajaran`
   - ✅ File Excel disimpan saat import ke folder `backend/uploads/`
   - ✅ API endpoint baru: `GET /api/excel/atp/:id_mapel/:fase`

2. **Frontend:**
   - ✅ Modal ATP Viewer dengan tabel interaktif
   - ✅ Fitur search, filter kelas, filter semester
   - ✅ Tombol "View Details ATP" di setiap fase

---

## 📋 Langkah-langkah Testing:

### 1. **Persiapan**
- ✅ Backend sudah jalan di `http://localhost:5000`
- ✅ Frontend sudah jalan di `http://localhost:3000`
- ✅ Database sudah diupdate dengan kolom `file_path`

### 2. **Login sebagai Admin**
1. Buka browser: `http://localhost:3000`
2. Login dengan akun admin
3. Masuk ke menu **"Learning Achievement Management"**

### 3. **Import File Excel Baru**
⚠️ **PENTING:** File Excel harus memiliki struktur yang benar:

**Sheet 1: CP [NamaMapel]**
```
Row 1: CAPAIAN PEMBELAJARAN
Row 2: CITIZENSHIP (atau nama mapel lain)
Row 3: TAHUN AJARAN 2025/2026
Row 4: (kosong)
Row 5: Fase A | Fase B | Fase C
Row 6: [Deskripsi A] | [Deskripsi B] | [Deskripsi C]
```

**Sheet 2, 3, 4: ATP [NamaMapel] Fase A/B/C**
```
Row 1: ALUR TUJUAN PEMBELAJARAN
Row 2: CITIZENSHIP
Row 3: FASE A (atau B/C)
Row 4: TAHUN AJARAN 2025/2026
Row 5: Elemen | Capaian Pembelajaran (CP) | Tujuan Pembelajaran (TP) | KKTP | Materi Pokok | Kelas | Semester
Row 6+: Data ATP...
```

**Cara Import:**
1. Scroll ke bagian **"Import from Excel"**
2. Klik **"Choose File"** dan pilih file `ATP Citizenship.xlsx` dari folder `frontend/`
3. Klik tombol **"Import"**
4. Tunggu pesan sukses: "Import berhasil. 3 CP diperbarui."

### 4. **Lihat Capaian Pembelajaran**
1. Scroll ke bawah ke bagian **"Learning Achievements Directory"**
2. Cari mata pelajaran yang baru diimport (misal: CITIZENSHIP)
3. Akan ada 3 fase: A, B, C

### 5. **Test Tombol "View Details ATP"**
1. Di setiap fase, ada tombol hijau **"View Details ATP"**
2. Klik tombol tersebut
3. Modal akan muncul dengan judul: **"Alur Tujuan Pembelajaran (ATP)"**
4. Subtitle: **"CITIZENSHIP - Fase A"** (sesuai fase yang diklik)

### 6. **Test Fitur di Modal ATP Viewer**

**A. Search:**
- Ketik kata kunci di search box (misal: "Pancasila")
- Tabel akan otomatis filter baris yang mengandung kata tersebut

**B. Filter Kelas:**
- Pilih kelas dari dropdown (misal: "Kelas 1")
- Tabel hanya menampilkan data kelas 1

**C. Filter Semester:**
- Pilih semester dari dropdown (misal: "Semester 1")
- Tabel hanya menampilkan data semester 1

**D. Scroll Tabel:**
- Tabel bisa di-scroll horizontal (banyak kolom)
- Tabel bisa di-scroll vertical (banyak rows)

**E. Lihat Data:**
Pastikan kolom-kolom ini terisi:
- No
- Elemen
- Capaian Pembelajaran (CP)
- Tujuan Pembelajaran (TP)
- KKTP
- Materi Pokok
- Kelas
- Semester

### 7. **Test untuk Fase Lain**
1. Tutup modal dengan klik tombol **"Close"** atau **"X"**
2. Klik **"View Details ATP"** untuk **Fase B**
3. Modal akan muncul dengan data Fase B
4. Ulangi untuk **Fase C**

---

## 🐛 Troubleshooting:

### Error: "File Excel tidak ditemukan"
**Penyebab:** CP belum punya file_path (data lama sebelum update)
**Solusi:** 
1. Hapus CP lama
2. Import ulang file Excel

### Error: "Sheet tidak ditemukan"
**Penyebab:** Nama sheet di Excel tidak sesuai format
**Format yang benar:** `ATP CITIZENSHIP Fase A` (sesuai nama mapel)
**Solusi:** 
1. Cek nama sheet di Excel
2. Pastikan sesuai format: `ATP [NamaMapel] Fase [A/B/C]`

### Modal tidak muncul
**Penyebab:** JavaScript error
**Solusi:**
1. Buka Developer Tools (F12)
2. Lihat Console untuk error
3. Refresh halaman

### Data tidak muncul di tabel
**Penyebab:** 
- Format Excel salah
- Sheet kosong
- Header tidak sesuai

**Solusi:**
1. Cek struktur Excel sesuai panduan di atas
2. Pastikan header di row 5
3. Pastikan data mulai dari row 6

---

## 📊 Expected Results:

### Setelah Import Excel:
- ✅ Pesan sukses muncul
- ✅ File Excel tersimpan di `backend/uploads/cp_citizenship_[timestamp].xlsx`
- ✅ Database `CapaianPembelajaran` memiliki:
  - `deskripsi_cp` terisi
  - `file_path` terisi dengan path file Excel

### Setelah Klik "View Details ATP":
- ✅ Modal muncul dengan animasi
- ✅ Tabel menampilkan semua data ATP dari sheet yang sesuai
- ✅ Search berfungsi
- ✅ Filter kelas berfungsi
- ✅ Filter semester berfungsi
- ✅ Counter "Showing X of Y rows" update sesuai filter

---

## 🎯 Test Cases:

| No | Test Case | Expected Result |
|----|-----------|----------------|
| 1 | Import Excel dengan 4 sheets | ✅ Berhasil import, file tersimpan |
| 2 | Klik "View Details ATP" Fase A | ✅ Modal muncul, data Fase A tampil |
| 3 | Klik "View Details ATP" Fase B | ✅ Modal muncul, data Fase B tampil |
| 4 | Klik "View Details ATP" Fase C | ✅ Modal muncul, data Fase C tampil |
| 5 | Search dengan keyword "Pancasila" | ✅ Tabel filter baris yang ada "Pancasila" |
| 6 | Filter Kelas = 1 | ✅ Tabel hanya tampil data Kelas 1 |
| 7 | Filter Semester = 2 | ✅ Tabel hanya tampil data Semester 2 |
| 8 | Kombinasi search + filter | ✅ Filter bekerja secara bersamaan |
| 9 | Scroll horizontal tabel | ✅ Bisa scroll semua kolom |
| 10 | Scroll vertical tabel | ✅ Bisa scroll semua rows (1000+ rows) |

---

## 📁 File yang Telah Diubah:

### Backend:
1. ✅ `backend/src/init_db.js` - Tambah kolom file_path
2. ✅ `backend/src/migrate_add_file_path.js` - Script migration (NEW)
3. ✅ `backend/src/controllers/excelController.js` - Simpan file & baca ATP
4. ✅ `backend/src/routes/excelRoutes.js` - Route ATP endpoint

### Frontend:
1. ✅ `frontend/src/features/admin/capaianPembelajaranManagement.js` - Modal ATP Viewer

### Database:
1. ✅ Tabel `CapaianPembelajaran` - Kolom `file_path` ditambahkan

---

## ✨ Fitur Bonus yang Sudah Ada:

1. **Responsive Design** - Modal menyesuaikan ukuran layar
2. **Loading State** - Spinner saat load data
3. **Error Handling** - Pesan error jelas
4. **Empty State** - Pesan ketika tidak ada data
5. **Row Counter** - "Showing X of Y rows"
6. **Hover Effect** - Row highlight saat hover
7. **Smooth Animation** - Modal fade in/out

---

## 🚀 Next Steps (Optional):

1. Export ATP ke Excel dari modal
2. Print ATP
3. Download template Excel
4. Bulk import multiple mapel sekaligus
5. Edit ATP langsung dari modal

---

**Happy Testing! 🎉**
