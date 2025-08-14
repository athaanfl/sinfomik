// API endpoints tambahan untuk mendukung sistem prediksi
const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');

// Fungsi bantuan untuk query database
const allQuery = (sql, params = []) => {
    const db = getDb();
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const getQuery = (sql, params = []) => {
    const db = getDb();
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// GET /api/admin/siswa - Mendapatkan daftar siswa
router.get('/siswa', async (req, res) => {
    try {
        const siswa = await allQuery(`
            SELECT id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk
            FROM Siswa 
            ORDER BY nama_siswa
        `);

        res.json({
            success: true,
            message: 'Data siswa berhasil diambil',
            data: siswa
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengambil data siswa: ' + error.message,
            data: null
        });
    }
});

// GET /api/admin/mata-pelajaran - Mendapatkan daftar mata pelajaran
router.get('/mata-pelajaran', async (req, res) => {
    try {
        const mapel = await allQuery(`
            SELECT id_mapel, nama_mapel
            FROM MataPelajaran 
            ORDER BY nama_mapel
        `);

        res.json({
            success: true,
            message: 'Data mata pelajaran berhasil diambil',
            data: mapel
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengambil data mata pelajaran: ' + error.message,
            data: null
        });
    }
});

// GET /api/admin/tipe-nilai - Mendapatkan daftar tipe nilai
router.get('/tipe-nilai', async (req, res) => {
    try {
        const tipeNilai = await allQuery(`
            SELECT id_tipe_nilai, nama_tipe, deskripsi
            FROM TipeNilai 
            ORDER BY nama_tipe
        `);

        res.json({
            success: true,
            message: 'Data tipe nilai berhasil diambil',
            data: tipeNilai
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengambil data tipe nilai: ' + error.message,
            data: null
        });
    }
});

// GET /api/admin/kelas - Mendapatkan daftar kelas
router.get('/kelas', async (req, res) => {
    try {
        const kelas = await allQuery(`
            SELECT 
                k.id_kelas, 
                k.nama_kelas,
                g.nama_guru as wali_kelas,
                tas.tahun_ajaran,
                tas.semester
            FROM Kelas k
            LEFT JOIN Guru g ON k.id_wali_kelas = g.id_guru
            JOIN TahunAjaranSemester tas ON k.id_ta_semester = tas.id_ta_semester
            ORDER BY tas.tahun_ajaran DESC, k.nama_kelas
        `);

        res.json({
            success: true,
            message: 'Data kelas berhasil diambil',
            data: kelas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengambil data kelas: ' + error.message,
            data: null
        });
    }
});

// GET /api/admin/nilai-statistik - Mendapatkan statistik nilai
router.get('/nilai-statistik', async (req, res) => {
    try {
        const { mapelId, kelasId, tipeNilaiId } = req.query;
        
        let whereConditions = [];
        let params = [];
        
        if (mapelId) {
            whereConditions.push('n.id_mapel = ?');
            params.push(mapelId);
        }
        
        if (kelasId) {
            whereConditions.push('n.id_kelas = ?');
            params.push(kelasId);
        }
        
        if (tipeNilaiId) {
            whereConditions.push('n.id_tipe_nilai = ?');
            params.push(tipeNilaiId);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const statistik = await allQuery(`
            SELECT 
                mp.nama_mapel,
                tn.nama_tipe,
                k.nama_kelas,
                COUNT(*) as jumlah_nilai,
                AVG(n.nilai) as rata_rata,
                MIN(n.nilai) as nilai_minimum,
                MAX(n.nilai) as nilai_maximum,
                ROUND(AVG(n.nilai), 2) as rata_rata_rounded
            FROM Nilai n
            JOIN MataPelajaran mp ON n.id_mapel = mp.id_mapel
            JOIN TipeNilai tn ON n.id_tipe_nilai = tn.id_tipe_nilai
            JOIN Kelas k ON n.id_kelas = k.id_kelas
            ${whereClause}
            GROUP BY mp.id_mapel, tn.id_tipe_nilai, k.id_kelas
            ORDER BY mp.nama_mapel, tn.nama_tipe, k.nama_kelas
        `, params);

        res.json({
            success: true,
            message: 'Statistik nilai berhasil diambil',
            data: statistik
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengambil statistik nilai: ' + error.message,
            data: null
        });
    }
});

// GET /api/admin/siswa/:studentId/nilai - Mendapatkan semua nilai siswa
router.get('/siswa/:studentId/nilai', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const nilai = await allQuery(`
            SELECT 
                n.id_nilai,
                n.nilai,
                n.tanggal_input,
                n.keterangan,
                mp.nama_mapel,
                tn.nama_tipe,
                k.nama_kelas,
                g.nama_guru
            FROM Nilai n
            JOIN MataPelajaran mp ON n.id_mapel = mp.id_mapel
            JOIN TipeNilai tn ON n.id_tipe_nilai = tn.id_tipe_nilai
            JOIN Kelas k ON n.id_kelas = k.id_kelas
            JOIN Guru g ON n.id_guru = g.id_guru
            WHERE n.id_siswa = ?
            ORDER BY n.tanggal_input DESC, mp.nama_mapel, tn.nama_tipe
        `, [studentId]);

        const siswa = await getQuery(`
            SELECT nama_siswa FROM Siswa WHERE id_siswa = ?
        `, [studentId]);

        res.json({
            success: true,
            message: 'Data nilai siswa berhasil diambil',
            data: {
                siswa: siswa,
                nilai: nilai,
                total: nilai.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengambil data nilai siswa: ' + error.message,
            data: null
        });
    }
});

module.exports = router;
