// Sistem Prediksi Nilai Siswa menggunakan Regresi Linear
const { getDb } = require('./config/db');

class NilaiPredictionSystem {
    constructor() {
        this.db = getDb();
    }

    // Fungsi bantuan untuk query database
    allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Implementasi Regresi Linear Sederhana
    simpleLinearRegression(dataPoints) {
        const n = dataPoints.length;
        if (n < 2) return null;

        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        dataPoints.forEach((point, index) => {
            const x = index + 1; // Urutan waktu (1, 2, 3, ...)
            const y = point.nilai;
            
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });

        // Hitung slope (m) dan intercept (b) untuk y = mx + b
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Hitung R-squared untuk mengukur akurasi
        const yMean = sumY / n;
        let ssRes = 0, ssTot = 0;
        
        dataPoints.forEach((point, index) => {
            const x = index + 1;
            const y = point.nilai;
            const yPred = slope * x + intercept;
            
            ssRes += Math.pow(y - yPred, 2);
            ssTot += Math.pow(y - yMean, 2);
        });

        const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

        return {
            slope,
            intercept,
            rSquared,
            accuracy: Math.max(0, Math.min(100, rSquared * 100)) // Convert to percentage, clamped 0-100
        };
    }

    // Prediksi nilai berikutnya
    predictNextValue(dataPoints, stepsAhead = 1) {
        const regression = this.simpleLinearRegression(dataPoints);
        if (!regression) return null;

        const nextX = dataPoints.length + stepsAhead;
        let predictedValue = regression.slope * nextX + regression.intercept;

        // Batasi nilai antara 0-100
        predictedValue = Math.max(0, Math.min(100, predictedValue));

        return {
            predictedValue: Math.round(predictedValue * 100) / 100, // Round to 2 decimal places
            confidence: regression.accuracy,
            trend: regression.slope > 0 ? 'Meningkat' : regression.slope < 0 ? 'Menurun' : 'Stabil',
            regression
        };
    }

    // Ambil data historis nilai siswa
    async getStudentGradeHistory(studentId, mapelId, tipeNilaiId = null) {
        let query = `
            SELECT n.nilai, n.tanggal_input, tn.nama_tipe, mp.nama_mapel, s.nama_siswa
            FROM Nilai n
            JOIN Siswa s ON n.id_siswa = s.id_siswa
            JOIN MataPelajaran mp ON n.id_mapel = mp.id_mapel
            JOIN TipeNilai tn ON n.id_tipe_nilai = tn.id_tipe_nilai
            WHERE n.id_siswa = ? AND n.id_mapel = ?
        `;
        
        const params = [studentId, mapelId];
        
        if (tipeNilaiId) {
            query += ` AND n.id_tipe_nilai = ?`;
            params.push(tipeNilaiId);
        }
        
        query += ` ORDER BY n.tanggal_input ASC`;
        
        return await this.allQuery(query, params);
    }

    // Prediksi untuk siswa tertentu pada mata pelajaran tertentu
    async predictStudentGrade(studentId, mapelId, tipeNilaiId = null) {
        try {
            const history = await this.getStudentGradeHistory(studentId, mapelId, tipeNilaiId);
            
            if (history.length === 0) {
                return {
                    error: 'Tidak ada data historis untuk siswa ini',
                    studentId,
                    mapelId,
                    tipeNilaiId
                };
            }

            const prediction = this.predictNextValue(history);
            
            if (!prediction) {
                return {
                    error: 'Data tidak cukup untuk prediksi (minimal 2 data)',
                    dataCount: history.length
                };
            }

            return {
                studentInfo: {
                    nama: history[0].nama_siswa,
                    mapel: history[0].nama_mapel,
                    tipeNilai: tipeNilaiId ? history[0].nama_tipe : 'Semua'
                },
                historicalData: history,
                prediction: {
                    nilaiPrediksi: prediction.predictedValue,
                    confidence: Math.round(prediction.confidence),
                    trend: prediction.trend,
                    akurasi: `${Math.round(prediction.confidence)}%`
                },
                analysis: {
                    jumlahData: history.length,
                    nilaiTerakhir: history[history.length - 1].nilai,
                    nilaiTertinggi: Math.max(...history.map(h => h.nilai)),
                    nilaiTerendah: Math.min(...history.map(h => h.nilai)),
                    rataRata: Math.round((history.reduce((sum, h) => sum + h.nilai, 0) / history.length) * 100) / 100
                }
            };
        } catch (error) {
            return {
                error: 'Error dalam prediksi: ' + error.message
            };
        }
    }

    // Prediksi untuk semua siswa dalam mata pelajaran tertentu
    async predictClassGrades(mapelId, tipeNilaiId = null) {
        try {
            // Ambil semua siswa yang memiliki nilai pada mata pelajaran ini
            const students = await this.allQuery(`
                SELECT DISTINCT s.id_siswa, s.nama_siswa
                FROM Siswa s
                JOIN Nilai n ON s.id_siswa = n.id_siswa
                WHERE n.id_mapel = ?
            `, [mapelId]);

            const predictions = [];

            for (const student of students) {
                const prediction = await this.predictStudentGrade(student.id_siswa, mapelId, tipeNilaiId);
                if (!prediction.error) {
                    predictions.push(prediction);
                }
            }

            return {
                mapelInfo: predictions.length > 0 ? predictions[0].studentInfo.mapel : 'Unknown',
                totalStudents: predictions.length,
                predictions: predictions.sort((a, b) => b.prediction.nilaiPrediksi - a.prediction.nilaiPrediksi)
            };
        } catch (error) {
            return {
                error: 'Error dalam prediksi kelas: ' + error.message
            };
        }
    }

    // Analisis tren kelas
    async analyzeClassTrends(mapelId) {
        try {
            const classData = await this.predictClassGrades(mapelId);
            
            if (classData.error) return classData;

            const trends = {
                meningkat: classData.predictions.filter(p => p.prediction.trend === 'Meningkat').length,
                menurun: classData.predictions.filter(p => p.prediction.trend === 'Menurun').length,
                stabil: classData.predictions.filter(p => p.prediction.trend === 'Stabil').length
            };

            const avgPrediction = classData.predictions.reduce((sum, p) => sum + p.prediction.nilaiPrediksi, 0) / classData.predictions.length;
            const avgConfidence = classData.predictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / classData.predictions.length;

            return {
                ...classData,
                classTrends: trends,
                classAverage: {
                    prediksiRataRata: Math.round(avgPrediction * 100) / 100,
                    akurasiRataRata: Math.round(avgConfidence),
                    trendDominan: Object.keys(trends).reduce((a, b) => trends[a] > trends[b] ? a : b)
                }
            };
        } catch (error) {
            return {
                error: 'Error dalam analisis tren: ' + error.message
            };
        }
    }
}

// Fungsi utama untuk demo
async function demonstratePrediction() {
    const predictor = new NilaiPredictionSystem();
    
    console.log('=== SISTEM PREDIKSI NILAI SISWA ===\n');

    try {
        // Demo 1: Prediksi untuk siswa tertentu
        console.log('1. PREDIKSI INDIVIDUAL SISWA');
        console.log('================================');
        
        // Ambil contoh siswa dan mata pelajaran
        const sampleStudent = await predictor.getQuery("SELECT id_siswa, nama_siswa FROM Siswa WHERE nama_siswa LIKE '%Andi%' LIMIT 1");
        const sampleMapel = await predictor.getQuery("SELECT id_mapel, nama_mapel FROM MataPelajaran WHERE nama_mapel = 'Matematika'");
        
        if (sampleStudent && sampleMapel) {
            const prediction = await predictor.predictStudentGrade(sampleStudent.id_siswa, sampleMapel.id_mapel);
            
            if (!prediction.error) {
                console.log(`Siswa: ${prediction.studentInfo.nama}`);
                console.log(`Mata Pelajaran: ${prediction.studentInfo.mapel}`);
                console.log(`Jumlah Data Historis: ${prediction.analysis.jumlahData}`);
                console.log(`Nilai Terakhir: ${prediction.analysis.nilaiTerakhir}`);
                console.log(`Rata-rata Historis: ${prediction.analysis.rataRata}`);
                console.log(`PREDIKSI NILAI BERIKUTNYA: ${prediction.prediction.nilaiPrediksi}`);
                console.log(`Trend: ${prediction.prediction.trend}`);
                console.log(`Tingkat Akurasi: ${prediction.prediction.akurasi}`);
            } else {
                console.log('Error:', prediction.error);
            }
        }

        console.log('\n2. ANALISIS TREN KELAS');
        console.log('======================');
        
        if (sampleMapel) {
            const classTrends = await predictor.analyzeClassTrends(sampleMapel.id_mapel);
            
            if (!classTrends.error) {
                console.log(`Mata Pelajaran: ${classTrends.mapelInfo}`);
                console.log(`Total Siswa: ${classTrends.totalStudents}`);
                console.log(`Prediksi Rata-rata Kelas: ${classTrends.classAverage.prediksiRataRata}`);
                console.log(`Akurasi Rata-rata: ${classTrends.classAverage.akurasiRataRata}%`);
                console.log(`Trend Dominan: ${classTrends.classAverage.trendDominan}`);
                console.log('\nDistribusi Trend:');
                console.log(`- Meningkat: ${classTrends.classTrends.meningkat} siswa`);
                console.log(`- Menurun: ${classTrends.classTrends.menurun} siswa`);
                console.log(`- Stabil: ${classTrends.classTrends.stabil} siswa`);
                
                console.log('\nTop 5 Prediksi Tertinggi:');
                classTrends.predictions.slice(0, 5).forEach((pred, index) => {
                    console.log(`${index + 1}. ${pred.studentInfo.nama}: ${pred.prediction.nilaiPrediksi} (${pred.prediction.trend})`);
                });
            } else {
                console.log('Error:', classTrends.error);
            }
        }

        console.log('\n3. CONTOH PREDIKSI BERDASARKAN TIPE NILAI');
        console.log('==========================================');
        
        // Demo prediksi untuk UTS
        const utsType = await predictor.getQuery("SELECT id_tipe_nilai FROM TipeNilai WHERE nama_tipe = 'UTS'");
        if (sampleStudent && sampleMapel && utsType) {
            const utsPrediction = await predictor.predictStudentGrade(sampleStudent.id_siswa, sampleMapel.id_mapel, utsType.id_tipe_nilai);
            
            if (!utsPrediction.error) {
                console.log(`Prediksi UTS ${utsPrediction.studentInfo.nama} - ${utsPrediction.studentInfo.mapel}:`);
                console.log(`Nilai Prediksi: ${utsPrediction.prediction.nilaiPrediksi}`);
                console.log(`Trend: ${utsPrediction.prediction.trend}`);
                console.log(`Akurasi: ${utsPrediction.prediction.akurasi}`);
            }
        }

    } catch (error) {
        console.error('Error dalam demonstrasi:', error);
    }
}

// Export untuk digunakan di tempat lain
module.exports = { NilaiPredictionSystem };

// Jalankan demo jika file ini dijalankan langsung
if (require.main === module) {
    demonstratePrediction();
}
