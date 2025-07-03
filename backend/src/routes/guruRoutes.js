// backend/src/routes/guruRoutes.js
const express = require('express');
const router = express.Router();
const guruController = require('../controllers/guruController');
// const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // Untuk otorisasi

// Endpoint untuk guru
// router.get('/assignments/:id_guru/:id_ta_semester', authenticateToken, authorizeRole(['guru']), guruController.getGuruAssignments);

// Untuk demo awal tanpa otorisasi JWT:
router.get('/assignments/:id_guru/:id_ta_semester', guruController.getGuruAssignments);
router.get('/students-in-class/:id_kelas/:id_ta_semester', guruController.getStudentsInClass);
router.post('/grades', guruController.addOrUpdateGrade);
router.get('/grades/rekap/:id_guru/:id_mapel/:id_kelas/:id_ta_semester', guruController.getRekapNilai);


module.exports = router;
