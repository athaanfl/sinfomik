// backend/src/routes/guruRoutes.js
const express = require('express');
const router = express.Router();
const guruController = require('../controllers/guruController');
const adminController = require('../controllers/adminController');
const { verifyToken, isAdminOrGuru } = require('../middlewares/authMiddleware');

// Apply auth middleware to all guru routes
router.use(verifyToken);
router.use(isAdminOrGuru);

// Read-only access to TA Semester data (needed for guru dashboard)
router.get('/ta-semester', adminController.getAllTASemester);

// Protected guru endpoints
router.get('/assignments/:id_guru/:id_ta_semester', guruController.getGuruAssignments);
router.get('/students-in-class/:id_kelas/:id_ta_semester', guruController.getStudentsInClass);
router.post('/grades-new', guruController.addOrUpdateNewGrade); // New endpoint for TP/UAS structure
router.get('/grades/rekap/:id_guru/:id_mapel/:id_kelas/:id_ta_semester', guruController.getRekapNilai);
router.get('/grades/assignment/:id_guru/:id_mapel/:id_kelas/:id_ta_semester', guruController.getGradesByAssignment); // New endpoint

// --- Capaian Pembelajaran untuk Guru ---
router.get('/cp/mapel/:id_mapel', guruController.getCapaianPembelajaranByMapel); // Mengambil CP berdasarkan Mata Pelajaran
router.get('/siswa-cp/:id_guru/:id_mapel/:id_kelas/:id_ta_semester', guruController.getSiswaCapaianPembelajaran); // Mengambil status CP siswa
router.post('/siswa-cp', guruController.addOrUpdateSiswaCapaianPembelajaran); // Menambah/Memperbarui status CP siswa

// --- New: Wali Kelas Grades ---
router.get('/wali-kelas-grades/:id_guru/:id_ta_semester', guruController.getWaliKelasGrades);
router.get('/wali-kelas-class-list/:id_guru/:id_ta_semester', guruController.getWaliKelasClassList);

module.exports = router;
