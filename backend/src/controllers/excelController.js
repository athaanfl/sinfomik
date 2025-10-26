const xlsx = require('xlsx');
const { getDb } = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.importCapaianPembelajaran = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Mohon upload file Excel' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert Excel ke JSON dengan header: 1 untuk mendapatkan array 2D
        // data[row][col] - ingat bahwa index dimulai dari 0
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        /* 
        Format Excel yang diharapkan:
        Baris 2 (index 1): CAPAIAN PEMBELAJARAN CITIZENSHIP
        Baris 3 (index 2): TAHUN AJARAN 2025/2026
        Baris 5 (index 4): [Header Fase A] [Header Fase B] [Header Fase C]
        Baris 6 (index 5): [Deskripsi A] [Deskripsi B] [Deskripsi C]
        */
        
        const db = getDb();
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Baca judul di sel A2 (baris 2 kolom 1) -> data[1][0]
        const titleRow = data[1][0]; // "CAPAIAN PEMBELAJARAN CITIZENSHIP" or "CAPAIAN PEMBELAJARAN Life Skills"
        
        // Extract mapel name: remove "CAPAIAN PEMBELAJARAN " prefix
        // Handle both single word (CITIZENSHIP) and multi-word (Life Skills) subjects
        const mapelName = titleRow
            .replace(/^CAPAIAN PEMBELAJARAN\s+/i, '') // Remove prefix (case insensitive)
            .trim();
        
        console.log('Title Row:', titleRow);
        console.log('Extracted Mapel Name:', mapelName); 
        
        // Dapatkan id_mapel
        try {
            const mapelRow = await new Promise((resolve, reject) => {
                db.get(
                    "SELECT id_mapel FROM MataPelajaran WHERE nama_mapel = ?",
                    [mapelName],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (!mapelRow) {
                throw new Error(`Mata pelajaran ${mapelName} tidak ditemukan`);
            }

            const id_mapel = mapelRow.id_mapel;

            // Simpan file Excel ke folder uploads
            const uploadsDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Buat nama file unik dengan timestamp
            const timestamp = Date.now();
            const fileName = `cp_${mapelName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.xlsx`;
            const filePath = path.join(uploadsDir, fileName);
            
            // Simpan file
            fs.writeFileSync(filePath, req.file.buffer);
            
            // Simpan relative path untuk database
            const relativeFilePath = `uploads/${fileName}`;

            // Validasi format Excel
            if (!data[4] || !data[5]) {
                throw new Error('Format Excel tidak sesuai. Pastikan ada header fase di baris 5 dan deskripsi di baris 6');
            }

            // Proses setiap fase (A, B, C)
            const fases = ['A', 'B', 'C'];
            for (let i = 0; i < fases.length; i++) {
                const fase = fases[i];
                // Baca deskripsi dari baris 6 (index 5)
                // Kolom A = index 0, Kolom B = index 1, Kolom C = index 2
                const deskripsi = data[5][i];

                if (deskripsi && deskripsi.trim()) {
                    try {
                        await new Promise((resolve, reject) => {
                            db.run(
                                `INSERT INTO CapaianPembelajaran (id_mapel, fase, deskripsi_cp, file_path)
                                VALUES (?, ?, ?, ?)
                                ON CONFLICT(id_mapel, fase) 
                                DO UPDATE SET deskripsi_cp = ?, file_path = ?`,
                                [id_mapel, fase, deskripsi, relativeFilePath, deskripsi, relativeFilePath],
                                function(err) {
                                    if (err) reject(err);
                                    results.success++;
                                    resolve();
                                }
                            );
                        });
                    } catch (err) {
                        results.failed++;
                        results.errors.push(`Error pada fase ${fase}: ${err.message}`);
                    }
                }
            }

            res.json({
                message: `Import berhasil. ${results.success} CP diperbarui.`,
                details: results
            });

        } catch (err) {
            throw new Error(`Error memproses mata pelajaran: ${err.message}`);
        }

    } catch (err) {
        console.error('Error importing excel:', err);
        res.status(500).json({ 
            message: 'Gagal memproses file Excel', 
            error: err.message 
        });
    }
};

exports.getAtpByFase = async (req, res) => {
    try {
        const { id_mapel, fase } = req.params;
        
        const db = getDb();
        
        // Ambil file_path dari database
        const cpRow = await new Promise((resolve, reject) => {
            db.get(
                `SELECT cp.file_path, m.nama_mapel 
                 FROM CapaianPembelajaran cp
                 JOIN MataPelajaran m ON cp.id_mapel = m.id_mapel
                 WHERE cp.id_mapel = ? AND cp.fase = ?`,
                [id_mapel, fase],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (!cpRow || !cpRow.file_path) {
            return res.status(404).json({ 
                message: 'File Excel tidak ditemukan untuk mata pelajaran dan fase ini' 
            });
        }

        // Baca file Excel
        const filePath = path.join(__dirname, '../../', cpRow.file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                message: 'File Excel tidak ditemukan di server' 
            });
        }

        const workbook = xlsx.readFile(filePath);
        
        // Cari sheet yang sesuai dengan fase
        // Format nama sheet: "ATP [NamaMapel] Fase [A/B/C]"
        // Cari dengan case-insensitive
        const targetSheetName = `ATP ${cpRow.nama_mapel} Fase ${fase}`;
        const sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase() === targetSheetName.toLowerCase()
        );
        
        if (!sheetName) {
            return res.status(404).json({ 
                message: `Sheet "ATP ${cpRow.nama_mapel} Fase ${fase}" tidak ditemukan di file Excel`,
                availableSheets: workbook.SheetNames
            });
        }

        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet ke JSON dengan header di baris 5 (index 4)
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        // Header ada di baris 5 (index 4): ["Elemen", "CP", "TP", "KKTP", "Materi Pokok", "Kelas", "Semester"]
        // Data mulai dari baris 6 (index 5)
        const headers = data[4] || [];
        const rows = data.slice(5); // Mulai dari baris 6
        
        // Convert ke format array of objects
        const atpData = rows
            .filter(row => row.some(cell => cell !== '')) // Filter baris kosong
            .map(row => {
                const obj = {};
                headers.forEach((header, idx) => {
                    obj[header] = row[idx] || '';
                });
                return obj;
            });

        res.json({
            success: true,
            mapel: cpRow.nama_mapel,
            fase: fase,
            sheetName: sheetName,
            headers: headers,
            data: atpData,
            totalRows: atpData.length
        });

    } catch (err) {
        console.error('Error reading ATP:', err);
        res.status(500).json({ 
            message: 'Gagal membaca data ATP', 
            error: err.message 
        });
    }
};

/**
 * Update ATP data in Excel file
 * PUT /api/excel/atp/:id_mapel/:fase
 * Body: { data: [{ Elemen, CP, TP, KKTP, "Materi Pokok", Kelas, Semester }, ...] }
 */
exports.updateAtpByFase = async (req, res) => {
    try {
        const { id_mapel, fase } = req.params;
        const { data: updatedData } = req.body;

        if (!updatedData || !Array.isArray(updatedData)) {
            return res.status(400).json({ 
                message: 'Data ATP tidak valid. Expected array of objects.' 
            });
        }

        const db = getDb();
        
        // Ambil file_path dari database
        const cpRow = await new Promise((resolve, reject) => {
            db.get(
                `SELECT cp.file_path, m.nama_mapel 
                 FROM CapaianPembelajaran cp
                 JOIN MataPelajaran m ON cp.id_mapel = m.id_mapel
                 WHERE cp.id_mapel = ? AND cp.fase = ?`,
                [id_mapel, fase],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (!cpRow || !cpRow.file_path) {
            return res.status(404).json({ 
                message: 'File Excel tidak ditemukan untuk mata pelajaran dan fase ini' 
            });
        }

        // Baca file Excel
        const filePath = path.join(__dirname, '../../', cpRow.file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                message: 'File Excel tidak ditemukan di server' 
            });
        }

        // Read workbook
        const workbook = xlsx.readFile(filePath);
        
        // Cari sheet yang sesuai dengan fase
        const targetSheetName = `ATP ${cpRow.nama_mapel} Fase ${fase}`;
        const sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase() === targetSheetName.toLowerCase()
        );
        
        if (!sheetName) {
            return res.status(404).json({ 
                message: `Sheet "ATP ${cpRow.nama_mapel} Fase ${fase}" tidak ditemukan di file Excel`,
                availableSheets: workbook.SheetNames
            });
        }

        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet ke JSON dengan header di baris 5 (index 4)
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        // Header ada di baris 5 (index 4)
        const headers = data[4] || [];
        
        // Validasi: pastikan semua kolom dari updatedData ada di headers
        const firstRow = updatedData[0];
        if (firstRow) {
            const incomingKeys = Object.keys(firstRow);
            const missingKeys = incomingKeys.filter(key => !headers.includes(key));
            if (missingKeys.length > 0) {
                return res.status(400).json({ 
                    message: 'Kolom tidak valid dalam data',
                    missingKeys: missingKeys,
                    validHeaders: headers
                });
            }
        }

        // Update data rows (mulai dari index 5, karena index 0-4 adalah header/metadata)
        const newRows = updatedData.map(rowData => {
            return headers.map(header => rowData[header] || '');
        });

        // Gabungkan metadata (baris 0-4) dengan data baru (baris 5+)
        const updatedSheetData = [
            ...data.slice(0, 5), // Keep header rows (index 0-4)
            ...newRows            // New data rows (index 5+)
        ];

        // Convert array kembali ke sheet
        const newSheet = xlsx.utils.aoa_to_sheet(updatedSheetData);
        
        // Replace sheet di workbook
        workbook.Sheets[sheetName] = newSheet;

        // Save file Excel
        xlsx.writeFile(workbook, filePath);

        res.json({
            success: true,
            message: 'ATP berhasil diupdate',
            mapel: cpRow.nama_mapel,
            fase: fase,
            rowsUpdated: newRows.length
        });

    } catch (err) {
        console.error('Error updating ATP:', err);
        res.status(500).json({ 
            message: 'Gagal mengupdate ATP', 
            error: err.message 
        });
    }
};

/**
 * Get TP (Tujuan Pembelajaran) by Mapel, Fase, Kelas, and Semester
 * Filter ATP berdasarkan tingkat kelas dan semester aktif
 */
exports.getTpByMapelFaseKelas = async (req, res) => {
    try {
        const { id_mapel, fase, id_kelas } = req.params;
        const { semester } = req.query; // Get semester from query parameter (1 = Ganjil, 2 = Genap)
        
        const db = getDb();
        
        // Ambil nama kelas dan id_ta_semester untuk validasi
        const kelasRow = await new Promise((resolve, reject) => {
            db.get(
                'SELECT k.nama_kelas, k.id_ta_semester, tas.semester FROM Kelas k LEFT JOIN TahunAjaranSemester tas ON k.id_ta_semester = tas.id_ta_semester WHERE k.id_kelas = ?',
                [id_kelas],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (!kelasRow) {
            return res.status(404).json({ 
                message: 'Kelas tidak ditemukan' 
            });
        }

        // Determine semester filter
        let semesterFilter = null;
        if (semester) {
            semesterFilter = parseInt(semester);
        } else if (kelasRow.semester) {
            // Auto-detect from kelas's semester (Ganjil = 1, Genap = 2)
            semesterFilter = kelasRow.semester.toLowerCase() === 'ganjil' ? 1 : 2;
        }

        // Ekstrak tingkat kelas dari nama_kelas
        // Misal: "1 Gumujeng" -> tingkat = 1, "2 A" -> tingkat = 2
        const match = kelasRow.nama_kelas.match(/^(\d+)/);
        if (!match) {
            return res.status(400).json({ 
                message: 'Format nama kelas tidak valid (harus diawali angka)',
                nama_kelas: kelasRow.nama_kelas
            });
        }
        
        const tingkatKelas = parseInt(match[1]);
        
        // Ambil file_path dari database
        const cpRow = await new Promise((resolve, reject) => {
            db.get(
                `SELECT cp.file_path, m.nama_mapel 
                 FROM CapaianPembelajaran cp
                 JOIN MataPelajaran m ON cp.id_mapel = m.id_mapel
                 WHERE cp.id_mapel = ? AND cp.fase = ?`,
                [id_mapel, fase],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (!cpRow || !cpRow.file_path) {
            return res.status(404).json({ 
                message: 'File Excel tidak ditemukan untuk mata pelajaran dan fase ini' 
            });
        }

        // Baca file Excel
        const filePath = path.join(__dirname, '../../', cpRow.file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                message: 'File Excel tidak ditemukan di server' 
            });
        }

        const workbook = xlsx.readFile(filePath);
        
        // Cari sheet yang sesuai dengan fase
        const targetSheetName = `ATP ${cpRow.nama_mapel} Fase ${fase}`;
        const sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase() === targetSheetName.toLowerCase()
        );
        
        if (!sheetName) {
            return res.status(404).json({ 
                message: `Sheet "ATP ${cpRow.nama_mapel} Fase ${fase}" tidak ditemukan di file Excel`,
                availableSheets: workbook.SheetNames
            });
        }

        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet ke JSON dengan header di baris 5 (index 4)
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        // Header ada di baris 5 (index 4)
        const headers = data[4] || [];
        const rows = data.slice(5); // Data mulai dari baris 6
        
        // Find index kolom yang relevan
        const tpIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('tujuan pembelajaran')
        );
        const kelasIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase() === 'kelas'
        );
        const semesterIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase() === 'semester'
        );
        const kktpIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('kktp')
        );

        if (tpIndex === -1 || kelasIndex === -1) {
            return res.status(500).json({ 
                message: 'Struktur Excel tidak valid (kolom TP atau Kelas tidak ditemukan)',
                headers: headers
            });
        }

        // Filter TP berdasarkan tingkat kelas DAN semester
        const tpList = rows
            .filter(row => {
                // Filter: kelas harus sesuai dan TP tidak kosong
                const kelasExcel = row[kelasIndex];
                const tpText = row[tpIndex];
                const semesterExcel = row[semesterIndex];
                
                // Basic filters: kelas dan TP tidak kosong
                const basicMatch = kelasExcel && 
                       parseInt(kelasExcel) === tingkatKelas && 
                       tpText && 
                       tpText.toString().trim() !== '';
                
                // Semester filter (jika ada)
                if (semesterFilter && semesterIndex !== -1 && semesterExcel) {
                    return basicMatch && parseInt(semesterExcel) === semesterFilter;
                }
                
                return basicMatch;
            })
            .map((row, index) => ({
                urutan_tp: index + 1,
                tujuan_pembelajaran: row[tpIndex],
                semester: row[semesterIndex] || null,
                kktp: row[kktpIndex] || null,
                kelas_excel: row[kelasIndex]
            }));

        res.json({
            success: true,
            mapel: cpRow.nama_mapel,
            fase: fase,
            nama_kelas: kelasRow.nama_kelas,
            tingkat_kelas: tingkatKelas,
            semester_filter: semesterFilter,
            semester_text: semesterFilter === 1 ? 'Ganjil' : semesterFilter === 2 ? 'Genap' : 'Semua',
            total_tp: tpList.length,
            tp_list: tpList
        });

    } catch (err) {
        console.error('Error reading TP:', err);
        res.status(500).json({ 
            message: 'Gagal membaca data TP', 
            error: err.message 
        });
    }
};