# 📊 Panduan Excel Import/Export - Sistem Nilai

## 🎯 Fitur Baru: Import & Export Nilai via Excel

Fitur ini memungkinkan guru untuk:
1. **Download template Excel** dengan data siswa dan kolom TP yang sudah ter-generate otomatis dari ATP
2. **Input nilai secara offline** di Excel dengan format yang terstruktur
3. **Upload kembali** file Excel untuk otomatis meng-import nilai ke sistem

---

## 📥 Cara Download Template Excel

### Langkah-langkah:

1. **Login** sebagai Guru
2. Buka menu **"Input Nilai"**
3. **Pilih Kelas dan Mata Pelajaran** dari dropdown
4. Klik tombol **"📥 Download Template Excel"** (warna hijau)
5. File Excel akan otomatis terdownload dengan nama:
   ```
   Template_Nilai_<NamaMapel>_<NamaKelas>.xlsx
   ```

### Isi Template Excel:

Template Excel akan berisi:
- **Info Header:**
  - Mata Pelajaran
  - Kelas
  - Tahun Ajaran & Semester
  
- **Sheet "Template Nilai":**
  - Kolom `ID Siswa` (readonly, abu-abu)
  - Kolom `Nama Siswa` (readonly, abu-abu)
  - Kolom `TP 1`, `TP 2`, `TP 3`, ... (sesuai jumlah TP dari ATP untuk semester aktif)
  - Kolom `UAS`
  - Kolom `Nilai Akhir` (auto-calculated: 70% avg TP + 30% UAS)

- **Sheet "Deskripsi TP":**
  - Daftar TP dengan deskripsi lengkap dari ATP Excel

### Formula Otomatis:

Kolom **Nilai Akhir** sudah memiliki formula Excel:
```excel
=IF(OR(UAS="", COUNTBLANK(TP1:TPn)=n), "", ROUND(AVERAGE(TP1:TPn)*0.7 + UAS*0.3, 2))
```

Artinya:
- Jika UAS kosong atau semua TP kosong → Nilai Akhir kosong
- Jika ada nilai → Otomatis hitung: **70% rata-rata TP + 30% UAS**

---

## ✏️ Cara Input Nilai di Excel

### Aturan Input:

1. **JANGAN EDIT** kolom `ID Siswa` dan `Nama Siswa` (readonly, background abu-abu)
2. **JANGAN HAPUS** atau **UBAH STRUKTUR** header tabel
3. **Input nilai** di kolom TP dan UAS dengan aturan:
   - Rentang: **0 - 100**
   - Bisa desimal (contoh: 87.5)
   - Boleh dikosongkan jika belum ada nilai
4. **Nilai Akhir** akan otomatis ter-calculate (jangan edit manual)

### Contoh Pengisian:

| ID Siswa | Nama Siswa        | TP 1 | TP 2 | TP 3 | UAS | Nilai Akhir |
|----------|-------------------|------|------|------|-----|-------------|
| 1        | Ahmad Budiman     | 85   | 90   | 88   | 82  | 86.80       |
| 2        | Siti Nurhaliza    | 92   | 88   | 90   | 95  | 91.00       |
| 3        | Budi Santoso      | 75   | 80   |      | 78  |             |
| 4        | Dewi Lestari      |      |      |      |     |             |

> **Note:** 
> - Siswa 3: TP3 kosong → Nilai Akhir tidak ter-calculate
> - Siswa 4: Semua kosong → Nilai Akhir kosong

---

## 📤 Cara Upload & Import Nilai dari Excel

### Langkah-langkah:

1. **Simpan file Excel** yang sudah diisi nilai
2. Kembali ke **halaman Input Nilai** di sistem
3. Pastikan **Kelas dan Mata Pelajaran** masih sesuai dengan template yang didownload
4. Klik tombol **"📤 Upload & Import Nilai"** (warna biru)
5. **Pilih file Excel** (.xlsx) yang sudah diisi
6. Sistem akan:
   - Upload file
   - Validasi format dan data
   - Import nilai ke database
   - Tampilkan hasil (success/failed count)

### Pesan Hasil Import:

✅ **Sukses:**
```
✅ Import selesai. Berhasil: 45, Gagal: 0
```

⚠️ **Dengan Error:**
```
⚠️ Import selesai dengan error: Berhasil: 40, Gagal: 5
Nilai TP1 untuk ID 123 tidak valid: 150, Nilai UAS untuk ID 456 tidak valid: abc, ...
```

❌ **Gagal Total:**
```
❌ Gagal import nilai: Format Excel tidak sesuai template
```

---

## 🔍 Validasi Import

Sistem akan melakukan validasi:

1. **Format File:**
   - Harus `.xlsx` (Excel 2007+)
   - Maksimal ukuran: **5MB**
   - Sheet "Template Nilai" harus ada

2. **Struktur Data:**
   - Header row harus ada (row 6)
   - Kolom ID Siswa, TP, UAS harus ditemukan
   - ID Siswa harus valid (terdaftar di database)

3. **Nilai:**
   - Rentang: **0 - 100**
   - Harus numerik (bukan text)
   - Kosong diperbolehkan (tidak diimport)

4. **Conflict Handling:**
   - Jika nilai sudah ada → **UPDATE** (replace dengan nilai baru)
   - Jika nilai belum ada → **INSERT** (tambah nilai baru)

---

## 🛠️ Troubleshooting

### ❌ "Format Excel tidak sesuai template"
**Penyebab:** File Excel bukan template yang didownload dari sistem atau sudah dimodifikasi strukturnya  
**Solusi:** Download ulang template dan isi kembali

### ❌ "ID Siswa XXX tidak ditemukan"
**Penyebab:** ID siswa di Excel tidak cocok dengan database  
**Solusi:** Jangan edit kolom ID Siswa, gunakan template asli

### ❌ "Nilai TP1 untuk ID XXX tidak valid: 150"
**Penyebab:** Nilai di luar rentang 0-100  
**Solusi:** Pastikan semua nilai dalam rentang 0-100

### ❌ "Only .xlsx files are allowed"
**Penyebab:** File bukan format .xlsx (mungkin .xls, .csv, dll)  
**Solusi:** Save as `.xlsx` (Excel 2007+)

### ⚠️ "Import selesai dengan error"
**Penyebab:** Sebagian data valid, sebagian invalid  
**Solusi:** 
- Cek daftar error yang ditampilkan
- Perbaiki baris yang error
- Upload ulang (nilai yang sudah sukses akan ter-update lagi)

---

## 💡 Tips & Best Practices

### ✅ DO:
- ✅ Download template fresh setiap kali mau input nilai
- ✅ Backup file Excel sebelum upload
- ✅ Isi nilai secara bertahap (bisa upload berulang kali)
- ✅ Gunakan fitur Excel "Data Validation" untuk restrict input 0-100
- ✅ Simpan file dengan nama yang jelas (contoh: `Nilai_IPA_1A_Ganjil_2024.xlsx`)

### ❌ DON'T:
- ❌ Jangan edit kolom ID Siswa atau Nama Siswa
- ❌ Jangan hapus atau tambah row header
- ❌ Jangan ubah nama sheet "Template Nilai"
- ❌ Jangan input nilai di luar rentang 0-100
- ❌ Jangan simpan file di format selain .xlsx

---

## 📊 Contoh Workflow Lengkap

### Scenario: Input Nilai IPA Kelas 1A Semester Ganjil

1. **Login** sebagai Guru IPA
2. **Pilih:** Kelas `1 Gumujeng` - Mapel `IPA (SCIENCE)`
3. **Download:** Template Excel (dapat `Template_Nilai_IPA_1_Gumujeng.xlsx`)
4. **Lihat Sheet "Deskripsi TP"** untuk memahami setiap TP
5. **Isi nilai** di Sheet "Template Nilai":
   - TP 1-6: Nilai dari 0-100
   - UAS: Nilai ujian akhir semester
   - Nilai Akhir: Auto-calculated
6. **Save** file Excel
7. **Upload** kembali via tombol "📤 Upload & Import Nilai"
8. **Verifikasi:** Cek pesan sukses dan jumlah nilai ter-import
9. **Konfirmasi:** Refresh tabel input nilai di sistem, pastikan nilai sudah ter-load

---

## 🔐 Keamanan & Privasi

- ✅ File Excel **TIDAK DISIMPAN** di server (hanya diproses di memory)
- ✅ Hanya guru yang **ditugaskan di kelas tersebut** yang bisa download/upload
- ✅ Validasi `id_guru` untuk memastikan tidak ada import nilai ke kelas lain
- ✅ File upload maksimal **5MB** untuk mencegah abuse
- ✅ Semua error logging untuk audit trail

---

## 📝 Database Schema

Import nilai akan mengupdate tabel `Nilai`:

```sql
CREATE TABLE Nilai (
    id_nilai INTEGER PRIMARY KEY,
    id_siswa INTEGER NOT NULL,
    id_guru INTEGER NOT NULL,
    id_mapel INTEGER NOT NULL,
    id_kelas INTEGER NOT NULL,
    id_ta_semester INTEGER NOT NULL,
    jenis_nilai TEXT NOT NULL, -- 'TP' atau 'UAS'
    urutan_tp INTEGER, -- 1, 2, 3, ... (NULL untuk UAS)
    nilai REAL NOT NULL, -- 0.00 - 100.00
    tanggal_input DATETIME DEFAULT CURRENT_TIMESTAMP,
    keterangan TEXT,
    UNIQUE(id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, jenis_nilai, urutan_tp)
);
```

**Unique Constraint** mencegah duplikasi:
- Jika upload file yang sama 2x → Nilai ter-UPDATE, bukan INSERT duplikat

---

## 🚀 Fitur Mendatang (Roadmap)

- [ ] Export nilai yang sudah ada (bukan template kosong)
- [ ] Bulk delete nilai via Excel
- [ ] Import catatan/keterangan per nilai
- [ ] Template Excel dengan conditional formatting (auto-highlight nilai <75)
- [ ] Import nilai dari Google Sheets (via API)
- [ ] History log perubahan nilai (audit trail UI)

---

## 📧 Support

Jika ada masalah atau pertanyaan:
1. Cek **console browser** (F12) untuk error detail
2. Cek **terminal backend** untuk server error log
3. Hubungi Admin Sistem

---

**Dokumentasi dibuat:** ${new Date().toLocaleDateString('id-ID')}  
**Versi Sistem:** 2.0 (Excel Import/Export Feature)
