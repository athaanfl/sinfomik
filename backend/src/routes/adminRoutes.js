// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // Untuk otorisasi

// Contoh endpoint untuk manajemen siswa (hanya admin yang bisa akses)
// router.get('/students', authenticateToken, authorizeRole(['admin']), adminController.getAllStudents);

// Untuk demo awal tanpa otorisasi JWT:
router.get('/students', adminController.getAllStudents);
router.post('/students', adminController.addStudent);
router.put('/students/:id', adminController.updateStudent); // Endpoint UPDATE siswa
router.delete('/students/:id', adminController.deleteStudent); // Endpoint DELETE siswa

router.get('/ta-semester', adminController.getAllTASemester);
router.post('/ta-semester', adminController.addTASemester);
router.put('/ta-semester/set-active/:id', adminController.setActiveTASemester);

router.get('/kelas', adminController.getAllKelas); // Bisa filter by id_ta_semester
router.post('/kelas', adminController.addKelas);

router.get('/mapel', adminController.getAllMataPelajaran);
router.post('/mapel', adminController.addMataPelajaran);

router.get('/tipe-nilai', adminController.getAllTipeNilai);
router.post('/tipe-nilai', adminController.addTipeNilai);

// Endpoint Guru (sudah disesuaikan dengan /teachers)
router.get('/teachers', adminController.getAllTeachers);
router.post('/teachers', adminController.addTeacher);
router.put('/teachers/:id', adminController.updateTeacher); // Endpoint UPDATE guru
router.delete('/teachers/:id', adminController.deleteTeacher); // Endpoint DELETE guru

router.post('/siswa-kelas', adminController.assignSiswaToKelas);
router.get('/siswa-in-kelas/:id_kelas/:id_ta_semester', adminController.getSiswaInKelas); // Mengambil siswa di kelas tertentu

router.post('/guru-mapel-kelas', adminController.assignGuruToMapelKelas);
router.get('/guru-mapel-kelas/:id_ta_semester', adminController.getGuruMapelKelasAssignments); // Mengambil penugasan guru

router.post('/promote-students', adminController.promoteStudents); // Endpoint untuk kenaikan kelas

module.exports = router;
