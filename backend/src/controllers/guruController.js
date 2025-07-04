// backend/src/controllers/guruController.js
const { getDb } = require('../config/db');
const { format } = require('date-fns'); // Untuk format tanggal

// --- Ambil Penugasan Guru ---
exports.getGuruAssignments = (req, res) => {
    const { id_guru, id_ta_semester } = req.params;
    const db = getDb();
    db.all(`
        SELECT gmpk.id_kelas, k.nama_kelas, gmpk.id_mapel, mp.nama_mapel
        FROM GuruMataPelajaranKelas gmpk
        JOIN Kelas k ON gmpk.id_kelas = k.id_kelas
        JOIN MataPelajaran mp ON gmpk.id_mapel = mp.id_mapel
        WHERE gmpk.id_guru = ? AND gmpk.id_ta_semester = ?
        ORDER BY k.nama_kelas, mp.nama_mapel
    `, [id_guru, id_ta_semester], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

// --- Ambil Siswa di Kelas Tertentu ---
exports.getStudentsInClass = (req, res) => {
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

// --- Tambah atau Update Nilai ---
exports.addOrUpdateGrade = (req, res) => {
    const { id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, id_tipe_nilai, nilai, keterangan } = req.body;
    const db = getDb();
    const tanggal_input = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    // Cek apakah nilai sudah ada
    db.get(`
        SELECT id_nilai FROM Nilai
        WHERE id_siswa = ? AND id_guru = ? AND id_mapel = ? AND id_kelas = ?
        AND id_ta_semester = ? AND id_tipe_nilai = ?
    `, [id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, id_tipe_nilai], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });

        if (row) {
            // Update jika sudah ada
            db.run(`
                UPDATE Nilai SET nilai = ?, keterangan = ?, tanggal_input = ?
                WHERE id_nilai = ?
            `, [nilai, keterangan, tanggal_input, row.id_nilai], function(err) {
                if (err) return res.status(400).json({ message: err.message });
                res.status(200).json({ message: 'Nilai berhasil diperbarui.', id: row.id_nilai, changes: this.changes });
            });
        } else {
            // Insert jika belum ada
            db.run(`
                INSERT INTO Nilai (id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, id_tipe_nilai, nilai, tanggal_input, keterangan)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, id_tipe_nilai, nilai, tanggal_input, keterangan], function(err) {
                if (err) return res.status(400).json({ message: err.message });
                res.status(201).json({ message: 'Nilai berhasil ditambahkan.', id: this.lastID });
            });
        }
    });
};

// --- Rekap Nilai ---
exports.getRekapNilai = (req, res) => {
    const { id_guru, id_mapel, id_kelas, id_ta_semester } = req.params;
    const db = getDb();
    db.all(`
        SELECT
            s.nama_siswa,
            tn.nama_tipe,
            n.nilai,
            n.tanggal_input,
            n.keterangan
        FROM Nilai n
        JOIN Siswa s ON n.id_siswa = s.id_siswa
        JOIN TipeNilai tn ON n.id_tipe_nilai = tn.id_tipe_nilai
        WHERE n.id_guru = ?
          AND n.id_mapel = ?
          AND n.id_kelas = ?
          AND n.id_ta_semester = ?
        ORDER BY s.nama_siswa, n.tanggal_input
    `, [id_guru, id_mapel, id_kelas, id_ta_semester], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

// --- Capaian Pembelajaran untuk Guru ---
exports.getCapaianPembelajaranByMapel = (req, res) => {
    const { id_mapel } = req.params;
    const db = getDb();
    db.all(`
        SELECT id_cp, kode_cp, deskripsi_cp
        FROM CapaianPembelajaran
        WHERE id_mapel = ?
        ORDER BY kode_cp
    `, [id_mapel], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.getSiswaCapaianPembelajaran = (req, res) => {
    const { id_guru, id_mapel, id_kelas, id_ta_semester } = req.params;
    const db = getDb();

    // Query untuk mendapatkan semua siswa di kelas tersebut
    // dan status capaian pembelajaran mereka untuk CP yang terkait dengan mapel tersebut
    db.all(`
        SELECT
            s.id_siswa,
            s.nama_siswa,
            cp.id_cp,
            cp.kode_cp,
            cp.deskripsi_cp,
            scp.status_capaian,
            scp.tanggal_penilaian,
            scp.catatan
        FROM SiswaKelas sk
        JOIN Siswa s ON sk.id_siswa = s.id_siswa
        JOIN GuruMataPelajaranKelas gmpk ON
            gmpk.id_kelas = sk.id_kelas AND gmpk.id_mapel = ? AND gmpk.id_guru = ? AND gmpk.id_ta_semester = sk.id_ta_semester
        LEFT JOIN CapaianPembelajaran cp ON cp.id_mapel = gmpk.id_mapel
        LEFT JOIN SiswaCapaianPembelajaran scp ON
            scp.id_siswa = s.id_siswa AND scp.id_cp = cp.id_cp AND scp.id_ta_semester = ?
        WHERE sk.id_kelas = ? AND sk.id_ta_semester = ?
        ORDER BY s.nama_siswa, cp.kode_cp
    `, [id_mapel, id_guru, id_ta_semester, id_kelas, id_ta_semester], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.addOrUpdateSiswaCapaianPembelajaran = (req, res) => {
    const { id_siswa, id_cp, id_guru, id_ta_semester, status_capaian, catatan } = req.body;
    const db = getDb();
    const tanggal_penilaian = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    // Cek apakah data SiswaCapaianPembelajaran sudah ada
    db.get(`
        SELECT id_siswa_cp FROM SiswaCapaianPembelajaran
        WHERE id_siswa = ? AND id_cp = ? AND id_ta_semester = ?
    `, [id_siswa, id_cp, id_ta_semester], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });

        if (row) {
            // Update jika sudah ada
            db.run(`
                UPDATE SiswaCapaianPembelajaran SET status_capaian = ?, catatan = ?, tanggal_penilaian = ?
                WHERE id_siswa_cp = ?
            `, [status_capaian, catatan, tanggal_penilaian, row.id_siswa_cp], function(err) {
                if (err) return res.status(400).json({ message: err.message });
                res.status(200).json({ message: 'Capaian Pembelajaran siswa berhasil diperbarui.', id: row.id_siswa_cp, changes: this.changes });
            });
        } else {
            // Insert jika belum ada
            db.run(`
                INSERT INTO SiswaCapaianPembelajaran (id_siswa, id_cp, id_guru, id_ta_semester, status_capaian, tanggal_penilaian, catatan)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [id_siswa, id_cp, id_guru, id_ta_semester, status_capaian, tanggal_penilaian, catatan], function(err) {
                if (err) return res.status(400).json({ message: err.message });
                res.status(201).json({ message: 'Capaian Pembelajaran siswa berhasil ditambahkan.', id: this.lastID });
            });
        }
    });
};
