# Sistem Informasi Akademik Sekolah Dasar

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Deskripsi Proyek

Proyek ini adalah prototipe sistem manajemen akademik siswa berbasis web yang dirancang untuk memfasilitasi pengelolaan data siswa, guru, kelas, mata pelajaran, dan nilai. Sistem ini memiliki dua peran utama: **Admin** untuk manajemen data master dan konfigurasi awal, serta **Guru** untuk input dan rekap nilai siswa.

Tujuan utama proyek ini adalah untuk menunjukkan alur kerja aplikasi web modern dengan pemisahan *frontend* dan *backend*, serta memberikan dasar yang kuat untuk pengembangan fitur-fitur akademik yang lebih kompleks di masa mendatang.

## Fitur Utama

### Untuk Peran Admin:

* **Manajemen Tahun Ajaran & Semester:** Menambah, melihat, dan mengatur tahun ajaran/semester aktif.
* **Manajemen Siswa:** Menambah, melihat, mengedit, dan menghapus data siswa.
* **Manajemen Guru:** Menambah, melihat, mengedit, dan menghapus data guru.
* **Manajemen Kelas:** Menambah, melihat, dan mengelola kelas untuk tahun ajaran/semester aktif, termasuk penetapan wali kelas.
* **Manajemen Mata Pelajaran:** Menambah dan melihat daftar mata pelajaran.
* **Manajemen Tipe Nilai:** Menambah dan melihat kategori penilaian (Tugas, UTS, UAS, dll.).
* **Penugasan Siswa ke Kelas:** Menugaskan siswa ke kelas tertentu untuk tahun ajaran/semester aktif.
* **Penugasan Guru ke Mata Pelajaran & Kelas:** Menugaskan guru untuk mengajar mata pelajaran di kelas tertentu.
* **Kenaikan Kelas:** Mempromosikan siswa dari kelas asal ke kelas tujuan untuk tahun ajaran/semester baru.

### Untuk Peran Guru:

* **Input Nilai:** Memasukkan dan memperbarui nilai siswa untuk mata pelajaran yang diajarkan di kelas yang ditugaskan.
* **Rekap Nilai:** Melihat rekapitulasi nilai siswa per mata pelajaran dan kelas.

## Teknologi yang Digunakan

* **Frontend:**
    * **React.js:** Library JavaScript untuk membangun antarmuka pengguna yang interaktif.
    * **HTML, CSS:** Struktur dan gaya dasar aplikasi.
    * **JavaScript (ES6+):** Logika sisi klien.
* **Backend:**
    * **Node.js:** Lingkungan runtime JavaScript sisi server.
    * **Express.js:** Framework web minimalis untuk Node.js, digunakan untuk membangun API RESTful.
    * **SQLite3:** Database relasional berbasis file yang ringan, digunakan untuk penyimpanan data.
    * **`dotenv`:** Untuk mengelola variabel lingkungan.
    * **`cors`:** Untuk mengizinkan komunikasi lintas asal antara frontend dan backend.
    * **`date-fns`:** Untuk manipulasi dan format tanggal.
    * **`crypto` (built-in Node.js):** Untuk hashing password (SHA256).

## Struktur Proyek

Proyek ini mengadopsi arsitektur **Client-Server** dengan pemisahan yang jelas antara frontend dan backend.

```
my-academic-app/
├── backend/            # Aplikasi sisi server (API)
│   ├── src/
│   │   ├── config/     # Konfigurasi database
│   │   ├── controllers/# Logika bisnis dan interaksi database
│   │   ├── routes/     # Definisi API endpoints
│   │   └── server.js   # Titik masuk backend
│   ├── academic_dashboard.db # File database SQLite
│   ├── package.json    # Dependensi backend
│   └── .env            # Variabel lingkungan backend (contoh: PORT)
└── frontend/           # Aplikasi sisi klien (UI)
    ├── public/
    ├── src/
    │   ├── api/        # Fungsi untuk memanggil API backend
    │   ├── components/ # Komponen UI yang dapat digunakan kembali
    │   ├── features/   # Fitur-fitur spesifik (misal: admin, guru)
    │   │   ├── admin/
    │   │   └── guru/
    │   ├── pages/      # Komponen untuk setiap halaman utama
    │   ├── App.js      # Komponen utama dan routing frontend
    │   ├── index.js    # Titik masuk frontend
    │   └── index.css   # Styling global
    ├── package.json    # Dependensi frontend
    └── .env            # Variabel lingkungan frontend (contoh: URL API backend)
```

## Memulai Proyek (Untuk Dosen/Kontributor)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di lingkungan lokal Anda.

### Prasyarat

Pastikan Anda telah menginstal yang berikut ini di sistem Anda:

* **Node.js** (versi 14.x atau lebih tinggi, direkomendasikan 18.x atau 20.x)
    * Anda dapat mengunduhnya dari [nodejs.org](https://nodejs.org/).
* **npm** (Node Package Manager, biasanya terinstal bersama Node.js)
* **Git** (untuk mengkloning repositori)

### 1. Kloning Repositori

Buka terminal atau Command Prompt dan kloning repositori ini:

```bash
git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
cd your-repository-name # Ganti dengan nama folder proyek Anda jika berbeda
```

### 2. Pengaturan Backend (Node.js)

Navigasikan ke direktori `backend`, instal dependensi, dan inisialisasi database.

```bash
cd backend
npm install
```

**Inisialisasi Database (Penting! Lakukan HANYA SEKALI):**

Proyek ini menggunakan SQLite, dan database akan dibuat serta diisi dengan data dummy saat skrip inisialisasi dijalankan.

```bash
node src/init_db.js
```

Anda akan melihat pesan di konsol yang menunjukkan tabel dibuat dan data dummy ditambahkan.

**Memulai Server Backend:**

Setelah database diinisialisasi, Anda dapat memulai server backend:

```bash
npm start
# Atau untuk mode pengembangan dengan hot-reloading:
# npm run dev
```

Server akan berjalan di `http://localhost:5000`. Pastikan tidak ada error di terminal.

### 3. Pengaturan Frontend (React.js)

Buka terminal **baru** (biarkan terminal backend tetap berjalan) dan navigasikan ke direktori `frontend`.

```bash
cd ../frontend # Kembali ke folder root proyek, lalu masuk ke frontend
npm install
```

**Memulai Aplikasi Frontend:**

```bash
npm start
```

Aplikasi frontend akan terbuka di browser Anda (biasanya di `http://localhost:3000`).

### 4. Mengakses Aplikasi

Setelah kedua server (backend dan frontend) berjalan, Anda dapat mengakses aplikasi di browser Anda:

* **Frontend (Aplikasi Web):** `http://localhost:3000`
* **Backend (API Testing):** `http://localhost:5000` (Anda bisa menguji endpoint API secara langsung di browser atau menggunakan Postman/Insomnia)

## Kredensial Login (Data Dummy)

Berikut adalah kredensial login yang dibuat secara otomatis oleh `init_db.js`:

* **Admin:**
    * Username: `admin`
    * Password: `admin123`
    * Nama di Dashboard: `Super Admin` (jika Anda mengubahnya di DB Browser)
* **Guru:**
    * Username: `budi.s`
    * Password: `guru123`
    * (Ada juga guru lain seperti `ani.w`, `candra.k`, dll., dengan password yang sama)
* **Siswa:**
    * Username: `Andi Pratama`
    * Password: `siswa123`
    * (Ada banyak siswa lain dengan nama yang berbeda, semua dengan password yang sama)

## Konsep Penting untuk Kolaborasi

* **Arsitektur Client-Server:** Frontend (React) dan Backend (Node.js) adalah aplikasi terpisah yang berkomunikasi melalui API HTTP.
* **API RESTful:** Backend menyediakan API yang terstruktur menggunakan prinsip REST (GET, POST, PUT, DELETE).
* **Manajemen State React:** Frontend menggunakan `useState`, `useEffect`, dan `localStorage` (untuk status login) untuk mengelola data dan UI.
* **SQLite sebagai Database:** Database disimpan dalam file `academic_dashboard.db` di folder `backend/`. Untuk pengembangan lokal, ini mudah. Untuk deployment, pertimbangkan database server (PostgreSQL/MySQL).
* **Variabel Lingkungan (`.env`):** Konfigurasi sensitif atau yang berubah antar lingkungan disimpan di file `.env` dan dimuat menggunakan `dotenv`. File ini **diabaikan oleh Git** untuk keamanan.

## Panduan Kontribusi

Kami sangat menghargai kontribusi Anda pada proyek ini! Ikuti langkah-langkah berikut:

1.  **Buat Branch Baru:**
    ```bash
    git checkout -b feature/nama-fitur-anda
    ```
2.  **Lakukan Perubahan:** Tulis kode Anda, pastikan mengikuti gaya kode yang ada.
3.  **Uji Perubahan:** Pastikan fitur baru Anda berfungsi dengan baik dan tidak merusak fitur yang sudah ada.
4.  **Commit Perubahan:**
    ```bash
    git add .
    git commit -m "feat: Menambahkan fitur [nama fitur]" # Gunakan Conventional Commits
    ```
5.  **Push ke Branch Anda:**
    ```bash
    git push origin feature/nama-fitur-anda
    ```
6.  **Buat Pull Request (PR):** Buka Pull Request di GitHub dari branch Anda ke branch `main`. Jelaskan perubahan yang Anda buat secara detail.
