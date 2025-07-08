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

    // SQL untuk membuat tabel
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
            password_hash TEXT,
            tahun_ajaran_masuk TEXT
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

        CREATE TABLE IF NOT EXISTS CapaianPembelajaran (
            id_cp INTEGER PRIMARY KEY AUTOINCREMENT,
            id_mapel INTEGER NOT NULL,
            kode_cp TEXT,
            deskripsi_cp TEXT NOT NULL,
            FOREIGN KEY (id_mapel) REFERENCES MataPelajaran(id_mapel),
            UNIQUE (id_mapel, kode_cp)
        );

        CREATE TABLE IF NOT EXISTS SiswaCapaianPembelajaran (
            id_siswa_cp INTEGER PRIMARY KEY AUTOINCREMENT,
            id_siswa INTEGER NOT NULL,
            id_cp INTEGER NOT NULL,
            id_guru INTEGER NOT NULL,
            id_ta_semester INTEGER NOT NULL,
            status_capaian TEXT NOT NULL,
            tanggal_penilaian TEXT NOT NULL,
            catatan TEXT,
            FOREIGN KEY (id_siswa) REFERENCES Siswa(id_siswa),
            FOREIGN KEY (id_cp) REFERENCES CapaianPembelajaran(id_cp),
            FOREIGN KEY (id_guru) REFERENCES Guru(id_guru),
            FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester),
            UNIQUE (id_siswa, id_cp, id_ta_semester)
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
            const students = [
                { id_siswa: 1001, nama_siswa: 'Andi Pratama', tanggal_lahir: '2008-03-15', jenis_kelamin: 'L', tahun_ajaran_masuk: '2023/2024' },
                { id_siswa: 1002, nama_siswa: 'Budi Cahyono', tanggal_lahir: '2008-07-22', jenis_kelamin: 'L', tahun_ajaran_masuk: '2023/2024' },
                { id_siswa: 1003, nama_siswa: 'Citra Dewi', tanggal_lahir: '2009-01-10', jenis_kelamin: 'P', tahun_ajaran_masuk: '2023/2024' },
                { id_siswa: 1004, nama_siswa: 'Dian Lestari', tanggal_lahir: '2009-05-01', jenis_kelamin: 'P', tahun_ajaran_masuk: '2023/2024' },
                { id_siswa: 1005, nama_siswa: 'Eko Saputra', tanggal_lahir: '2008-11-20', jenis_kelamin: 'L', tahun_ajaran_masuk: '2023/2024' },
            ];
            for (const s of students) {
                await runQuery("INSERT INTO Siswa (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, password_hash, tahun_ajaran_masuk) VALUES (?, ?, ?, ?, ?, ?)",
                    [s.id_siswa, s.nama_siswa, s.tanggal_lahir, s.jenis_kelamin, hashPasswordPythonStyle('siswa123'), s.tahun_ajaran_masuk]);
            }
            console.log(`${students.length} Siswa dummy ditambahkan.`);
        } else { console.log("Table Siswa already contains data. Skipping dummy data insertion."); }

        // --- 4. Mata Pelajaran ---
        const mapelCount = (await getQuery("SELECT COUNT(*) AS count FROM MataPelajaran")).count;
        if (mapelCount === 0) {
            const subjects = ['Matematika', 'Fisika', 'Bahasa Indonesia'];
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
                { nama_tipe: 'UTS', deskripsi: 'Ujian Tengah Semester' },
                { nama_tipe: 'UAS', deskripsi: 'Ujian Akhir Semester' },
            ];
            for (const gt of gradeTypes) {
                await runQuery("INSERT INTO TipeNilai (nama_tipe, deskripsi) VALUES (?, ?)", [gt.nama_tipe, gt.deskripsi]);
            }
            console.log(`${gradeTypes.length} Tipe Nilai dummy ditambahkan.`);
        } else { console.log("Table TipeNilai already contains data. Skipping dummy data insertion."); }

        // --- 6. Tahun Ajaran & Semester ---
        const taSemesterCount = (await getQuery("SELECT COUNT(*) AS count FROM TahunAjaranSemester")).count;
        let activeTASemesterId = null;
        let allTASemesters = [];
        if (taSemesterCount === 0) {
            const taSemesters = [
                { tahun_ajaran: '2023/2024', semester: 'Ganjil', is_aktif: 0 },
                { tahun_ajaran: '2024/2025', semester: 'Ganjil', is_aktif: 1 }, // Set this as active
            ];
            for (const tas of taSemesters) {
                const id = await runQuery("INSERT INTO TahunAjaranSemester (tahun_ajaran, semester, is_aktif) VALUES (?, ?, ?)",
                    [tas.tahun_ajaran, tas.semester, tas.is_aktif]);
                if (tas.is_aktif) activeTASemesterId = id;
            }
            allTASemesters = await allQuery("SELECT id_ta_semester, tahun_ajaran, semester FROM TahunAjaranSemester");
            console.log(`${taSemesters.length} Tahun Ajaran & Semester dummy ditambahkan.`);
        } else {
            allTASemesters = await allQuery("SELECT id_ta_semester, tahun_ajaran, semester FROM TahunAjaranSemester");
            const activeTAS = await getQuery("SELECT id_ta_semester FROM TahunAjaranSemester WHERE is_aktif = 1");
            if (activeTAS) activeTASemesterId = activeTAS.id_ta_semester;
            console.log("Table TahunAjaranSemester already contains data. Skipping dummy data insertion.");
        }

        // --- 7. Kelas ---
        const kelasCount = (await getQuery("SELECT COUNT(*) AS count FROM Kelas")).count;
        if (kelasCount === 0) {
            const allTeachers = await allQuery("SELECT id_guru FROM Guru");
            const kelasData = [];
            const kelasNames = ['X A', 'XI IPA 1'];

            for (const tas of allTASemesters) {
                if (allTeachers.length > 0) {
                    const waliKelasId = allTeachers[0].id_guru; // Ambil guru pertama sebagai wali kelas
                    for (const nama_kelas of kelasNames) {
                        kelasData.push({ nama_kelas, id_wali_kelas: waliKelasId, id_ta_semester: tas.id_ta_semester });
                    }
                }
            }
            for (const k of kelasData) {
                await runQuery("INSERT INTO Kelas (nama_kelas, id_wali_kelas, id_ta_semester) VALUES (?, ?, ?)",
                    [k.nama_kelas, k.id_wali_kelas, k.id_ta_semester]);
            }
            console.log(`${kelasData.length} Kelas dummy ditambahkan.`);
        } else { console.log("Table Kelas already contains data. Skipping dummy data insertion."); }

        // --- 8. SiswaKelas ---
        const siswaKelasCount = (await getQuery("SELECT COUNT(*) AS count FROM SiswaKelas")).count;
        if (siswaKelasCount === 0) {
            const allStudents = await allQuery("SELECT id_siswa FROM Siswa");
            const allKelas = await allQuery("SELECT id_kelas, nama_kelas, id_ta_semester FROM Kelas");

            // Assign all students to 'X A' for 2023/2024 Ganjil, and 'XI IPA 1' for 2024/2025 Ganjil
            const kelasXA_2023 = allKelas.find(k => k.nama_kelas === 'X A' && k.id_ta_semester === allTASemesters.find(t => t.tahun_ajaran === '2023/2024' && t.semester === 'Ganjil')?.id_ta_semester);
            const kelasXI_2024 = allKelas.find(k => k.nama_kelas === 'XI IPA 1' && k.id_ta_semester === allTASemesters.find(t => t.tahun_ajaran === '2024/2025' && t.semester === 'Ganjil')?.id_ta_semester);

            for (const student of allStudents) {
                if (kelasXA_2023) {
                    try {
                        await runQuery("INSERT INTO SiswaKelas (id_siswa, id_kelas, id_ta_semester) VALUES (?, ?, ?)",
                            [student.id_siswa, kelasXA_2023.id_kelas, kelasXA_2023.id_ta_semester]);
                    } catch (e) { /* ignore unique constraint */ }
                }
                if (kelasXI_2024) {
                    try {
                        await runQuery("INSERT INTO SiswaKelas (id_siswa, id_kelas, id_ta_semester) VALUES (?, ?, ?)",
                            [student.id_siswa, kelasXI_2024.id_kelas, kelasXI_2024.id_ta_semester]);
                    } catch (e) { /* ignore unique constraint */ }
                }
            }
            console.log(`Siswa ditugaskan ke Kelas.`);
        } else { console.log("Table SiswaKelas already contains data. Skipping dummy data insertion."); }

        // --- 9. GuruMataPelajaranKelas ---
        const guruMapelKelasCount = (await getQuery("SELECT COUNT(*) AS count FROM GuruMataPelajaranKelas")).count;
        if (guruMapelKelasCount === 0) {
            const allTeachers = await allQuery("SELECT id_guru FROM Guru");
            const allSubjects = await allQuery("SELECT id_mapel, nama_mapel FROM MataPelajaran");
            const allKelas = await allQuery("SELECT id_kelas, nama_kelas, id_ta_semester FROM Kelas");

            const budi = allTeachers.find(t => t.nama_guru === 'Pak Budi Santoso');
            const ani = allTeachers.find(t => t.nama_guru === 'Ibu Ani Wijaya');

            const matematika = allSubjects.find(m => m.nama_mapel === 'Matematika');
            const fisika = allSubjects.find(m => m.nama_mapel === 'Fisika');
            const bahasaIndo = allSubjects.find(m => m.nama_mapel === 'Bahasa Indonesia');

            const kelasXA_2024 = allKelas.find(k => k.nama_kelas === 'X A' && k.id_ta_semester === allTASemesters.find(t => t.tahun_ajaran === '2024/2025' && t.semester === 'Ganjil')?.id_ta_semester);
            const kelasXI_2024 = allKelas.find(k => k.nama_kelas === 'XI IPA 1' && k.id_ta_semester === allTASemesters.find(t => t.tahun_ajaran === '2024/2025' && t.semester === 'Ganjil')?.id_ta_semester);

            if (budi && matematika && kelasXA_2024) {
                await runQuery("INSERT INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)",
                    [budi.id_guru, matematika.id_mapel, kelasXA_2024.id_kelas, kelasXA_2024.id_ta_semester]);
            }
            if (ani && fisika && kelasXI_2024) {
                await runQuery("INSERT INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)",
                    [ani.id_guru, fisika.id_mapel, kelasXI_2024.id_kelas, kelasXI_2024.id_ta_semester]);
            }
            if (budi && bahasaIndo && kelasXA_2024) {
                await runQuery("INSERT INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)",
                    [budi.id_guru, bahasaIndo.id_mapel, kelasXA_2024.id_kelas, kelasXA_2024.id_ta_semester]);
            }
            console.log(`Guru ditugaskan ke Mata Pelajaran dan Kelas.`);
        } else { console.log("Table GuruMataPelajaranKelas already contains data. Skipping dummy data insertion."); }

        // --- 10. Nilai ---
        const nilaiCount = (await getQuery("SELECT COUNT(*) AS count FROM Nilai")).count;
        if (nilaiCount === 0) {
            const allStudents = await allQuery("SELECT id_siswa FROM Siswa");
            const allGuruMapelKelas = await allQuery("SELECT id_guru, id_mapel, id_kelas, id_ta_semester FROM GuruMataPelajaranKelas");
            const allTipeNilai = await allQuery("SELECT id_tipe_nilai, nama_tipe FROM TipeNilai");

            const activeTASemester = allTASemesters.find(t => t.is_aktif);
            const kelasXA_2024_id = allKelas.find(k => k.nama_kelas === 'X A' && k.id_ta_semester === activeTASemester?.id_ta_semester)?.id_kelas;
            const matematika_id = allSubjects.find(m => m.nama_mapel === 'Matematika')?.id_mapel;
            const tugasHarian_id = allTipeNilai.find(t => t.nama_tipe === 'Tugas Harian')?.id_tipe_nilai;
            const uts_id = allTipeNilai.find(t => t.nama_tipe === 'UTS')?.id_tipe_nilai;

            if (activeTASemester && kelasXA_2024_id && matematika_id && tugasHarian_id && uts_id) {
                const budi = await getQuery("SELECT id_guru FROM Guru WHERE username = 'budi.s'");
                const andi = allStudents.find(s => s.nama_siswa === 'Andi Pratama');
                const budiId = budi?.id_guru;
                const andiId = andi?.id_siswa;

                if (budiId && andiId) {
                    await runQuery(`
                        INSERT INTO Nilai (id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, id_tipe_nilai, nilai, tanggal_input, keterangan)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [andiId, budiId, matematika_id, kelasXA_2024_id, activeTASemester.id_ta_semester, tugasHarian_id, 85.5, format(new Date(), 'yyyy-MM-dd HH:mm:ss'), 'Tugas 1']);
                    await runQuery(`
                        INSERT INTO Nilai (id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, id_tipe_nilai, nilai, tanggal_input, keterangan)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [andiId, budiId, matematika_id, kelasXA_2024_id, activeTASemester.id_ta_semester, uts_id, 78, format(new Date(), 'yyyy-MM-dd HH:mm:ss'), 'UTS Ganjil']);
                }
            }
            console.log(`Nilai dummy ditambahkan untuk beberapa siswa.`);
        } else { console.log("Table Nilai already contains data. Skipping dummy data insertion."); }

        // --- 11. Capaian Pembelajaran (CP) ---
        const cpCount = (await getQuery("SELECT COUNT(*) AS count FROM CapaianPembelajaran")).count;
        if (cpCount === 0) {
            const allSubjects = await allQuery("SELECT id_mapel, nama_mapel FROM MataPelajaran");
            const cpsData = [];
            
            const matematika = allSubjects.find(m => m.nama_mapel === 'Matematika');
            const fisika = allSubjects.find(m => m.nama_mapel === 'Fisika');

            if (matematika) {
                cpsData.push({ id_mapel: matematika.id_mapel, kode_cp: 'MTK-1.1', deskripsi_cp: 'Memahami konsep bilangan bulat dan operasinya.' });
            }
            if (fisika) {
                cpsData.push({ id_mapel: fisika.id_mapel, kode_cp: 'FIS-1.1', deskripsi_cp: 'Memahami hukum Newton tentang gerak.' });
            }

            for (const cp of cpsData) {
                await runQuery("INSERT INTO CapaianPembelajaran (id_mapel, kode_cp, deskripsi_cp) VALUES (?, ?, ?)",
                    [cp.id_mapel, cp.kode_cp, cp.deskripsi_cp]);
            }
            console.log(`${cpsData.length} Capaian Pembelajaran dummy ditambahkan.`);
        } else { console.log("Table CapaianPembelajaran already contains data. Skipping dummy data insertion."); }

        // --- 12. Siswa Capaian Pembelajaran (Student Achievement on CP) ---
        const siswaCpCount = (await getQuery("SELECT COUNT(*) AS count FROM SiswaCapaianPembelajaran")).count;
        if (siswaCpCount === 0) {
            const allStudents = await allQuery("SELECT id_siswa, nama_siswa FROM Siswa");
            const allCps = await allQuery("SELECT id_cp, id_mapel, kode_cp FROM CapaianPembelajaran");
            const allTeachers = await allQuery("SELECT id_guru, nama_guru FROM Guru");
            const activeTASemester = allTASemesters.find(t => t.is_aktif);

            const andi = allStudents.find(s => s.nama_siswa === 'Andi Pratama');
            const budiGuru = allTeachers.find(t => t.nama_guru === 'Pak Budi Santoso');
            const mtkCp1 = allCps.find(cp => cp.kode_cp === 'MTK-1.1');

            if (andi && mtkCp1 && budiGuru && activeTASemester) {
                try {
                    await runQuery(`
                        INSERT INTO SiswaCapaianPembelajaran (id_siswa, id_cp, id_guru, id_ta_semester, status_capaian, tanggal_penilaian, catatan)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        andi.id_siswa,
                        mtkCp1.id_cp,
                        budiGuru.id_guru,
                        activeTASemester.id_ta_semester,
                        'Tercapai',
                        format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                        'Siswa menunjukkan pemahaman yang baik.'
                    ]);
                } catch (e) {
                    console.warn(`Gagal memasukkan SiswaCapaianPembelajaran untuk siswa ${andi.id_siswa} CP ${mtkCp1.id_cp}: ${e.message}`);
                }
            }
            console.log(`Siswa Capaian Pembelajaran dummy ditambahkan.`);
        } else { console.log("Table SiswaCapaianPembelajaran already contains data. Skipping dummy data insertion."); }

    } catch (error) {
        console.error("Error inserting dummy data:", error);
    } finally {
        // Tidak menutup koneksi di sini karena db.getDb() mengembalikan instance singleton.
        // Koneksi akan ditutup saat proses Node.js berakhir.
    }
}

// Panggil fungsi inisialisasi saat skrip dijalankan
initializeDatabase();
