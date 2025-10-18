const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Export template Excel
router.get('/export-template/:id_guru/:id_mapel/:id_kelas/:id_ta_semester', gradeController.exportGradeTemplate);

// Import grades from Excel
router.post('/import-from-excel', upload.single('file'), gradeController.importGradesFromExcel);

module.exports = router;
