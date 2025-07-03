// backend/src/controllers/adminController.js
const { getDb } = require('../config/db');
const { createHash } = require('crypto'); // Untuk hashing SHA256 (sesuai data dummy Python)

// Helper untuk hashing password (sesuai dengan yang digunakan di Python)
function hashPasswordPythonStyle(password) {
    return createHash('sha256').update(password).digest('hex');
}

// --- Manajemen Siswa ---
exports.getAllStudents = (req, res) => {
    const db = getDb();
    db.all("SELECT id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin FROM Siswa", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.addStudent = (req, res) => {
    const { id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, password } = req.body;
    const db = getDb();
    const password_hash = hashPasswordPythonStyle(password); // Hash password dengan cara yang sama seperti di Python

    db.run("INSERT INTO Siswa (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, password_hash) VALUES (?, ?, ?, ?, ?)",
        [id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, password_hash],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'ID Siswa sudah ada.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Siswa berhasil ditambahkan', id: this.lastID });
        }
    );
};

exports.updateStudent = (req, res) => { // Fungsi UPDATE siswa
    const { id } = req.params; // id_siswa
    const { nama_siswa, tanggal_lahir, jenis_kelamin, password } = req.body;
    const db = getDb();
    let query = "UPDATE Siswa SET nama_siswa = ?, tanggal_lahir = ?, jenis_kelamin = ? WHERE id_siswa = ?";
    let params = [nama_siswa, tanggal_lahir, jenis_kelamin, id];

    if (password) { // Jika password disertakan, update juga hash password
        const password_hash = hashPasswordPythonStyle(password);
        query = "UPDATE Siswa SET nama_siswa = ?, tanggal_lahir = ?, jenis_kelamin = ?, password_hash = ? WHERE id_siswa = ?";
        params = [nama_siswa, tanggal_lahir, jenis_kelamin, password_hash, id];
    }

    db.run(query, params, function(err) {
        if (err) return res.status(400).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan atau tidak ada perubahan.' });
        res.json({ message: 'Siswa berhasil diperbarui.' });
    });
};

exports.deleteStudent = (req, res) => { // Fungsi DELETE siswa
    const { id } = req.params; // id_siswa
    const db = getDb();

    // Cek ketergantungan sebelum menghapus (opsional tapi disarankan)
    // Misalnya, cek di tabel SiswaKelas atau Nilai
    db.get("SELECT COUNT(*) AS count FROM SiswaKelas WHERE id_siswa = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (row.count > 0) {
            return res.status(409).json({ message: 'Tidak dapat menghapus siswa. Siswa masih terdaftar di kelas.' });
        }
        db.get("SELECT COUNT(*) AS count FROM Nilai WHERE id_siswa = ?", [id], (err, row) => {
            if (err) return res.status(500).json({ message: err.message });
            if (row.count > 0) {
                return res.status(409).json({ message: 'Tidak dapat menghapus siswa. Siswa masih memiliki data nilai.' });
            }

            db.run("DELETE FROM Siswa WHERE id_siswa = ?", [id], function(err) {
                if (err) return res.status(400).json({ message: err.message });
                if (this.changes === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
                res.json({ message: 'Siswa berhasil dihapus.' });
            });
        });
    });
};

// --- Manajemen Guru ---
exports.getAllTeachers = (req, res) => {
    const db = getDb();
    db.all("SELECT id_guru, username, nama_guru, email FROM Guru", [], (err, rows) => {
        if (err) {
            console.error("Error fetching teachers:", err.message);
            return res.status(500).json({ message: err.message });
        }
        res.json(rows);
    });
};

exports.addTeacher = (req, res) => {
    const { username, password, nama_guru, email } = req.body;
    const db = getDb();
    const password_hash = hashPasswordPythonStyle(password);

    db.run("INSERT INTO Guru (username, password_hash, nama_guru, email) VALUES (?, ?, ?, ?)",
        [username, password_hash, nama_guru, email],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Username guru atau email sudah ada.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Guru berhasil ditambahkan', id: this.lastID });
        }
    );
};

exports.updateTeacher = (req, res) => { // Fungsi UPDATE guru
    const { id } = req.params; // id_guru
    const { username, password, nama_guru, email } = req.body;
    const db = getDb();
    let query = "UPDATE Guru SET username = ?, nama_guru = ?, email = ? WHERE id_guru = ?";
    let params = [username, nama_guru, email, id];

    if (password) { // Jika password disertakan, update juga hash password
        const password_hash = hashPasswordPythonStyle(password);
        query = "UPDATE Guru SET username = ?, nama_guru = ?, email = ?, password_hash = ? WHERE id_guru = ?";
        params = [username, nama_guru, email, password_hash, id];
    }

    db.run(query, params, function(err) {
        if (err) return res.status(400).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Guru tidak ditemukan atau tidak ada perubahan.' });
        res.json({ message: 'Guru berhasil diperbarui.' });
    });
};

exports.deleteTeacher = (req, res) => { // Fungsi DELETE guru
    const { id } = req.params; // id_guru
    const db = getDb();

    // Cek ketergantungan sebelum menghapus
    db.get("SELECT COUNT(*) AS count FROM Kelas WHERE id_wali_kelas = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (row.count > 0) {
            return res.status(409).json({ message: 'Tidak dapat menghapus guru. Guru masih menjadi wali kelas.' });
        }
        db.get("SELECT COUNT(*) AS count FROM GuruMataPelajaranKelas WHERE id_guru = ?", [id], (err, row) => {
            if (err) return res.status(500).json({ message: err.message });
            if (row.count > 0) {
                return res.status(409).json({ message: 'Tidak dapat menghapus guru. Guru masih memiliki penugasan mengajar.' });
            }
            db.get("SELECT COUNT(*) AS count FROM Nilai WHERE id_guru = ?", [id], (err, row) => {
                if (err) return res.status(500).json({ message: err.message });
                if (row.count > 0) {
                    return res.status(409).json({ message: 'Tidak dapat menghapus guru. Guru masih memiliki data nilai yang diinput.' });
                }

                db.run("DELETE FROM Guru WHERE id_guru = ?", [id], function(err) {
                    if (err) return res.status(400).json({ message: err.message });
                    if (this.changes === 0) return res.status(404).json({ message: 'Guru tidak ditemukan.' });
                    res.json({ message: 'Guru berhasil dihapus.' });
                });
            });
        });
    });
};


// --- Manajemen Tahun Ajaran & Semester ---
exports.getAllTASemester = (req, res) => {
    const db = getDb();
    db.all("SELECT * FROM TahunAjaranSemester ORDER BY tahun_ajaran DESC, semester DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.addTASemester = (req, res) => {
    const { tahun_ajaran, semester } = req.body;
    const db = getDb();
    db.run("INSERT INTO TahunAjaranSemester (tahun_ajaran, semester) VALUES (?, ?)",
        [tahun_ajaran, semester],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Tahun Ajaran & Semester ini sudah ada.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Tahun Ajaran & Semester berhasil ditambahkan.', id: this.lastID });
        }
    );
};

exports.setActiveTASemester = (req, res) => {
    const { id } = req.params;
    const db = getDb();
    db.serialize(() => { // Gunakan serialize untuk memastikan operasi berurutan
        db.run("UPDATE TahunAjaranSemester SET is_aktif = 0", [], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            db.run("UPDATE TahunAjaranSemester SET is_aktif = 1 WHERE id_ta_semester = ?", [id], function(err) {
                if (err) return res.status(500).json({ message: err.message });
                if (this.changes === 0) return res.status(404).json({ message: 'Tahun Ajaran & Semester tidak ditemukan.' });
                res.json({ message: 'Tahun Ajaran & Semester berhasil diatur sebagai aktif.' });
            });
        });
    });
};

// --- Manajemen Kelas ---
exports.getAllKelas = (req, res) => {
    const { id_ta_semester } = req.query; // Ambil dari query parameter
    const db = getDb();
    let query = `
        SELECT k.id_kelas, k.nama_kelas, g.nama_guru AS wali_kelas, tas.tahun_ajaran, tas.semester
        FROM Kelas k
        LEFT JOIN Guru g ON k.id_wali_kelas = g.id_guru
        JOIN TahunAjaranSemester tas ON k.id_ta_semester = tas.id_ta_semester
    `;
    let params = [];
    if (id_ta_semester) {
        query += ` WHERE k.id_ta_semester = ?`;
        params.push(id_ta_semester);
    }
    query += ` ORDER BY k.nama_kelas`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.addKelas = (req, res) => {
    const { nama_kelas, id_wali_kelas, id_ta_semester } = req.body;
    const db = getDb();
    db.run("INSERT INTO Kelas (nama_kelas, id_wali_kelas, id_ta_semester) VALUES (?, ?, ?)",
        [nama_kelas, id_wali_kelas, id_ta_semester],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Kelas dengan nama ini sudah ada untuk semester ini.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Kelas berhasil ditambahkan.', id: this.lastID });
        }
    );
};

// --- Manajemen Mata Pelajaran ---
exports.getAllMataPelajaran = (req, res) => {
    const db = getDb();
    db.all("SELECT * FROM MataPelajaran", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.addMataPelajaran = (req, res) => {
    const { nama_mapel } = req.body;
    const db = getDb();
    db.run("INSERT INTO MataPelajaran (nama_mapel) VALUES (?)",
        [nama_mapel],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Mata Pelajaran ini sudah ada.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Mata Pelajaran berhasil ditambahkan.', id: this.lastID });
        }
    );
};

// --- Manajemen Tipe Nilai ---
exports.getAllTipeNilai = (req, res) => {
    const db = getDb();
    db.all("SELECT * FROM TipeNilai", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.addTipeNilai = (req, res) => {
    const { nama_tipe, deskripsi } = req.body;
    const db = getDb();
    db.run("INSERT INTO TipeNilai (nama_tipe, deskripsi) VALUES (?, ?)",
        [nama_tipe, deskripsi],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Tipe Nilai ini sudah ada.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Tipe Nilai berhasil ditambahkan.', id: this.lastID });
        }
    );
};

// --- Penugasan Siswa ke Kelas ---
exports.assignSiswaToKelas = (req, res) => {
    const { id_siswa, id_kelas, id_ta_semester } = req.body;
    const db = getDb();
    db.run("INSERT INTO SiswaKelas (id_siswa, id_kelas, id_ta_semester) VALUES (?, ?, ?)",
        [id_siswa, id_kelas, id_ta_semester],
        function(err) {
            if (err) {
                // Handle unique constraint error
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Siswa sudah terdaftar di kelas ini untuk semester ini.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Siswa berhasil ditugaskan ke kelas.', id: this.lastID });
        }
    );
};

exports.getSiswaInKelas = (req, res) => {
    const { id_kelas, id_ta_semester } = req.params;
    const db = getDb();
    db.all(`
        SELECT s.id_siswa, s.nama_siswa
        FROM SiswaKelas sk
        JOIN Siswa s ON sk.id_siswa = s.id_siswa
        WHERE sk.id_kelas = ? AND sk.id_ta_semester = ?
        ORDER BY s.nama_siswa
    `, [id_kelas, id_ta_semester], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

// --- Penugasan Guru ke Mata Pelajaran & Kelas ---
exports.assignGuruToMapelKelas = (req, res) => {
    const { id_guru, id_mapel, id_kelas, id_ta_semester } = req.body;
    const db = getDb();
    db.run("INSERT INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)",
        [id_guru, id_mapel, id_kelas, id_ta_semester],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Penugasan guru ini sudah ada.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Guru berhasil ditugaskan ke mata pelajaran dan kelas.', id: this.lastID });
        }
    );
};

exports.getGuruMapelKelasAssignments = (req, res) => {
    const { id_ta_semester } = req.params;
    const db = getDb();
    db.all(`
        SELECT gmpk.id_guru_mapel_kelas, g.nama_guru, mp.nama_mapel, k.nama_kelas, tas.tahun_ajaran, tas.semester
        FROM GuruMataPelajaranKelas gmpk
        JOIN Guru g ON gmpk.id_guru = g.id_guru
        JOIN MataPelajaran mp ON gmpk.id_mapel = mp.id_mapel
        JOIN Kelas k ON gmpk.id_kelas = k.id_kelas
        JOIN TahunAjaranSemester tas ON gmpk.id_ta_semester = tas.id_ta_semester
        WHERE gmpk.id_ta_semester = ?
        ORDER BY g.nama_guru, k.nama_kelas, mp.nama_mapel
    `, [id_ta_semester], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

// --- Kenaikan Kelas Siswa ---
exports.promoteStudents = (req, res) => {
    const { student_ids, target_kelas_id, target_ta_semester_id } = req.body;
    const db = getDb();
    let insertedCount = 0;
    let failedCount = 0;

    // Menggunakan Promise.all untuk menangani operasi database asinkron dalam loop
    const promises = student_ids.map(id_siswa => {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO SiswaKelas (id_siswa, id_kelas, id_ta_semester) VALUES (?, ?, ?)",
                [id_siswa, target_kelas_id, target_ta_semester_id],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            // console.warn(`Siswa ${id_siswa} sudah terdaftar di kelas tujuan.`);
                            failedCount++; // Hitung sebagai gagal karena sudah ada
                            resolve(); // Tetap resolve agar Promise.all bisa lanjut
                        } else {
                            console.error(`Error promoting student ${id_siswa}:`, err.message);
                            failedCount++;
                            reject(err); // Reject jika ada error lain
                        }
                    } else {
                        insertedCount++;
                        resolve();
                    }
                }
            );
        });
    });

    Promise.all(promises)
        .then(() => {
            res.status(200).json({
                message: `Berhasil mempromosikan ${insertedCount} siswa. ${failedCount} siswa gagal atau sudah ada.`,
                insertedCount,
                failedCount
            });
        })
        .catch(error => {
            res.status(500).json({ message: 'Gagal mempromosikan siswa: ' + error.message });
        });
};
