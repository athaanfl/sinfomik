// backend/src/controllers/adminController.js
const { getDb } = require('../config/db');
const { createHash } = require('crypto'); // Untuk hashing SHA256 (sesuai data dummy Python)
const { format } = require('date-fns'); // Untuk format tanggal

// Helper untuk hashing password (sesuai dengan yang digunakan di Python)
function hashPasswordPythonStyle(password) {
    return createHash('sha256').update(password).digest('hex');
}

// --- Manajemen Siswa ---
exports.getAllStudents = (req, res) => {
    const db = getDb();
    // Ambil id_ta_semester aktif dari query parameter jika ada, atau cari yang aktif
    const activeTASemesterId = req.query.active_ta_semester_id;

    let query = `
        SELECT
            s.id_siswa,
            s.nama_siswa,
            s.tanggal_lahir,
            s.jenis_kelamin,
            s.password_hash,
            s.tahun_ajaran_masuk,
            k.id_kelas AS kelas_aktif_id,
            k.nama_kelas AS kelas_aktif_nama,
            tas_k.tahun_ajaran AS kelas_aktif_tahun_ajaran,
            tas_k.semester AS kelas_aktif_semester
        FROM Siswa s
        LEFT JOIN SiswaKelas sk ON s.id_siswa = sk.id_siswa
        LEFT JOIN Kelas k ON sk.id_kelas = k.id_kelas
        LEFT JOIN TahunAjaranSemester tas_k ON k.id_ta_semester = tas_k.id_ta_semester
    `;
    let params = [];

    if (activeTASemesterId) {
        // Jika ada active_ta_semester_id, filter siswa_kelas berdasarkan itu
        query += ` WHERE sk.id_ta_semester = ? OR sk.id_ta_semester IS NULL`; // Siswa tanpa kelas juga ditampilkan
        params.push(activeTASemesterId);
    } else {
        // Jika tidak ada active_ta_semester_id dari frontend, coba cari yang aktif di DB
        query += ` LEFT JOIN TahunAjaranSemester tas_active ON tas_active.is_aktif = 1
                   WHERE sk.id_ta_semester = tas_active.id_ta_semester OR sk.id_ta_semester IS NULL`;
    }

    query += ` ORDER BY s.nama_siswa`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("Error fetching all students:", err.message);
            return res.status(500).json({ message: err.message });
        }
        res.json(rows);
    });
};

exports.addStudent = (req, res) => {
    const { id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, password, tahun_ajaran_masuk } = req.body;
    const db = getDb();
    const password_hash = hashPasswordPythonStyle(password);

    db.run("INSERT INTO Siswa (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, password_hash, tahun_ajaran_masuk) VALUES (?, ?, ?, ?, ?, ?)",
        [id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, password_hash, tahun_ajaran_masuk],
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

exports.updateStudent = (req, res) => {
    const { id } = req.params;
    const { nama_siswa, tanggal_lahir, jenis_kelamin, password, tahun_ajaran_masuk } = req.body;
    const db = getDb();
    let query = "UPDATE Siswa SET nama_siswa = ?, tanggal_lahir = ?, jenis_kelamin = ?, tahun_ajaran_masuk = ? WHERE id_siswa = ?";
    let params = [nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk, id];

    if (password) {
        const password_hash = hashPasswordPythonStyle(password);
        query = "UPDATE Siswa SET nama_siswa = ?, tanggal_lahir = ?, jenis_kelamin = ?, password_hash = ?, tahun_ajaran_masuk = ? WHERE id_siswa = ?";
        params = [nama_siswa, tanggal_lahir, jenis_kelamin, password_hash, tahun_ajaran_masuk, id];
    }

    db.run(query, params, function(err) {
        if (err) return res.status(400).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan atau tidak ada perubahan.' });
        res.json({ message: 'Siswa berhasil diperbarui.' });
    });
};

exports.deleteStudent = (req, res) => {
    const { id } = req.params;
    const db = getDb();

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
            db.get("SELECT COUNT(*) AS count FROM SiswaCapaianPembelajaran WHERE id_siswa = ?", [id], (err, row) => {
                if (err) return res.status(500).json({ message: err.message });
                if (row.count > 0) {
                    return res.status(409).json({ message: 'Tidak dapat menghapus siswa. Siswa masih memiliki data capaian pembelajaran.' });
                }

                db.run("DELETE FROM Siswa WHERE id_siswa = ?", [id], function(err) {
                    if (err) return res.status(400).json({ message: err.message });
                    if (this.changes === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
                    res.json({ message: 'Siswa berhasil dihapus.' });
                });
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

exports.updateTeacher = (req, res) => {
    const { id } = req.params;
    const { username, password, nama_guru, email } = req.body;
    const db = getDb();
    let query = "UPDATE Guru SET username = ?, nama_guru = ?, email = ? WHERE id_guru = ?";
    let params = [username, nama_guru, email, id];

    if (password) {
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

exports.deleteTeacher = (req, res) => {
    const { id } = req.params;
    const db = getDb();

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
            db.get("SELECT COUNT(*) AS count FROM SiswaCapaianPembelajaran WHERE id_guru = ?", [id], (err, row) => {
                if (err) return res.status(500).json({ message: err.message });
                if (row.count > 0) {
                    return res.status(409).json({ message: 'Tidak dapat menghapus guru. Guru masih memiliki data capaian pembelajaran yang diinput.' });
                }

                    db.run("DELETE FROM Guru WHERE id_guru = ?", [id], function(err) {
                        if (err) return res.status(400).json({ message: err.message });
                        if (this.changes === 0) return res.status(404).json({ message: 'Guru tidak ditemukan.' });
                        res.json({ message: 'Guru berhasil dihapus.' });
                    });
                });
            });
        });
    });
};

// --- API Tambahan: Get Teacher Details for Admin ---
exports.getTeacherDetailsForAdmin = (req, res) => {
    const db = getDb();
    const query = `
        SELECT
            g.id_guru,
            g.username,
            g.nama_guru,
            g.email,
            GROUP_CONCAT(DISTINCT k_wali.nama_kelas || ' (' || tas_wali.tahun_ajaran || ' ' || tas_wali.semester || ')', '; ') AS wali_kelas_di,
            GROUP_CONCAT(DISTINCT mp.nama_mapel || ' di ' || k_ampu.nama_kelas || ' (' || tas_ampu.tahun_ajaran || ' ' || tas_ampu.semester || ')', '; ') AS mengampu_pelajaran_di
        FROM Guru g
        LEFT JOIN Kelas k_wali ON g.id_guru = k_wali.id_wali_kelas
        LEFT JOIN TahunAjaranSemester tas_wali ON k_wali.id_ta_semester = tas_wali.id_ta_semester
        LEFT JOIN GuruMataPelajaranKelas gmpk ON g.id_guru = gmpk.id_guru
        LEFT JOIN MataPelajaran mp ON gmpk.id_mapel = mp.id_mapel
        LEFT JOIN Kelas k_ampu ON gmpk.id_kelas = k_ampu.id_kelas
        LEFT JOIN TahunAjaranSemester tas_ampu ON gmpk.id_ta_semester = tas_ampu.id_ta_semester
        GROUP BY g.id_guru
        ORDER BY g.nama_guru;
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching teacher details for admin:", err.message);
            return res.status(500).json({ message: err.message });
        }
        res.json(rows);
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

exports.updateKelas = (req, res) => { // Fungsi UPDATE kelas
    const { id } = req.params; // id_kelas
    const { nama_kelas, id_wali_kelas } = req.body; // id_ta_semester tidak diupdate di sini karena itu bagian dari unique key
    const db = getDb();

    db.run("UPDATE Kelas SET nama_kelas = ?, id_wali_kelas = ? WHERE id_kelas = ?",
        [nama_kelas, id_wali_kelas, id],
        function(err) {
            if (err) return res.status(400).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Kelas tidak ditemukan atau tidak ada perubahan.' });
            res.json({ message: 'Kelas berhasil diperbarui.' });
        }
    );
};

exports.deleteKelas = (req, res) => { // Fungsi DELETE kelas
    const { id } = req.params; // id_kelas
    const db = getDb();

    // Cek ketergantungan
    db.get("SELECT COUNT(*) AS count FROM SiswaKelas WHERE id_kelas = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (row.count > 0) {
            return res.status(409).json({ message: 'Tidak dapat menghapus kelas. Kelas masih memiliki siswa terdaftar.' });
        }
        db.get("SELECT COUNT(*) AS count FROM GuruMataPelajaranKelas WHERE id_kelas = ?", [id], (err, row) => {
            if (err) return res.status(500).json({ message: err.message });
            if (row.count > 0) {
                return res.status(409).json({ message: 'Tidak dapat menghapus kelas. Kelas masih memiliki penugasan guru.' });
            }
            db.get("SELECT COUNT(*) AS count FROM Nilai WHERE id_kelas = ?", [id], (err, row) => {
                if (err) return res.status(500).json({ message: err.message });
                if (row.count > 0) {
                    return res.status(409).json({ message: 'Tidak dapat menghapus kelas. Kelas masih memiliki data nilai.' });
                }

                db.run("DELETE FROM Kelas WHERE id_kelas = ?", [id], function(err) {
                    if (err) return res.status(400).json({ message: err.message });
                    if (this.changes === 0) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
                    res.json({ message: 'Kelas berhasil dihapus.' });
                });
            });
        });
    });
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

exports.updateMataPelajaran = (req, res) => { // Fungsi UPDATE mapel
    const { id } = req.params; // id_mapel
    const { nama_mapel } = req.body;
    const db = getDb();

    db.run("UPDATE MataPelajaran SET nama_mapel = ? WHERE id_mapel = ?",
        [nama_mapel, id],
        function(err) {
            if (err) return res.status(400).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Mata Pelajaran tidak ditemukan atau tidak ada perubahan.' });
            res.json({ message: 'Mata Pelajaran berhasil diperbarui.' });
        }
    );
};

exports.deleteMataPelajaran = (req, res) => { // Fungsi DELETE mapel
    const { id } = req.params; // id_mapel
    const db = getDb();

    // Cek ketergantungan
    db.get("SELECT COUNT(*) AS count FROM GuruMataPelajaranKelas WHERE id_mapel = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (row.count > 0) {
            return res.status(409).json({ message: 'Tidak dapat menghapus mata pelajaran. Masih memiliki penugasan guru.' });
        }
        db.get("SELECT COUNT(*) AS count FROM Nilai WHERE id_mapel = ?", [id], (err, row) => {
            if (err) return res.status(500).json({ message: err.message });
            if (row.count > 0) {
                return res.status(409).json({ message: 'Tidak dapat menghapus mata pelajaran. Masih memiliki data nilai.' });
            }
            db.get("SELECT COUNT(*) AS count FROM CapaianPembelajaran WHERE id_mapel = ?", [id], (err, row) => {
                if (err) return res.status(500).json({ message: err.message });
                if (row.count > 0) {
                    return res.status(409).json({ message: 'Tidak dapat menghapus mata pelajaran. Masih memiliki capaian pembelajaran terkait.' });
                }

                db.run("DELETE FROM MataPelajaran WHERE id_mapel = ?", [id], function(err) {
                    if (err) return res.status(400).json({ message: err.message });
                    if (this.changes === 0) return res.status(404).json({ message: 'Mata Pelajaran tidak ditemukan.' });
                    res.json({ message: 'Mata Pelajaran berhasil dihapus.' });
                });
            });
        });
    });
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

exports.updateTipeNilai = (req, res) => { // Fungsi UPDATE tipe nilai
    const { id } = req.params; // id_tipe_nilai
    const { nama_tipe, deskripsi } = req.body;
    const db = getDb();

    db.run("UPDATE TipeNilai SET nama_tipe = ?, deskripsi = ? WHERE id_tipe_nilai = ?",
        [nama_tipe, deskripsi, id],
        function(err) {
            if (err) return res.status(400).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Tipe Nilai tidak ditemukan atau tidak ada perubahan.' });
            res.json({ message: 'Tipe Nilai berhasil diperbarui.' });
        });
};

exports.deleteTipeNilai = (req, res) => { // Fungsi DELETE tipe nilai
    const { id } = req.params; // id_tipe_nilai
    const db = getDb();

    // Cek ketergantungan
    db.get("SELECT COUNT(*) AS count FROM Nilai WHERE id_tipe_nilai = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (row.count > 0) {
            return res.status(409).json({ message: 'Tidak dapat menghapus tipe nilai. Masih digunakan dalam data nilai.' });
        }

        db.run("DELETE FROM TipeNilai WHERE id_tipe_nilai = ?", [id], function(err) {
            if (err) return res.status(400).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Tipe Nilai tidak ditemukan.' });
            res.json({ message: 'Tipe Nilai berhasil dihapus.' });
        });
    });
};


// --- Penugasan Siswa ke Kelas ---
exports.assignSiswaToKelas = (req, res) => {
    const { id_siswa, id_kelas, id_ta_semester } = req.body;
    const db = getDb();
    db.run("INSERT INTO SiswaKelas (id_siswa, id_kelas, id_ta_semester) VALUES (?, ?, ?)",
        [id_siswa, id_kelas, id_ta_semester],
        function(err) {
            if (err) {
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

// --- Capaian Pembelajaran (CP) ---
exports.getAllCapaianPembelajaran = (req, res) => {
    const { id_mapel } = req.query; // Filter by mapel if provided
    const db = getDb();
    let query = `
        SELECT cp.id_cp, cp.kode_cp, cp.deskripsi_cp, mp.nama_mapel
        FROM CapaianPembelajaran cp
        JOIN MataPelajaran mp ON cp.id_mapel = mp.id_mapel
    `;
    let params = [];
    if (id_mapel) {
        query += ` WHERE cp.id_mapel = ?`;
        params.push(id_mapel);
    }
    query += ` ORDER BY mp.nama_mapel, cp.kode_cp`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.addCapaianPembelajaran = (req, res) => {
    const { id_mapel, kode_cp, deskripsi_cp } = req.body;
    const db = getDb();
    db.run("INSERT INTO CapaianPembelajaran (id_mapel, kode_cp, deskripsi_cp) VALUES (?, ?, ?)",
        [id_mapel, kode_cp, deskripsi_cp],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Kode CP ini sudah ada untuk mata pelajaran ini.' });
                }
                return res.status(400).json({ message: err.message });
            }
            res.status(201).json({ message: 'Capaian Pembelajaran berhasil ditambahkan.', id: this.lastID });
        }
    );
};

exports.updateCapaianPembelajaran = (req, res) => {
    const { id } = req.params; // id_cp
    const { id_mapel, kode_cp, deskripsi_cp } = req.body;
    const db = getDb();

    db.run("UPDATE CapaianPembelajaran SET id_mapel = ?, kode_cp = ?, deskripsi_cp = ? WHERE id_cp = ?",
        [id_mapel, kode_cp, deskripsi_cp, id],
        function(err) {
            if (err) return res.status(400).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Capaian Pembelajaran tidak ditemukan atau tidak ada perubahan.' });
            res.json({ message: 'Capaian Pembelajaran berhasil diperbarui.' });
        }
    );
};

exports.deleteCapaianPembelajaran = (req, res) => {
    const { id } = req.params; // id_cp
    const db = getDb();

    // Cek ketergantungan
    db.get("SELECT COUNT(*) AS count FROM SiswaCapaianPembelajaran WHERE id_cp = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (row.count > 0) {
            return res.status(409).json({ message: 'Tidak dapat menghapus Capaian Pembelajaran. Masih ada data pencapaian siswa terkait.' });
        }

        db.run("DELETE FROM CapaianPembelajaran WHERE id_cp = ?", [id], function(err) {
            if (err) return res.status(400).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Capaian Pembelajaran tidak ditemukan.' });
            res.json({ message: 'Capaian Pembelajaran berhasil dihapus.' });
        });
    });
};

// --- Manajemen Nilai Siswa (Admin) ---
exports.getAllGrades = (req, res) => { // Fungsi baru: Admin melihat semua nilai
    const db = getDb();
    // Query untuk mengambil semua nilai dengan detail siswa, guru, mapel, kelas, tipe nilai, TA/Semester
    const query = `
        SELECT
            n.id_nilai,
            s.nama_siswa,
            g.nama_guru,
            mp.nama_mapel,
            k.nama_kelas,
            tas.tahun_ajaran,
            tas.semester,
            tn.nama_tipe,
            n.nilai,
            n.tanggal_input,
            n.keterangan,
            n.id_guru, -- Tambahkan id_guru untuk keperluan request perubahan
            n.id_siswa,
            n.id_mapel,
            n.id_kelas,
            n.id_ta_semester,
            n.id_tipe_nilai
        FROM Nilai n
        JOIN Siswa s ON n.id_siswa = s.id_siswa
        JOIN Guru g ON n.id_guru = g.id_guru
        JOIN MataPelajaran mp ON n.id_mapel = mp.id_mapel
        JOIN Kelas k ON n.id_kelas = k.id_kelas
        JOIN TahunAjaranSemester tas ON n.id_ta_semester = tas.id_ta_semester
        JOIN TipeNilai tn ON n.id_tipe_nilai = tn.id_tipe_nilai
        ORDER BY tas.tahun_ajaran DESC, tas.semester DESC, k.nama_kelas, s.nama_siswa, mp.nama_mapel, tn.nama_tipe
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching all grades for admin:", err.message);
            return res.status(500).json({ message: err.message });
        }
        res.json(rows);
    });
};

exports.createGradeChangeRequest = (req, res) => { // Fungsi baru: Admin membuat permintaan perubahan nilai
    const { id_nilai, id_admin_requestor, id_guru_approver, nilai_lama, nilai_baru, catatan_admin } = req.body;
    const db = getDb();
    const tanggal_request = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    db.run(`
        INSERT INTO GradeChangeRequest (id_nilai, id_admin_requestor, id_guru_approver, nilai_lama, nilai_baru, tanggal_request, status_request, catatan_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id_nilai, id_admin_requestor, id_guru_approver, nilai_lama, nilai_baru, tanggal_request, 'Pending', catatan_admin], function(err) {
        if (err) {
            console.error("Error creating grade change request:", err.message);
            return res.status(400).json({ message: err.message });
        }
        res.status(201).json({ message: 'Permintaan perubahan nilai berhasil diajukan.', id: this.lastID });
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
