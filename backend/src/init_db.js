// backend/src/init_db.js
const { getDb } = require('./config/db');
const { createHash } = require('crypto'); // Untuk hashing SHA256
const { format, addDays } = require('date-fns'); // Untuk format tanggal dan manipulasi tanggal

// Helper untuk hashing password (sesuai dengan yang digunakan di Python hashlib.sha256)
function hashPasswordPythonStyle(password) {
    return createHash('sha256').update(password).digest('hex');
}

function initializeDatabase() {
    const db = getDb();

    // SQL untuk membuat tabel (sama seperti sebelumnya)
    const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS Admin (
            id_admin INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            nama TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Guru (
            id_guru INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            nama_guru TEXT NOT NULL,
            email TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS Siswa (
            id_siswa INTEGER PRIMARY KEY,
            nama_siswa TEXT NOT NULL,
            tanggal_lahir TEXT,
            jenis_kelamin TEXT,
            password_hash TEXT
        );

        CREATE TABLE IF NOT EXISTS TahunAjaranSemester (
            id_ta_semester INTEGER PRIMARY KEY AUTOINCREMENT,
            tahun_ajaran TEXT NOT NULL,
            semester TEXT NOT NULL,
            is_aktif BOOLEAN DEFAULT 0,
            UNIQUE (tahun_ajaran, semester)
        );

        CREATE TABLE IF NOT EXISTS Kelas (
            id_kelas INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_kelas TEXT NOT NULL,
            id_wali_kelas INTEGER,
            id_ta_semester INTEGER NOT NULL,
            FOREIGN KEY (id_wali_kelas) REFERENCES Guru(id_guru),
            FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester),
            UNIQUE (nama_kelas, id_ta_semester)
        );

        CREATE TABLE IF NOT EXISTS MataPelajaran (
            id_mapel INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_mapel TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS TipeNilai (
            id_tipe_nilai INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_tipe TEXT NOT NULL UNIQUE,
            deskripsi TEXT
        );

        CREATE TABLE IF NOT EXISTS SiswaKelas (
            id_siswa_kelas INTEGER PRIMARY KEY AUTOINCREMENT,
            id_siswa INTEGER NOT NULL,
            id_kelas INTEGER NOT NULL,
            id_ta_semester INTEGER NOT NULL,
            FOREIGN KEY (id_siswa) REFERENCES Siswa(id_siswa),
            FOREIGN KEY (id_kelas) REFERENCES Kelas(id_kelas),
            FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester),
            UNIQUE (id_siswa, id_kelas, id_ta_semester)
        );

        CREATE TABLE IF NOT EXISTS GuruMataPelajaranKelas (
            id_guru_mapel_kelas INTEGER PRIMARY KEY AUTOINCREMENT,
            id_guru INTEGER NOT NULL,
            id_mapel INTEGER NOT NULL,
            id_kelas INTEGER NOT NULL,
            id_ta_semester INTEGER NOT NULL,
            FOREIGN KEY (id_guru) REFERENCES Guru(id_guru),
            FOREIGN KEY (id_mapel) REFERENCES MataPelajaran(id_mapel),
            FOREIGN KEY (id_kelas) REFERENCES Kelas(id_kelas),
            FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester),
            UNIQUE (id_guru, id_mapel, id_kelas, id_ta_semester)
        );

        CREATE TABLE IF NOT EXISTS Nilai (
            id_nilai INTEGER PRIMARY KEY AUTOINCREMENT,
            id_siswa INTEGER NOT NULL,
            id_guru INTEGER NOT NULL,
            id_mapel INTEGER NOT NULL,
            id_kelas INTEGER NOT NULL,
            id_ta_semester INTEGER NOT NULL,
            id_tipe_nilai INTEGER NOT NULL,
            nilai REAL NOT NULL,
            tanggal_input TEXT NOT NULL,
            keterangan TEXT,
            FOREIGN KEY (id_siswa) REFERENCES Siswa(id_siswa),
            FOREIGN KEY (id_guru) REFERENCES Guru(id_guru),
            FOREIGN KEY (id_mapel) REFERENCES MataPelajaran(id_mapel),
            FOREIGN KEY (id_kelas) REFERENCES Kelas(id_kelas),
            FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester),
            FOREIGN KEY (id_tipe_nilai) REFERENCES TipeNilai(id_tipe_nilai)
        );
    `;

    db.exec(createTablesSQL, (err) => {
        if (err) {
            console.error("Error creating tables:", err.message);
        } else {
            console.log("Tables created successfully or already exist.");
            insertDummyData(db); // Panggil fungsi insert dummy data setelah tabel dibuat
        }
    });
}

async function insertDummyData(db) {
    // Fungsi bantuan untuk menjalankan query secara asinkron
    const runQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this.lastID || this.changes);
            });
        });
    };

    const getQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    };

    const allQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    try {
        // --- 1. Admin ---
        const adminCount = (await getQuery("SELECT COUNT(*) AS count FROM Admin")).count;
        if (adminCount === 0) {
            await runQuery("INSERT INTO Admin (username, password_hash, nama) VALUES (?, ?, ?)",
                ['admin', hashPasswordPythonStyle('admin123'), 'Super Admin']);
            console.log("Admin dummy ditambahkan: username 'admin', password 'admin123'");
        } else { console.log("Table Admin already contains data. Skipping dummy data insertion."); }

        // --- 2. Guru ---
        const guruCount = (await getQuery("SELECT COUNT(*) AS count FROM Guru")).count;
        if (guruCount === 0) {
            const teachers = [
                { username: 'budi.s', nama_guru: 'Pak Budi Santoso', email: 'budi.s@sekolah.com' },
                { username: 'ani.w', nama_guru: 'Ibu Ani Wijaya', email: 'ani.w@sekolah.com' },
                { username: 'candra.k', nama_guru: 'Pak Candra Kirana', email: 'candra.k@sekolah.com' },
                { username: 'dewi.a', nama_guru: 'Ibu Dewi Anggraini', email: 'dewi.a@sekolah.com' },
                { username: 'eko.p', nama_guru: 'Pak Eko Prasetyo', email: 'eko.p@sekolah.com' },
                { username: 'fitri.h', nama_guru: 'Ibu Fitri Handayani', email: 'fitri.h@sekolah.com' },
            ];
            for (const t of teachers) {
                await runQuery("INSERT INTO Guru (username, password_hash, nama_guru, email) VALUES (?, ?, ?, ?)",
                    [t.username, hashPasswordPythonStyle('guru123'), t.nama_guru, t.email]);
            }
            console.log(`${teachers.length} Guru dummy ditambahkan.`);
        } else { console.log("Table Guru already contains data. Skipping dummy data insertion."); }

        // --- 3. Siswa ---
        const siswaCount = (await getQuery("SELECT COUNT(*) AS count FROM Siswa")).count;
        if (siswaCount === 0) {
            const students = [];
            const names = [
                'Andi Pratama', 'Budi Cahyono', 'Citra Dewi', 'Dian Lestari', 'Eko Saputra',
                'Fajar Ramadhan', 'Gita Permata', 'Hadi Wijaya', 'Indah Sari', 'Joko Susanto',
                'Kartika Putri', 'Lukman Hakim', 'Maya Indah', 'Nanda Pratama', 'Olivia Zahra',
                'Putra Wijaya', 'Qonita Salma', 'Rizky Pratama', 'Siti Aminah', 'Taufik Hidayat',
                'Umi Kalsum', 'Vina Amelia', 'Wahyu Setiawan', 'Xena Putri', 'Yuni Lestari',
                'Zaki Abdullah', 'Aulia Rahman', 'Bayu Dirgantara', 'Cici Paramida', 'Dicky Chandra'
            ];
            for (let i = 0; i < names.length; i++) {
                const id = 1001 + i;
                const name = names[i];
                const gender = Math.random() < 0.5 ? 'L' : 'P';
                const birthDate = format(addDays(new Date(2008, 0, 1), Math.floor(Math.random() * 365 * 2)), 'yyyy-MM-dd'); // 2008-2010
                students.push({ id_siswa: id, nama_siswa: name, tanggal_lahir: birthDate, jenis_kelamin: gender });
            }
            for (const s of students) {
                await runQuery("INSERT INTO Siswa (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, password_hash) VALUES (?, ?, ?, ?, ?)",
                    [s.id_siswa, s.nama_siswa, s.tanggal_lahir, s.jenis_kelamin, hashPasswordPythonStyle('siswa123')]);
            }
            console.log(`${students.length} Siswa dummy ditambahkan.`);
        } else { console.log("Table Siswa already contains data. Skipping dummy data insertion."); }

        // --- 4. Mata Pelajaran ---
        const mapelCount = (await getQuery("SELECT COUNT(*) AS count FROM MataPelajaran")).count;
        if (mapelCount === 0) {
            const subjects = ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah', 'Geografi', 'Sosiologi', 'Ekonomi', 'Pendidikan Agama'];
            for (const s of subjects) {
                await runQuery("INSERT INTO MataPelajaran (nama_mapel) VALUES (?)", [s]);
            }
            console.log(`${subjects.length} Mata Pelajaran dummy ditambahkan.`);
        } else { console.log("Table MataPelajaran already contains data. Skipping dummy data insertion."); }

        // --- 5. Tipe Nilai ---
        const tipeNilaiCount = (await getQuery("SELECT COUNT(*) AS count FROM TipeNilai")).count;
        if (tipeNilaiCount === 0) {
            const gradeTypes = [
                { nama_tipe: 'Tugas Harian', deskripsi: 'Nilai tugas-tugas harian' },
                { nama_tipe: 'Quiz', deskripsi: 'Nilai quiz singkat' },
                { nama_tipe: 'UTS', deskripsi: 'Ujian Tengah Semester' },
                { nama_tipe: 'UAS', deskripsi: 'Ujian Akhir Semester' },
                { nama_tipe: 'Praktikum', deskripsi: 'Nilai praktikum' },
            ];
            for (const gt of gradeTypes) {
                await runQuery("INSERT INTO TipeNilai (nama_tipe, deskripsi) VALUES (?, ?)", [gt.nama_tipe, gt.deskripsi]);
            }
            console.log(`${gradeTypes.length} Tipe Nilai dummy ditambahkan.`);
        } else { console.log("Table TipeNilai already contains data. Skipping dummy data insertion."); }

        // --- 6. Tahun Ajaran & Semester ---
        const taSemesterCount = (await getQuery("SELECT COUNT(*) AS count FROM TahunAjaranSemester")).count;
        let activeTASemesterId = null;
        if (taSemesterCount === 0) {
            const taSemesters = [
                { tahun_ajaran: '2023/2024', semester: 'Ganjil', is_aktif: 0 },
                { tahun_ajaran: '2023/2024', semester: 'Genap', is_aktif: 0 },
                { tahun_ajaran: '2024/2025', semester: 'Ganjil', is_aktif: 1 }, // Set this as active
                { tahun_ajaran: '2024/2025', semester: 'Genap', is_aktif: 0 },
                { tahun_ajaran: '2025/2026', semester: 'Ganjil', is_aktif: 0 },
            ];
            for (const tas of taSemesters) {
                const id = await runQuery("INSERT INTO TahunAjaranSemester (tahun_ajaran, semester, is_aktif) VALUES (?, ?, ?)",
                    [tas.tahun_ajaran, tas.semester, tas.is_aktif]);
                if (tas.is_aktif) activeTASemesterId = id;
            }
            console.log(`${taSemesters.length} Tahun Ajaran & Semester dummy ditambahkan.`);
        } else {
            const activeTAS = await getQuery("SELECT id_ta_semester FROM TahunAjaranSemester WHERE is_aktif = 1");
            if (activeTAS) activeTASemesterId = activeTAS.id_ta_semester;
            console.log("Table TahunAjaranSemester already contains data. Skipping dummy data insertion.");
        }

        // --- 7. Kelas (untuk setiap semester yang relevan) ---
        const kelasCount = (await getQuery("SELECT COUNT(*) AS count FROM Kelas")).count;
        if (kelasCount === 0) {
            const allTeachers = await allQuery("SELECT id_guru, nama_guru FROM Guru");
            const allTASemesters = await allQuery("SELECT id_ta_semester, tahun_ajaran, semester FROM TahunAjaranSemester");

            const kelasNames = ['X A', 'X B', 'XI IPA 1', 'XI IPA 2', 'XI IPS 1', 'XI IPS 2', 'XII IPA 1', 'XII IPA 2', 'XII IPS 1', 'XII IPS 2'];
            let kelasMap = new Map(); // Map untuk menyimpan id_kelas berdasarkan nama dan semester

            for (const tas of allTASemesters) {
                const waliKelasIndex = Math.floor(Math.random() * allTeachers.length);
                const waliKelasId = allTeachers[waliKelasIndex].id_guru;
                
                for (const nama_kelas of kelasNames) {
                    const id = await runQuery("INSERT INTO Kelas (nama_kelas, id_wali_kelas, id_ta_semester) VALUES (?, ?, ?)",
                        [nama_kelas, waliKelasId, tas.id_ta_semester]);
                    kelasMap.set(`${nama_kelas}-${tas.id_ta_semester}`, id);
                }
            }
            console.log(`${kelasNames.length * allTASemesters.length} Kelas dummy ditambahkan.`);
        } else { console.log("Table Kelas already contains data. Skipping dummy data insertion."); }

        // --- 8. SiswaKelas (penugasan siswa ke kelas) ---
        const siswaKelasCount = (await getQuery("SELECT COUNT(*) AS count FROM SiswaKelas")).count;
        if (siswaKelasCount === 0) {
            const allStudents = await allQuery("SELECT id_siswa FROM Siswa");
            const allKelas = await allQuery("SELECT id_kelas, nama_kelas, id_ta_semester FROM Kelas");

            // Untuk setiap siswa, tugaskan ke satu kelas per semester
            for (const student of allStudents) {
                const currentYear = new Date().getFullYear();
                
                // Asumsikan siswa dimulai dari kelas X di tahun ajaran awal dummy data (misal 2023/2024 Ganjil)
                // Dan naik kelas setiap tahun
                for (const tas of allTASemesters) {
                    let targetKelasName = '';
                    if (tas.tahun_ajaran === '2023/2024' && tas.semester === 'Ganjil') {
                        targetKelasName = 'X A'; // Asumsi semua siswa masuk X A di awal
                    } else if (tas.tahun_ajaran === '2023/2024' && tas.semester === 'Genap') {
                        targetKelasName = 'X A'; // Tetap di X A
                    } else if (tas.tahun_ajaran === '2024/2025' && tas.semester === 'Ganjil') {
                        targetKelasName = 'XI IPA 1'; // Naik ke XI IPA 1
                    } else if (tas.tahun_ajaran === '2024/2025' && tas.semester === 'Genap') {
                        targetKelasName = 'XI IPA 1'; // Tetap di XI IPA 1
                    } else if (tas.tahun_ajaran === '2025/2026' && tas.semester === 'Ganjil') {
                        targetKelasName = 'XII IPA 1'; // Naik ke XII IPA 1
                    }

                    if (targetKelasName) {
                        const targetKelas = allKelas.find(k => k.nama_kelas === targetKelasName && k.id_ta_semester === tas.id_ta_semester);
                        if (targetKelas) {
                            try {
                                await runQuery("INSERT INTO SiswaKelas (id_siswa, id_kelas, id_ta_semester) VALUES (?, ?, ?)",
                                    [student.id_siswa, targetKelas.id_kelas, tas.id_ta_semester]);
                            } catch (e) {
                                // console.warn(`Siswa ${student.id_siswa} sudah di kelas ${targetKelasName} untuk TA ${tas.tahun_ajaran} ${tas.semester}`);
                            }
                        }
                    }
                }
            }
            console.log(`Siswa ditugaskan ke Kelas untuk berbagai semester.`);
        } else { console.log("Table SiswaKelas already contains data. Skipping dummy data insertion."); }

        // --- 9. GuruMataPelajaranKelas (penugasan guru ke mapel dan kelas) ---
        const guruMapelKelasCount = (await getQuery("SELECT COUNT(*) AS count FROM GuruMataPelajaranKelas")).count;
        if (guruMapelKelasCount === 0) {
            const allTeachers = await allQuery("SELECT id_guru FROM Guru");
            const allSubjects = await allQuery("SELECT id_mapel FROM MataPelajaran");
            const allKelas = await allQuery("SELECT id_kelas, id_ta_semester FROM Kelas");

            // Contoh penugasan: Setiap guru mengajar 2-3 mapel di beberapa kelas
            for (const teacher of allTeachers) {
                const assignedSubjects = new Set();
                while (assignedSubjects.size < 2 + Math.floor(Math.random() * 2)) { // 2-3 subjects
                    const randomSubject = allSubjects[Math.floor(Math.random() * allSubjects.length)];
                    assignedSubjects.add(randomSubject.id_mapel);
                }

                for (const subjectId of Array.from(assignedSubjects)) {
                    // Tugaskan guru ini ke mapel ini di 2-4 kelas acak untuk setiap semester
                    const assignedClassesForSubject = new Set();
                    while (assignedClassesForSubject.size < 2 + Math.floor(Math.random() * 3)) { // 2-4 classes
                        const randomKelas = allKelas[Math.floor(Math.random() * allKelas.length)];
                        const assignmentKey = `${randomKelas.id_kelas}-${randomKelas.id_ta_semester}`;
                        if (!assignedClassesForSubject.has(assignmentKey)) {
                            assignedClassesForSubject.add(assignmentKey);
                            try {
                                await runQuery("INSERT INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)",
                                    [teacher.id_guru, subjectId, randomKelas.id_kelas, randomKelas.id_ta_semester]);
                            } catch (e) {
                                // console.warn(`Guru ${teacher.id_guru} sudah ditugaskan untuk mapel ${subjectId} di kelas ${randomKelas.id_kelas} TA ${randomKelas.id_ta_semester}`);
                            }
                        }
                    }
                }
            }
            console.log(`Guru ditugaskan ke Mata Pelajaran dan Kelas.`);
        } else { console.log("Table GuruMataPelajaranKelas already contains data. Skipping dummy data insertion."); }

        // --- 10. Nilai (contoh nilai untuk beberapa siswa) ---
        const nilaiCount = (await getQuery("SELECT COUNT(*) AS count FROM Nilai")).count;
        if (nilaiCount === 0) {
            const allStudents = await allQuery("SELECT id_siswa FROM Siswa");
            const allGuruMapelKelas = await allQuery("SELECT id_guru, id_mapel, id_kelas, id_ta_semester FROM GuruMataPelajaranKelas");
            const allTipeNilai = await allQuery("SELECT id_tipe_nilai FROM TipeNilai");

            // Untuk setiap siswa, berikan beberapa nilai acak dari penugasan guru yang ada
            for (const student of allStudents) {
                const relevantAssignments = allGuruMapelKelas.filter(gmpk => 
                    allKelas.some(k => k.id_kelas === gmpk.id_kelas && 
                        allStudents.some(s => s.id_siswa === student.id_siswa && 
                            allKelas.find(kl => kl.id_kelas === gmpk.id_kelas && kl.id_ta_semester === gmpk.id_ta_semester) // Pastikan kelas ada di semester itu
                        )
                    )
                );

                const assignedGrades = new Set();
                for (let i = 0; i < 3; i++) { // Berikan 3 nilai per siswa per mapel yang diajarkan
                    if (relevantAssignments.length === 0 || allTipeNilai.length === 0) break;

                    const randomAssignment = relevantAssignments[Math.floor(Math.random() * relevantAssignments.length)];
                    const randomTipeNilai = allTipeNilai[Math.floor(Math.random() * allTipeNilai.length)];
                    
                    const gradeKey = `${student.id_siswa}-${randomAssignment.id_mapel}-${randomAssignment.id_kelas}-${randomTipeNilai.id_tipe_nilai}-${randomAssignment.id_ta_semester}`;
                    if (!assignedGrades.has(gradeKey)) {
                        assignedGrades.add(gradeKey);
                        const score = Math.floor(Math.random() * 50) + 50; // Nilai antara 50-100
                        const inputDate = format(addDays(new Date(), -Math.floor(Math.random() * 30)), 'yyyy-MM-dd HH:mm:ss');

                        try {
                            await runQuery(`
                                INSERT INTO Nilai (id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, id_tipe_nilai, nilai, tanggal_input, keterangan)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [
                                student.id_siswa,
                                randomAssignment.id_guru,
                                randomAssignment.id_mapel,
                                randomAssignment.id_kelas,
                                randomAssignment.id_ta_semester,
                                randomTipeNilai.id_tipe_nilai,
                                score,
                                inputDate,
                                `Nilai dummy`
                            ]);
                        } catch (e) {
                            // console.warn(`Gagal memasukkan nilai untuk siswa ${student.id_siswa}: ${e.message}`);
                        }
                    }
                }
            }
            console.log(`Nilai dummy ditambahkan untuk beberapa siswa.`);
        } else { console.log("Table Nilai already contains data. Skipping dummy data insertion."); }

    } catch (error) {
        console.error("Error inserting dummy data:", error);
    } finally {
        // Tidak menutup koneksi di sini karena db.getDb() mengembalikan instance singleton.
        // Koneksi akan ditutup saat proses Node.js berakhir.
    }
}

// Panggil fungsi inisialisasi saat skrip dijalankan
initializeDatabase();
