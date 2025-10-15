const express = require('express');
const router = express.Router();
const upload = require('../middlewares/fileUpload');
const excelController = require('../controllers/excelController');

// Route untuk import Excel CP
router.post('/import-cp', upload.single('file'), excelController.importCapaianPembelajaran);

// Route untuk membaca ATP berdasarkan mapel dan fase
router.get('/atp/:id_mapel/:fase', excelController.getAtpByFase);

// Route untuk mengambil TP berdasarkan mapel, fase, dan kelas
router.get('/tp/:id_mapel/:fase/:id_kelas', excelController.getTpByMapelFaseKelas);

module.exports = router;