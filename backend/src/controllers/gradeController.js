const ExcelJS = require('exceljs');
const { getDb } = require('../config/db');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Export template Excel untuk input nilai
 * GET /api/grades/export-template/:id_guru/:id_mapel/:id_kelas/:id_ta_semester
 */
exports.exportGradeTemplate = async (req, res) => {
    try {
        const { id_guru, id_mapel, id_kelas, id_ta_semester } = req.params;
        
        const db = getDb();
        
        // 1. Get class and subject info
        const classInfo = await new Promise((resolve, reject) => {
            db.get(
                `SELECT k.nama_kelas, m.nama_mapel, tas.tahun_ajaran, tas.semester
                 FROM Kelas k, MataPelajaran m, TahunAjaranSemester tas
                 WHERE k.id_kelas = ? AND m.id_mapel = ? AND tas.id_ta_semester = ?`,
                [id_kelas, id_mapel, id_ta_semester],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
        
        if (!classInfo) {
            return res.status(404).json({ message: 'Kelas atau mapel tidak ditemukan' });
        }
        
        // 2. Get students list
        const students = await new Promise((resolve, reject) => {
            db.all(
                `SELECT s.id_siswa, s.nama_siswa
                 FROM Siswa s
                 INNER JOIN SiswaKelas sk ON s.id_siswa = sk.id_siswa
                 WHERE sk.id_kelas = ? AND sk.id_ta_semester = ?
                 ORDER BY s.nama_siswa`,
                [id_kelas, id_ta_semester],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        if (!students || students.length === 0) {
            return res.status(404).json({ message: 'Tidak ada siswa di kelas ini' });
        }
        
        // 3. Get TP columns from ATP
        const tingkatKelas = parseInt(classInfo.nama_kelas.match(/^(\d+)/)?.[1] || '1');
        let fase = 'A';
        if (tingkatKelas >= 1 && tingkatKelas <= 2) fase = 'A';
        else if (tingkatKelas >= 3 && tingkatKelas <= 4) fase = 'B';
        else if (tingkatKelas >= 5 && tingkatKelas <= 6) fase = 'C';
        
        const semesterNumber = classInfo.semester.toLowerCase() === 'ganjil' ? 1 : 2;
        
        // Get CP to find file_path
        const cpRow = await new Promise((resolve, reject) => {
            db.get(
                `SELECT cp.file_path, m.nama_mapel 
                 FROM CapaianPembelajaran cp
                 JOIN MataPelajaran m ON cp.id_mapel = m.id_mapel
                 WHERE cp.id_mapel = ? AND cp.fase = ?`,
                [id_mapel, fase],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
        
        let tpColumns = []; // Array of TP descriptions
        
        if (cpRow && cpRow.file_path) {
            try {
                const filePath = path.join(__dirname, '../../', cpRow.file_path);
                
                if (fs.existsSync(filePath)) {
                    const workbook = xlsx.readFile(filePath);
                    const targetSheetName = `ATP ${cpRow.nama_mapel} Fase ${fase}`;
                    const sheetName = workbook.SheetNames.find(name => 
                        name.toLowerCase() === targetSheetName.toLowerCase()
                    );
                    
                    if (sheetName) {
                        const sheet = workbook.Sheets[sheetName];
                        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                        
                        const headers = data[4] || [];
                        const rows = data.slice(5);
                        
                        const tpIndex = headers.findIndex(h => 
                            h && h.toString().toLowerCase().includes('tujuan pembelajaran')
                        );
                        const kelasIndex = headers.findIndex(h => 
                            h && h.toString().toLowerCase() === 'kelas'
                        );
                        const semesterIndex = headers.findIndex(h => 
                            h && h.toString().toLowerCase() === 'semester'
                        );
                        
                        // Filter by kelas and semester
                        rows.forEach(row => {
                            const kelasValue = row[kelasIndex];
                            const semesterValue = row[semesterIndex];
                            const tpDesc = row[tpIndex];
                            
                            if (kelasValue == tingkatKelas && semesterValue == semesterNumber && tpDesc && tpDesc.toString().trim() !== '') {
                                tpColumns.push(tpDesc.toString());
                            }
                        });
                    }
                }
            } catch (err) {
                console.log('Error loading TP from ATP:', err.message);
            }
        }
        
        // If no TP from ATP, use default
        if (tpColumns.length === 0) {
            tpColumns = ['TP 1', 'TP 2', 'TP 3']; // Default 3 TP
        }
        
        // 4. Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template Nilai');
        
        // Add info rows
        worksheet.mergeCells('A1:' + String.fromCharCode(65 + tpColumns.length + 2) + '1');
        worksheet.getCell('A1').value = 'TEMPLATE INPUT NILAI';
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        
        worksheet.getCell('A2').value = `Mata Pelajaran: ${classInfo.nama_mapel}`;
        worksheet.getCell('A2').font = { bold: false, size: 11 };
        
        worksheet.getCell('A3').value = `Kelas: ${classInfo.nama_kelas}`;
        worksheet.getCell('A3').font = { bold: false, size: 11 };
        
        worksheet.getCell('A4').value = `Tahun Ajaran: ${classInfo.tahun_ajaran} - Semester ${classInfo.semester}`;
        worksheet.getCell('A4').font = { bold: false, size: 11 };
        
        // Empty row
        worksheet.getCell('A5').value = '';
        
        // Header row (row 6)
        const headerRow = worksheet.getRow(6);
        const headerValues = ['ID Siswa', 'Nama Siswa'];
        tpColumns.forEach((_, index) => {
            headerValues.push(`TP ${index + 1}`);
        });
        headerValues.push('UAS');
        headerValues.push('Nilai Akhir');
        
        headerRow.values = headerValues;
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 20;
        
        // Set column widths
        worksheet.getColumn(1).width = 12; // ID Siswa
        worksheet.getColumn(2).width = 30; // Nama Siswa
        for (let i = 0; i < tpColumns.length; i++) {
            worksheet.getColumn(3 + i).width = 10; // TP columns
        }
        worksheet.getColumn(3 + tpColumns.length).width = 10; // UAS
        worksheet.getColumn(4 + tpColumns.length).width = 12; // Nilai Akhir
        
        // Add students data (starting from row 7)
        students.forEach((student, index) => {
            const rowNum = 7 + index;
            const row = worksheet.getRow(rowNum);
            
            const rowValues = [student.id_siswa, student.nama_siswa];
            tpColumns.forEach(() => {
                rowValues.push(''); // Empty cells for TP
            });
            rowValues.push(''); // Empty UAS
            
            // Formula for Nilai Akhir
            const tpStartCol = 3;
            const tpEndCol = 3 + tpColumns.length - 1;
            const uasCol = 3 + tpColumns.length;
            const finalCol = 4 + tpColumns.length;
            
            const tpStartLetter = String.fromCharCode(64 + tpStartCol);
            const tpEndLetter = String.fromCharCode(64 + tpEndCol);
            const uasLetter = String.fromCharCode(64 + uasCol);
            
            const avgTpFormula = `AVERAGE(${tpStartLetter}${rowNum}:${tpEndLetter}${rowNum})`;
            const finalFormula = `IF(OR(${uasLetter}${rowNum}="",COUNTBLANK(${tpStartLetter}${rowNum}:${tpEndLetter}${rowNum})=${tpColumns.length}),"",ROUND(${avgTpFormula}*0.7+${uasLetter}${rowNum}*0.3,2))`;
            
            rowValues.push({ formula: finalFormula });
            
            row.values = rowValues;
            
            // Add border to all cells
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            
            // Readonly for ID and Nama (light gray background)
            row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
            row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
            
            // Format number for final grade
            row.getCell(finalCol).numFmt = '0.00';
        });
        
        // Add TP descriptions in a separate sheet
        const descSheet = workbook.addWorksheet('Deskripsi TP');
        descSheet.columns = [
            { header: 'TP', key: 'tp_num', width: 10 },
            { header: 'Deskripsi', key: 'description', width: 80 }
        ];
        
        const descHeaderRow = descSheet.getRow(1);
        descHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        descHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF70AD47' }
        };
        
        tpColumns.forEach((desc, index) => {
            descSheet.addRow({
                tp_num: `TP ${index + 1}`,
                description: desc
            });
        });
        
        // 5. Send file
        // Sanitize filename: remove special chars, replace spaces with underscore
        const sanitizeFilename = (str) => {
            return str
                .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, hyphens
                .replace(/\s+/g, '_')      // Replace spaces with underscore
                .replace(/_+/g, '_')       // Replace multiple underscores with single
                .trim();
        };
        
        const mapelName = sanitizeFilename(classInfo.nama_mapel);
        const kelasName = sanitizeFilename(classInfo.nama_kelas);
        const semesterName = classInfo.semester === 'Ganjil' ? 'Ganjil' : 'Genap';
        const tahunAjaran = classInfo.tahun_ajaran.replace('/', '-'); // 2024/2025 -> 2024-2025
        
        // Format: Template_Nilai_[Mapel]_[Kelas]_[Semester]_[TahunAjaran].xlsx
        // Contoh: Template_Nilai_IPA_1_Gumujeng_Ganjil_2024-2025.xlsx
        const filename = `Template_Nilai_${mapelName}_${kelasName}_${semesterName}_${tahunAjaran}.xlsx`;
        
        console.log('=== EXPORT TEMPLATE DEBUG ===');
        console.log('Class Info:', classInfo);
        console.log('Mapel Name (sanitized):', mapelName);
        console.log('Kelas Name (sanitized):', kelasName);
        console.log('Semester:', semesterName);
        console.log('Tahun Ajaran:', tahunAjaran);
        console.log('Final Filename:', filename);
        console.log('===========================');
        
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (err) {
        console.error('Error exporting template:', err);
        res.status(500).json({ 
            message: 'Gagal export template', 
            error: err.message 
        });
    }
};

/**
 * Import nilai dari Excel
 * POST /api/grades/import-from-excel
 */
exports.importGradesFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File Excel tidak ditemukan' });
        }
        
        const { id_guru, id_mapel, id_kelas, id_ta_semester } = req.body;
        
        if (!id_guru || !id_mapel || !id_kelas || !id_ta_semester) {
            return res.status(400).json({ message: 'Parameter tidak lengkap' });
        }
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        
        const worksheet = workbook.getWorksheet('Template Nilai');
        
        if (!worksheet) {
            return res.status(400).json({ message: 'Sheet "Template Nilai" tidak ditemukan' });
        }
        
        const db = getDb();
        let successCount = 0;
        let failCount = 0;
        const errors = [];
        
        // Find header row (row 6)
        const headerRow = worksheet.getRow(6);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = cell.value;
        });
        
        // Find column indices
        const idSiswaCol = headers.findIndex(h => h === 'ID Siswa');
        const tpStartCol = headers.findIndex(h => h === 'TP 1');
        const uasCol = headers.findIndex(h => h === 'UAS');
        
        if (idSiswaCol === -1 || tpStartCol === -1 || uasCol === -1) {
            return res.status(400).json({ message: 'Format Excel tidak sesuai template' });
        }
        
        // Count TP columns
        let tpCount = 0;
        for (let i = tpStartCol; i < uasCol; i++) {
            if (headers[i] && headers[i].toString().startsWith('TP ')) {
                tpCount++;
            }
        }
        
        // Process each student row (starting from row 7)
        for (let rowNum = 7; rowNum <= worksheet.rowCount; rowNum++) {
            const row = worksheet.getRow(rowNum);
            const idSiswa = row.getCell(idSiswaCol).value;
            
            if (!idSiswa) continue; // Skip empty rows
            
            // Verify student exists
            const student = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT id_siswa FROM Siswa WHERE id_siswa = ?',
                    [idSiswa],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
            
            if (!student) {
                errors.push(`ID Siswa ${idSiswa} tidak ditemukan`);
                failCount++;
                continue;
            }
            
            // Save TP grades
            for (let tpNum = 1; tpNum <= tpCount; tpNum++) {
                const colIndex = tpStartCol + (tpNum - 1);
                const gradeValue = row.getCell(colIndex).value;
                
                if (gradeValue !== null && gradeValue !== '' && gradeValue !== undefined) {
                    const nilai = parseFloat(gradeValue);
                    
                    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
                        errors.push(`Nilai TP${tpNum} untuk ID ${idSiswa} tidak valid: ${gradeValue}`);
                        failCount++;
                        continue;
                    }
                    
                    try {
                        await new Promise((resolve, reject) => {
                            db.run(
                                `INSERT INTO Nilai (id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, jenis_nilai, urutan_tp, nilai, tanggal_input, keterangan)
                                 VALUES (?, ?, ?, ?, ?, 'TP', ?, ?, datetime('now'), ?)
                                 ON CONFLICT(id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, jenis_nilai, urutan_tp)
                                 DO UPDATE SET nilai = excluded.nilai, tanggal_input = datetime('now')`,
                                [student.id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, tpNum, nilai, `TP ${tpNum}`],
                                function(err) {
                                    if (err) reject(err);
                                    else resolve();
                                }
                            );
                        });
                        successCount++;
                    } catch (err) {
                        errors.push(`Gagal menyimpan TP${tpNum} untuk ID ${idSiswa}: ${err.message}`);
                        failCount++;
                    }
                }
            }
            
            // Save UAS grade
            const uasValue = row.getCell(uasCol).value;
            
            if (uasValue !== null && uasValue !== '' && uasValue !== undefined) {
                const nilai = parseFloat(uasValue);
                
                if (isNaN(nilai) || nilai < 0 || nilai > 100) {
                    errors.push(`Nilai UAS untuk ID ${idSiswa} tidak valid: ${uasValue}`);
                    failCount++;
                    continue;
                }
                
                try {
                    await new Promise((resolve, reject) => {
                        db.run(
                            `INSERT INTO Nilai (id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, jenis_nilai, urutan_tp, nilai, tanggal_input, keterangan)
                             VALUES (?, ?, ?, ?, ?, 'UAS', NULL, ?, datetime('now'), 'UAS')
                             ON CONFLICT(id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, jenis_nilai, urutan_tp)
                             DO UPDATE SET nilai = excluded.nilai, tanggal_input = datetime('now')`,
                            [student.id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, nilai],
                            function(err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                    successCount++;
                } catch (err) {
                    errors.push(`Gagal menyimpan UAS untuk ID ${idSiswa}: ${err.message}`);
                    failCount++;
                }
            }
        }
        
        res.status(200).json({
            message: `Import selesai. Berhasil: ${successCount}, Gagal: ${failCount}`,
            success: successCount,
            failed: failCount,
            errors: errors
        });
        
    } catch (err) {
        console.error('Error importing grades:', err);
        res.status(500).json({ 
            message: 'Gagal import nilai dari Excel', 
            error: err.message 
        });
    }
};
