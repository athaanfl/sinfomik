// API Routes untuk Sistem Prediksi Nilai
const express = require('express');
const router = express.Router();
const { NilaiPredictionSystem } = require('../prediction_system');

// Initialize prediction system
const predictor = new NilaiPredictionSystem();

// GET /api/prediction/student/:studentId/mapel/:mapelId
// Prediksi nilai untuk siswa tertentu pada mata pelajaran tertentu
router.get('/student/:studentId/mapel/:mapelId', async (req, res) => {
    try {
        const { studentId, mapelId } = req.params;
        const { tipeNilaiId } = req.query;

        const prediction = await predictor.predictStudentGrade(
            parseInt(studentId), 
            parseInt(mapelId), 
            tipeNilaiId ? parseInt(tipeNilaiId) : null
        );

        if (prediction.error) {
            return res.status(400).json({
                success: false,
                message: prediction.error,
                data: null
            });
        }

        res.json({
            success: true,
            message: 'Prediksi berhasil',
            data: prediction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error dalam prediksi: ' + error.message,
            data: null
        });
    }
});

// GET /api/prediction/class/mapel/:mapelId
// Prediksi nilai untuk seluruh kelas pada mata pelajaran tertentu
router.get('/class/mapel/:mapelId', async (req, res) => {
    try {
        const { mapelId } = req.params;
        const { tipeNilaiId } = req.query;

        const prediction = await predictor.predictClassGrades(
            parseInt(mapelId), 
            tipeNilaiId ? parseInt(tipeNilaiId) : null
        );

        if (prediction.error) {
            return res.status(400).json({
                success: false,
                message: prediction.error,
                data: null
            });
        }

        res.json({
            success: true,
            message: 'Prediksi kelas berhasil',
            data: prediction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error dalam prediksi kelas: ' + error.message,
            data: null
        });
    }
});

// GET /api/prediction/trends/mapel/:mapelId
// Analisis tren kelas untuk mata pelajaran tertentu
router.get('/trends/mapel/:mapelId', async (req, res) => {
    try {
        const { mapelId } = req.params;

        const trends = await predictor.analyzeClassTrends(parseInt(mapelId));

        if (trends.error) {
            return res.status(400).json({
                success: false,
                message: trends.error,
                data: null
            });
        }

        res.json({
            success: true,
            message: 'Analisis tren berhasil',
            data: trends
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error dalam analisis tren: ' + error.message,
            data: null
        });
    }
});

// GET /api/prediction/history/:studentId/mapel/:mapelId
// Ambil data historis nilai siswa
router.get('/history/:studentId/mapel/:mapelId', async (req, res) => {
    try {
        const { studentId, mapelId } = req.params;
        const { tipeNilaiId } = req.query;

        const history = await predictor.getStudentGradeHistory(
            parseInt(studentId), 
            parseInt(mapelId), 
            tipeNilaiId ? parseInt(tipeNilaiId) : null
        );

        res.json({
            success: true,
            message: 'Data historis berhasil diambil',
            data: {
                count: history.length,
                history: history
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengambil data historis: ' + error.message,
            data: null
        });
    }
});

// GET /api/prediction/batch-predict
// Prediksi batch untuk multiple siswa
router.post('/batch-predict', async (req, res) => {
    try {
        const { students, mapelId, tipeNilaiId } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Data siswa harus berupa array dan tidak boleh kosong',
                data: null
            });
        }

        if (!mapelId) {
            return res.status(400).json({
                success: false,
                message: 'ID mata pelajaran harus disediakan',
                data: null
            });
        }

        const predictions = [];
        const errors = [];

        for (const studentId of students) {
            try {
                const prediction = await predictor.predictStudentGrade(
                    parseInt(studentId), 
                    parseInt(mapelId), 
                    tipeNilaiId ? parseInt(tipeNilaiId) : null
                );

                if (prediction.error) {
                    errors.push({
                        studentId,
                        error: prediction.error
                    });
                } else {
                    predictions.push(prediction);
                }
            } catch (error) {
                errors.push({
                    studentId,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Prediksi batch selesai. ${predictions.length} berhasil, ${errors.length} error`,
            data: {
                predictions,
                errors,
                summary: {
                    total: students.length,
                    success: predictions.length,
                    failed: errors.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error dalam prediksi batch: ' + error.message,
            data: null
        });
    }
});

// GET /api/prediction/statistics
// Statistik umum sistem prediksi
router.get('/statistics', async (req, res) => {
    try {
        const stats = await predictor.allQuery(`
            SELECT 
                COUNT(DISTINCT s.id_siswa) as total_siswa,
                COUNT(DISTINCT mp.id_mapel) as total_mapel,
                COUNT(*) as total_nilai,
                AVG(n.nilai) as rata_rata_nilai
            FROM Nilai n
            JOIN Siswa s ON n.id_siswa = s.id_siswa
            JOIN MataPelajaran mp ON n.id_mapel = mp.id_mapel
        `);

        const mapelStats = await predictor.allQuery(`
            SELECT 
                mp.nama_mapel,
                COUNT(*) as jumlah_nilai,
                AVG(n.nilai) as rata_rata,
                MIN(n.nilai) as nilai_min,
                MAX(n.nilai) as nilai_max
            FROM Nilai n
            JOIN MataPelajaran mp ON n.id_mapel = mp.id_mapel
            GROUP BY mp.id_mapel, mp.nama_mapel
            ORDER BY mp.nama_mapel
        `);

        res.json({
            success: true,
            message: 'Statistik berhasil diambil',
            data: {
                overview: stats[0],
                mapelStatistics: mapelStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error mengambil statistik: ' + error.message,
            data: null
        });
    }
});

module.exports = router;
