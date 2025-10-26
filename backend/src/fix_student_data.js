// Script khusus untuk mengisi data nilai siswa yang ada
const { getDb } = require('./config/db');
const { format } = require('date-fns');

async function fixStudentData() {
    const db = getDb();

    const runQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this.lastID || this.changes);
            });
        });
    };

    const allQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    try {
        console.log('🔧 Memperbaiki data nilai siswa...\n');

        // Ambil semua siswa
        const allSiswa = await allQuery('SELECT * FROM Siswa');
        console.log(`📊 Total siswa: ${allSiswa.length}`);

        // Ambil semua TA/Semester
        const allTASemester = await allQuery('SELECT * FROM TahunAjaranSemester ORDER BY tahun_ajaran, semester');
        console.log(`📅 Total TA/Semester: ${allTASemester.length}`);

        // Ambil semua kelas
        const allKelas = await allQuery('SELECT * FROM Kelas ORDER BY nama_kelas');
        console.log(`🏫 Total kelas: ${allKelas.length}`);

        // Ambil semua guru
        const allGuru = await allQuery('SELECT * FROM Guru');
        console.log(`👨‍🏫 Total guru: ${allGuru.length}`);

        // Ambil semua mapel
        const allMapel = await allQuery('SELECT * FROM MataPelajaran');
        console.log(`📚 Total mapel: ${allMapel.length}\n`);

        // Update tahun_ajaran_masuk untuk siswa yang tidak punya
        console.log('📝 Mengupdate tahun_ajaran_masuk...');
        for (const siswa of allSiswa) {
            if (!siswa.tahun_ajaran_masuk) {
                await runQuery('UPDATE Siswa SET tahun_ajaran_masuk = ? WHERE id_siswa = ?', ['2023/2024', siswa.id_siswa]);
                siswa.tahun_ajaran_masuk = '2023/2024';
                console.log(`  ✅ Updated siswa ${siswa.id_siswa} - ${siswa.nama_siswa}`);
            }
        }

        // Assign siswa ke kelas
        console.log('\n🏫 Menugaskan siswa ke kelas...');
        let assignmentCount = 0;
        
        for (const siswa of allSiswa) {
            const tahunMasuk = parseInt(siswa.tahun_ajaran_masuk.split('/')[0]);
            
            for (const tas of allTASemester) {
                const currentYear = parseInt(tas.tahun_ajaran.split('/')[0]);
                const yearDiff = currentYear - tahunMasuk;
                
                // Tentukan tingkat kelas (1-6)
                let tingkat = yearDiff + 1;
                
                if (tingkat >= 1 && tingkat <= 6) {
                    // Pilih kelas untuk tingkat ini
                    const kelasForTingkat = allKelas.filter(k => 
                        k.nama_kelas.startsWith(tingkat.toString()) && k.id_ta_semester === tas.id_ta_semester
                    );
                    
                    if (kelasForTingkat.length > 0) {
                        // Pilih kelas pertama (atau random)
                        const selectedKelas = kelasForTingkat[0];
                        
                        try {
                            await runQuery(
                                'INSERT OR IGNORE INTO SiswaKelas (id_siswa, id_kelas, id_ta_semester) VALUES (?, ?, ?)',
                                [siswa.id_siswa, selectedKelas.id_kelas, tas.id_ta_semester]
                            );
                            assignmentCount++;
                        } catch (err) {
                            console.error(`  ❌ Error assigning siswa ${siswa.id_siswa} to kelas ${selectedKelas.nama_kelas}: ${err.message}`);
                        }
                    }
                }
            }
        }
        console.log(`  ✅ Total assignments: ${assignmentCount}`);

        // Generate nilai untuk setiap siswa
        console.log('\n📊 Generating nilai...');
        let nilaiCount = 0;

        for (const tas of allTASemester) {
            console.log(`\n  Processing: ${tas.tahun_ajaran} ${tas.semester}`);
            
            const kelasInThisSemester = allKelas.filter(k => k.id_ta_semester === tas.id_ta_semester);
            
            for (const kelas of kelasInThisSemester) {
                // Get students in this kelas
                const siswaInKelas = await allQuery(
                    'SELECT id_siswa FROM SiswaKelas WHERE id_kelas = ? AND id_ta_semester = ?',
                    [kelas.id_kelas, tas.id_ta_semester]
                );
                
                if (siswaInKelas.length === 0) continue;

                // Assign guru to this kelas for all mapel if not exists
                for (const guru of allGuru) {
                    for (const mapel of allMapel) {
                        try {
                            await runQuery(
                                'INSERT OR IGNORE INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)',
                                [guru.id_guru, mapel.id_mapel, kelas.id_kelas, tas.id_ta_semester]
                            );
                        } catch (err) {
                            // Ignore
                        }
                    }
                }

                // Get guru assignments for this kelas
                const guruMapelInKelas = await allQuery(
                    'SELECT id_guru, id_mapel FROM GuruMataPelajaranKelas WHERE id_kelas = ? AND id_ta_semester = ?',
                    [kelas.id_kelas, tas.id_ta_semester]
                );
                
                // Generate nilai for each student, guru, mapel combination
                for (const siswa of siswaInKelas) {
                    for (const assignment of guruMapelInKelas) {
                        // Generate 3 TP values
                        for (let tp = 1; tp <= 3; tp++) {
                            const baseScore = 70 + Math.random() * 25; // 70-95
                            const variance = (Math.random() - 0.5) * 10; // -5 to +5
                            const score = Math.max(60, Math.min(100, baseScore + variance));
                            
                            try {
                                await runQuery(
                                    'INSERT OR REPLACE INTO Nilai (id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, jenis_nilai, urutan_tp, nilai, tanggal_input, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                    [siswa.id_siswa, assignment.id_guru, assignment.id_mapel, kelas.id_kelas, tas.id_ta_semester, 'TP', tp, Math.round(score * 100) / 100, format(new Date(), 'yyyy-MM-dd HH:mm:ss'), `TP ${tp}`]
                                );
                                nilaiCount++;
                            } catch (err) {
                                // Ignore
                            }
                        }
                        
                        // Generate UAS value
                        const uasScore = 75 + Math.random() * 20; // 75-95
                        try {
                            await runQuery(
                                'INSERT OR REPLACE INTO Nilai (id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, jenis_nilai, urutan_tp, nilai, tanggal_input, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                [siswa.id_siswa, assignment.id_guru, assignment.id_mapel, kelas.id_kelas, tas.id_ta_semester, 'UAS', null, Math.round(uasScore * 100) / 100, format(new Date(), 'yyyy-MM-dd HH:mm:ss'), 'UAS']
                            );
                            nilaiCount++;
                        } catch (err) {
                            // Ignore
                        }
                    }
                }
            }
            console.log(`    ✅ Generated nilai for ${tas.tahun_ajaran} ${tas.semester}`);
        }

        console.log(`\n✅ Total nilai entries created: ${nilaiCount}`);
        console.log('\n🎉 Data siswa berhasil diperbaiki!\n');

        // Verify student 1001
        const nilai1001 = await allQuery('SELECT COUNT(*) as count FROM Nilai WHERE id_siswa = 1001');
        const kelas1001 = await allQuery('SELECT COUNT(*) as count FROM SiswaKelas WHERE id_siswa = 1001');
        console.log(`📊 Verifikasi siswa 1001:`);
        console.log(`   - Jumlah nilai: ${nilai1001[0].count}`);
        console.log(`   - Jumlah kelas: ${kelas1001[0].count}\n`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

// Run
fixStudentData();
