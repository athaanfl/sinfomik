// backend/src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * ANALYTICS ROUTES
 * Base path: /api/analytics
 */

// School-wide analytics (ADMIN only in production - add auth middleware)
// GET /api/analytics/school?id_mapel=1&id_ta_semester=2
router.get('/school', analyticsController.getSchoolAnalytics);

// Angkatan analytics (ADMIN & GURU)
// GET /api/analytics/angkatan/:tahun_ajaran_masuk?id_mapel=1
router.get('/angkatan/:tahun_ajaran_masuk', analyticsController.getAngkatanAnalytics);

// Get list of available angkatan
// GET /api/analytics/angkatan-list
router.get('/angkatan-list', analyticsController.getAngkatanList);

// Student individual analytics (ADMIN & GURU)
// GET /api/analytics/student/:id_siswa?id_mapel=1
router.get('/student/:id_siswa', analyticsController.getStudentAnalytics);

// Guru subject analytics (GURU - own data)
// GET /api/analytics/guru/:id_guru?id_mapel=1&id_kelas=2&id_ta_semester=3
router.get('/guru/:id_guru', analyticsController.getGuruAnalytics);

// Compare multiple students (ADMIN & GURU)
// GET /api/analytics/compare-students?id_siswa_list=1001,1002,1003&id_mapel=1
router.get('/compare-students', analyticsController.compareStudents);

module.exports = router;
