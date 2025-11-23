# DOKUMEN USER ACCEPTANCE TEST (UAT)
## SISTEM INFORMASI AKADEMIK SEKOLAH DASAR BHINEKAS

---

## 1. AUTENTIKASI & OTORISASI

### Nama Uji: Login Admin / DFD 1.1 Login Admin
**Deskripsi Pengujian**: Verifikasi hak akses admin dapat login ke sistem

**Kasus Uji**:
- Username: admin
- Password: admin123
- User Type: Admin

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan halaman Admin Dashboard dengan menu Manajemen Siswa, Guru, Kelas, Mata Pelajaran, Tahun Ajaran, dan Analytics
- Jika gagal, akan menampilkan pesan error "Username atau password salah" dengan background merah

---

### Nama Uji: Login Guru / DFD 1.2 Login Guru
**Deskripsi Pengujian**: Verifikasi hak akses guru dapat login ke sistem

**Kasus Uji**:
- Username: guru001
- Password: guru123
- User Type: Guru

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan halaman Guru Dashboard dengan menu Input Nilai, Rekap Nilai, Capaian Pembelajaran, dan Analytics
- Jika gagal, akan menampilkan pesan error "Username atau password salah" dengan background merah

---

## 2. MANAJEMEN TAHUN AJARAN & SEMESTER

### Nama Uji: Mengelola Tahun Ajaran Semester / DFD 2.1 Membuat Tahun Ajaran Baru
**Deskripsi Pengujian**: Verifikasi admin dapat membuat tahun ajaran dan semester baru

**Kasus Uji**:
- Tahun Ajaran: 2024/2025
- Semester: Ganjil

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Tahun ajaran semester berhasil ditambahkan" dan data tahun ajaran baru muncul di tabel dengan status "Tidak Aktif"
- Jika gagal akan menampilkan konfirmasi "Tahun ajaran semester sudah ada" jika duplikat

---

### Nama Uji: Mengaktifkan Tahun Ajaran / DFD 2.2 Set Active Tahun Ajaran
**Deskripsi Pengujian**: Verifikasi admin dapat mengaktifkan tahun ajaran semester tertentu

**Kasus Uji**:
- Pilih tahun ajaran: 2024/2025 Ganjil
- Klik tombol "Aktifkan"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Tahun ajaran semester berhasil diaktifkan" dan badge "Aktif" muncul pada tahun ajaran yang dipilih, badge "Aktif" sebelumnya hilang dari tahun ajaran lama
- Jika gagal akan menampilkan konfirmasi "Terjadi kesalahan"

---

## 3. MANAJEMEN DATA SISWA

### Nama Uji: Mengelola Master Data Siswa / DFD 3.1 Menambah Data Siswa
**Deskripsi Pengujian**: Verifikasi admin dapat menambahkan data siswa baru

**Kasus Uji**:
- ID Siswa: S001
- Nama Siswa: Andi Prasetyo
- Tanggal Lahir: 2015-05-15
- Jenis Kelamin: L
- Password: siswa123
- Tahun Ajaran Masuk: 2024/2025

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Siswa berhasil ditambahkan" dan data siswa muncul di tabel dengan informasi lengkap
- Jika gagal akan menampilkan konfirmasi "ID Siswa sudah ada" jika ID duplikat

---

### Nama Uji: Mengelola Master Data Siswa / DFD 3.2 Mengubah Data Siswa
**Deskripsi Pengujian**: Verifikasi admin dapat mengubah data siswa yang sudah ada

**Kasus Uji**:
- Pilih siswa: Andi Prasetyo (S001)
- Ubah Nama: Andi Prasetyo Wijaya
- Ubah Password: newpassword123 (opsional)
- Klik tombol "Update"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Siswa berhasil diperbarui" dan perubahan data terlihat di tabel
- Jika gagal akan menampilkan konfirmasi "Siswa tidak ditemukan atau tidak ada perubahan"

---

### Nama Uji: Mengelola Master Data Siswa / DFD 3.3 Menghapus Data Siswa
**Deskripsi Pengujian**: Verifikasi admin dapat menghapus data siswa

**Kasus Uji**:
- Pilih siswa yang tidak memiliki relasi kelas: Budi Santoso (S002)
- Klik tombol "Delete"
- Konfirmasi penghapusan

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Siswa berhasil dihapus" dan data siswa hilang dari tabel
- Jika gagal akan menampilkan konfirmasi "Siswa masih terdaftar di kelas. Hapus dari kelas terlebih dahulu" jika siswa masih memiliki kelas aktif

---

## 4. MANAJEMEN DATA GURU

### Nama Uji: Mengelola Master Data Guru / DFD 4.1 Menambah Data Guru
**Deskripsi Pengujian**: Verifikasi admin dapat menambahkan data guru baru

**Kasus Uji**:
- ID Guru: G001
- Username: guru_budi
- Nama Guru: Budi Setiawan, S.Pd
- Email: budi.setiawan@sekolahbhinekas.sch.id
- Password: guru123

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Guru berhasil ditambahkan" dan data guru muncul di tabel dengan informasi lengkap
- Jika gagal akan menampilkan konfirmasi "ID Guru atau username sudah ada" jika ID/username duplikat

---

### Nama Uji: Mengelola Master Data Guru / DFD 4.2 Mengubah Data Guru
**Deskripsi Pengujian**: Verifikasi admin dapat mengubah data guru yang sudah ada

**Kasus Uji**:
- Pilih guru: Budi Setiawan (G001)
- Ubah Email: budi.s@sekolahbhinekas.sch.id
- Klik tombol "Update"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Guru berhasil diperbarui" dan perubahan data terlihat di tabel
- Jika gagal akan menampilkan konfirmasi "Guru tidak ditemukan atau tidak ada perubahan"

---

### Nama Uji: Mengelola Master Data Guru / DFD 4.3 Menghapus Data Guru
**Deskripsi Pengujian**: Verifikasi admin dapat menghapus data guru

**Kasus Uji**:
- Pilih guru yang tidak memiliki tugas mengajar: Siti Nurhaliza (G005)
- Klik tombol "Delete"
- Konfirmasi penghapusan

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Guru berhasil dihapus" dan data guru hilang dari tabel
- Jika gagal akan menampilkan konfirmasi "Guru masih memiliki tugas mengajar. Hapus tugas mengajar terlebih dahulu" jika guru masih mengajar

---

## 5. MANAJEMEN KELAS

### Nama Uji: Mengelola Master Data Kelas / DFD 5.1 Membuat Kelas Baru
**Deskripsi Pengujian**: Verifikasi admin dapat membuat kelas baru untuk tahun ajaran aktif

**Kasus Uji**:
- Tahun Ajaran Semester: 2024/2025 Ganjil (Aktif)
- Nama Kelas: Kelas 1A
- Wali Kelas: Budi Setiawan, S.Pd (G001)

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Kelas berhasil ditambahkan" dan kelas baru muncul di tabel dengan wali kelas yang ditunjuk
- Jika gagal akan menampilkan konfirmasi "Kelas sudah ada untuk tahun ajaran ini"

---

### Nama Uji: Mengelola Master Data Kelas / DFD 5.2 Mengubah Data Kelas
**Deskripsi Pengujian**: Verifikasi admin dapat mengubah informasi kelas

**Kasus Uji**:
- Pilih kelas: Kelas 1A
- Ubah Wali Kelas: Siti Nurhaliza, S.Pd (G002)
- Klik tombol "Update"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Kelas berhasil diperbarui" dan wali kelas berubah di tabel
- Jika gagal akan menampilkan konfirmasi "Kelas tidak ditemukan"

---

## 6. MANAJEMEN MATA PELAJARAN

### Nama Uji: Mengelola Master Data Mata Pelajaran / DFD 6.1 Menambah Mata Pelajaran
**Deskripsi Pengujian**: Verifikasi admin dapat menambahkan mata pelajaran baru

**Kasus Uji**:
- ID Mata Pelajaran: MP001
- Nama Mata Pelajaran: Matematika

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Mata pelajaran berhasil ditambahkan" dan mata pelajaran baru muncul di tabel
- Jika gagal akan menampilkan konfirmasi "ID Mata Pelajaran sudah ada"

---

## 7. ASSIGNMENT SISWA KE KELAS

### Nama Uji: Mengelola Siswa Kelas / DFD 7.1 Menambahkan Siswa ke Kelas
**Deskripsi Pengujian**: Verifikasi admin dapat menambahkan siswa ke kelas tertentu

**Kasus Uji**:
- Tahun Ajaran: 2024/2025 Ganjil
- Kelas: Kelas 1A
- Siswa: Andi Prasetyo (S001)

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Siswa berhasil ditambahkan ke kelas" dan siswa muncul di daftar siswa kelas tersebut
- Jika gagal akan menampilkan konfirmasi "Siswa sudah terdaftar di kelas ini" jika siswa sudah ada di kelas yang sama

---

### Nama Uji: Mengelola Siswa Kelas / DFD 7.2 Menghapus Siswa dari Kelas
**Deskripsi Pengujian**: Verifikasi admin dapat menghapus siswa dari kelas

**Kasus Uji**:
- Pilih siswa dari kelas: Andi Prasetyo (S001) dari Kelas 1A
- Klik tombol "Remove from Class"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Siswa berhasil dihapus dari kelas" dan siswa hilang dari daftar kelas
- Jika gagal akan menampilkan konfirmasi error

---

## 8. ASSIGNMENT GURU KE MATA PELAJARAN & KELAS

### Nama Uji: Mengelola Guru Mata Pelajaran Kelas / DFD 8.1 Assign Guru ke Mapel & Kelas
**Deskripsi Pengujian**: Verifikasi admin dapat menugaskan guru untuk mengajar mata pelajaran di kelas tertentu

**Kasus Uji**:
- Tahun Ajaran: 2024/2025 Ganjil
- Guru: Budi Setiawan, S.Pd (G001)
- Mata Pelajaran: Matematika (MP001)
- Kelas: Kelas 1A

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Guru berhasil ditugaskan" dan penugasan muncul di tabel dengan informasi lengkap
- Jika gagal akan menampilkan konfirmasi "Guru sudah ditugaskan untuk mata pelajaran dan kelas ini"

---

### Nama Uji: Mengelola Guru Mata Pelajaran Kelas / DFD 8.2 Hapus Assignment Guru
**Deskripsi Pengujian**: Verifikasi admin dapat menghapus tugas mengajar guru

**Kasus Uji**:
- Pilih assignment: Budi Setiawan - Matematika - Kelas 1A
- Klik tombol "Delete"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Penugasan berhasil dihapus" dan assignment hilang dari tabel
- Jika gagal akan menampilkan konfirmasi error

---

## 9. INPUT NILAI OLEH GURU

### Nama Uji: Input Nilai Siswa / DFD 9.1 Input Nilai TP (Tujuan Pembelajaran)
**Deskripsi Pengujian**: Verifikasi guru dapat menginput nilai TP untuk siswa

**Kasus Uji**:
- Login sebagai: Guru (Budi Setiawan)
- Pilih Assignment: Kelas 1A - Matematika
- Pilih Siswa: Andi Prasetyo
- Kolom TP: TP1
- Nilai: 85
- Deskripsi TP1: Penjumlahan Bilangan 1-20

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Nilai berhasil disimpan" dan nilai muncul di tabel dengan warna hijau jika ≥ KKM atau merah jika < KKM
- Jika gagal akan menampilkan konfirmasi "Gagal menyimpan nilai"

---

### Nama Uji: Input Nilai Siswa / DFD 9.2 Input Nilai UAS
**Deskripsi Pengujian**: Verifikasi guru dapat menginput nilai UAS untuk siswa

**Kasus Uji**:
- Login sebagai: Guru (Budi Setiawan)
- Pilih Assignment: Kelas 1A - Matematika
- Pilih Siswa: Andi Prasetyo
- Kolom: UAS
- Nilai: 90

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Nilai berhasil disimpan", nilai UAS muncul di tabel, dan nilai FINAL otomatis terhitung sebagai rata-rata dari semua TP dan UAS
- Jika gagal akan menampilkan konfirmasi "Gagal menyimpan nilai"

---

### Nama Uji: Input Nilai Siswa / DFD 9.3 Menambah Kolom TP Baru
**Deskripsi Pengujian**: Verifikasi guru dapat menambahkan kolom TP baru untuk mata pelajaran

**Kasus Uji**:
- Klik tombol "+ Add TP"
- Input Deskripsi TP2: Pengurangan Bilangan 1-20

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan kolom TP2 baru di tabel input nilai dengan deskripsi yang diinput
- Kolom baru tersedia untuk semua siswa di kelas tersebut

---

## 10. MANAJEMEN CAPAIAN PEMBELAJARAN (CP)

### Nama Uji: Mengelola Capaian Pembelajaran / DFD 10.1 Menambah CP Baru
**Deskripsi Pengujian**: Verifikasi guru dapat menambahkan capaian pembelajaran

**Kasus Uji**:
- Tahun Ajaran: 2024/2025 Ganjil
- Mata Pelajaran: Matematika
- Kelas: Kelas 1A
- Jenis CP: TP (Tujuan Pembelajaran)
- Urutan: 1
- Deskripsi: Siswa mampu menjumlahkan bilangan 1-20 dengan benar

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Capaian Pembelajaran berhasil ditambahkan" dan CP muncul di tabel
- Jika gagal akan menampilkan konfirmasi "CP sudah ada untuk urutan ini"

---

### Nama Uji: Mengelola Capaian Pembelajaran / DFD 10.2 Mengubah CP
**Deskripsi Pengujian**: Verifikasi guru dapat mengubah deskripsi CP

**Kasus Uji**:
- Pilih CP: TP1 - Matematika - Kelas 1A
- Ubah Deskripsi: Siswa mampu menjumlahkan dan mengurangkan bilangan 1-20 dengan benar
- Klik "Update"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Capaian Pembelajaran berhasil diperbarui" dan deskripsi berubah di tabel
- Jika gagal akan menampilkan konfirmasi error

---

## 11. REKAP NILAI

### Nama Uji: Melihat Rekap Nilai / DFD 11.1 View Rekap Nilai Siswa
**Deskripsi Pengujian**: Verifikasi guru dapat melihat rekap nilai seluruh siswa di kelasnya

**Kasus Uji**:
- Login sebagai: Guru (Budi Setiawan)
- Pilih Assignment: Kelas 1A - Matematika
- Klik menu "Rekap Nilai"

**Hasil yang diharapkan**:
- Sistem menampilkan tabel rekap nilai dengan kolom: No, Nama Siswa, TP1, TP2, ..., UAS, FINAL, Status (Lulus/Tidak Lulus)
- Nilai berwarna hijau jika ≥ KKM, merah jika < KKM
- Terdapat tombol "Export to PDF" dan "Export to Excel"

---

### Nama Uji: Export Rekap Nilai / DFD 11.2 Export Rekap ke PDF
**Deskripsi Pengujian**: Verifikasi guru dapat mengekspor rekap nilai ke format PDF

**Kasus Uji**:
- Dari halaman Rekap Nilai Kelas 1A - Matematika
- Klik tombol "Export to PDF"

**Hasil yang diharapkan**:
- Jika berhasil akan mendownload file PDF dengan nama "Rekap_Nilai_Kelas1A_Matematika_2024-2025.pdf"
- File PDF berisi header sekolah, informasi kelas & mapel, tabel nilai lengkap, dan tanda tangan wali kelas
- Jika gagal akan menampilkan konfirmasi error

---

### Nama Uji: Export Rekap Nilai / DFD 11.3 Export Rekap ke Excel
**Deskripsi Pengujian**: Verifikasi guru dapat mengekspor rekap nilai ke format Excel

**Kasus Uji**:
- Dari halaman Rekap Nilai Kelas 1A - Matematika
- Klik tombol "Export to Excel"

**Hasil yang diharapkan**:
- Jika berhasil akan mendownload file Excel dengan nama "Rekap_Nilai_Kelas1A_Matematika_2024-2025.xlsx"
- File Excel berisi sheet dengan data nilai dalam format tabel yang dapat diedit
- Jika gagal akan menampilkan konfirmasi error

---

## 12. ANALYTICS - SCHOOL ANALYTICS

### Nama Uji: View Analytics Sekolah / DFD 12.1 Statistik Umum Sekolah
**Deskripsi Pengujian**: Verifikasi admin dapat melihat statistik keseluruhan sekolah

**Kasus Uji**:
- Login sebagai: Admin
- Buka menu "Analytics"
- Tab: School Analytics

**Hasil yang diharapkan**:
- Sistem menampilkan dashboard analytics dengan:
  - Total Siswa Aktif
  - Total Guru
  - Total Kelas
  - Rata-rata Nilai Keseluruhan
  - Grafik batang per mata pelajaran
  - Tabel Detail Nilai per Kelas
- Data real-time sesuai tahun ajaran aktif

---

### Nama Uji: View Analytics Sekolah / DFD 12.2 Filter Analytics per Kelas
**Deskripsi Pengujian**: Verifikasi admin dapat memfilter analytics berdasarkan kelas tertentu

**Kasus Uji**:
- Dari halaman School Analytics
- Pilih filter Kelas: Kelas 1A
- Klik "Apply Filter"

**Hasil yang diharapkan**:
- Data analytics berubah menampilkan hanya data untuk Kelas 1A
- Grafik dan statistik ter-update sesuai filter
- Tabel detail hanya menampilkan siswa dari Kelas 1A

---

### Nama Uji: View Analytics Sekolah / DFD 12.3 Export Analytics ke PDF
**Deskripsi Pengujian**: Verifikasi admin dapat mengekspor laporan analytics ke PDF

**Kasus Uji**:
- Dari halaman School Analytics
- Klik tombol "Export to PDF"

**Hasil yang diharapkan**:
- Jika berhasil akan mendownload file PDF "School_Analytics_2024-2025.pdf" berisi laporan lengkap dengan grafik dan tabel
- Jika gagal akan menampilkan konfirmasi error

---

## 13. ANALYTICS - WALI KELAS

### Nama Uji: Analytics Wali Kelas / DFD 13.1 View Analytics Kelas yang Diwali
**Deskripsi Pengujian**: Verifikasi guru wali kelas dapat melihat analytics kelasnya

**Kasus Uji**:
- Login sebagai: Guru Wali Kelas (Budi Setiawan)
- Buka menu "Analytics"
- Tab: Wali Kelas

**Hasil yang diharapkan**:
- Sistem menampilkan analytics khusus untuk Kelas 1A (kelas yang diwali) dengan:
  - Total Siswa di kelas
  - Rata-rata nilai kelas per mata pelajaran
  - Grafik perbandingan nilai per siswa
  - Tabel ranking siswa
  - Status kelulusan siswa

---

## 14. KENAIKAN KELAS

### Nama Uji: Kenaikan Kelas / DFD 14.1 Proses Kenaikan Kelas Massal
**Deskripsi Pengujian**: Verifikasi admin dapat melakukan kenaikan kelas untuk seluruh siswa

**Kasus Uji**:
- Login sebagai: Admin
- Buka menu "Kenaikan Kelas"
- Tahun Ajaran Asal: 2024/2025 Ganjil
- Tahun Ajaran Tujuan: 2024/2025 Genap
- Pilih siswa dari Kelas 1A
- Tujuan: Kelas 2A
- Klik "Proses Kenaikan"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Kenaikan kelas berhasil diproses untuk X siswa"
- Siswa berpindah dari Kelas 1A ke Kelas 2A di tahun ajaran baru
- Data SiswaKelas ter-update dengan id_ta_semester dan id_kelas baru
- Jika gagal akan menampilkan konfirmasi error dengan detail siswa yang gagal

---

## 15. IMPORT/EXPORT DATA EXCEL

### Nama Uji: Import Data / DFD 15.1 Import Nilai dari Excel
**Deskripsi Pengujian**: Verifikasi guru dapat mengimport nilai dari file Excel

**Kasus Uji**:
- Login sebagai: Guru (Budi Setiawan)
- Buka menu "Input Nilai"
- Klik "Import from Excel"
- Upload file: template_nilai_kelas1a_matematika.xlsx (sesuai format template)

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "Data berhasil diimport: X nilai berhasil, Y nilai gagal"
- Nilai ter-update di database sesuai data Excel
- Jika gagal akan menampilkan konfirmasi "Format file tidak sesuai" atau "File tidak valid"

---

### Nama Uji: Export Data / DFD 15.2 Download Template Excel
**Deskripsi Pengujian**: Verifikasi guru dapat mendownload template Excel untuk import nilai

**Kasus Uji**:
- Dari halaman Input Nilai Kelas 1A - Matematika
- Klik tombol "Download Template"

**Hasil yang diharapkan**:
- Jika berhasil akan mendownload file Excel template dengan:
  - Kolom: ID Siswa, Nama Siswa, TP1, TP2, ..., UAS
  - Data siswa sudah terisi (ID dan Nama)
  - Kolom nilai kosong siap diisi
  - Sheet instructions berisi panduan pengisian

---

## 16. SETTING KKM

### Nama Uji: Setting KKM / DFD 16.1 Ubah KKM Mata Pelajaran
**Deskripsi Pengujian**: Verifikasi guru dapat mengubah nilai KKM untuk mata pelajaran

**Kasus Uji**:
- Login sebagai: Guru (Budi Setiawan)
- Buka halaman Input Nilai Kelas 1A - Matematika
- Klik tombol "KKM Settings"
- Ubah KKM TP: 75
- Ubah KKM UAS: 80
- Ubah KKM FINAL: 75
- Klik "Save"

**Hasil yang diharapkan**:
- Jika berhasil akan menampilkan konfirmasi "KKM berhasil diperbarui"
- Warna nilai di tabel berubah sesuai KKM baru (hijau jika ≥ KKM baru, merah jika < KKM baru)
- Jika gagal akan menampilkan konfirmasi error

---

## CATATAN PENGUJIAN

**Versi Aplikasi**: 1.0.0
**Tanggal Pengujian**: [Diisi saat testing]
**Tester**: [Diisi saat testing]
**Environment**: 
- Backend: Node.js + Express (Port 5000)
- Frontend: React (Port 3000)
- Database: SQLite (academic_dashboard.db)

**Status Pengujian**: [✓ PASS / ✗ FAIL]

---

© 2025 Sekolah Bhinekas - Sistem Informasi Akademik
