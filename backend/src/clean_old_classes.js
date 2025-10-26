// Script untuk menghapus semua kelas lama dan data terkait
const { getDb } = require('./config/db');

async function cleanOldClasses() {
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
        console.log('🧹 Memulai pembersihan kelas lama...\n');

        // Daftar kelas yang diizinkan
        const allowedKelasNames = [
            '1 Gumujeng', '1 Someah', '1 Darehdeh',
            '2 Gentur', '2 Rancage', '2 Daria',
            '3 Calakan', '3 Singer', '3 Rancingeus',
            '4 Jatmika', '4 Gumanti', '4 Marahmay',
            '5 Rucita', '5 Binangkit', '5 Macakal',
            '6 Gumilang', '6 Sonagar', '6 Parigel'
        ];

        // Ambil semua kelas yang tidak sesuai
        const kelasLama = await allQuery(`SELECT id_kelas, nama_kelas FROM Kelas WHERE nama_kelas NOT IN (${allowedKelasNames.map(() => '?').join(',')})`, allowedKelasNames);
        
        console.log(`📋 Ditemukan ${kelasLama.length} kelas lama yang akan dihapus:`);
        kelasLama.forEach(k => console.log(`   - ${k.nama_kelas} (ID: ${k.id_kelas})`));
        
        if (kelasLama.length > 0) {
            console.log('\n🗑️  Menghapus data terkait kelas lama...');
            
            for (const kelas of kelasLama) {
                // Hapus nilai
                const nilaiDeleted = await runQuery('DELETE FROM Nilai WHERE id_kelas = ?', [kelas.id_kelas]);
                console.log(`   ✅ Nilai dihapus untuk kelas ${kelas.nama_kelas}: ${nilaiDeleted} rows`);
                
                // Hapus siswa kelas
                const siswaKelasDeleted = await runQuery('DELETE FROM SiswaKelas WHERE id_kelas = ?', [kelas.id_kelas]);
                console.log(`   ✅ SiswaKelas dihapus untuk kelas ${kelas.nama_kelas}: ${siswaKelasDeleted} rows`);
                
                // Hapus guru mapel kelas
                const guruMapelDeleted = await runQuery('DELETE FROM GuruMataPelajaranKelas WHERE id_kelas = ?', [kelas.id_kelas]);
                console.log(`   ✅ GuruMataPelajaranKelas dihapus untuk kelas ${kelas.nama_kelas}: ${guruMapelDeleted} rows`);
                
                // Hapus kelas
                await runQuery('DELETE FROM Kelas WHERE id_kelas = ?', [kelas.id_kelas]);
                console.log(`   ✅ Kelas ${kelas.nama_kelas} dihapus\n`);
            }
            
            // Hapus data orphan (data yang referensinya sudah tidak ada)
            console.log('🧽 Membersihkan data orphan...');
            const nilaiOrphan = await runQuery(`DELETE FROM Nilai WHERE id_kelas NOT IN (SELECT id_kelas FROM Kelas)`);
            console.log(`   ✅ Nilai orphan dihapus: ${nilaiOrphan} rows`);
            
            const siswaKelasOrphan = await runQuery(`DELETE FROM SiswaKelas WHERE id_kelas NOT IN (SELECT id_kelas FROM Kelas)`);
            console.log(`   ✅ SiswaKelas orphan dihapus: ${siswaKelasOrphan} rows`);
            
            const guruMapelOrphan = await runQuery(`DELETE FROM GuruMataPelajaranKelas WHERE id_kelas NOT IN (SELECT id_kelas FROM Kelas)`);
            console.log(`   ✅ GuruMataPelajaranKelas orphan dihapus: ${guruMapelOrphan} rows`);
        }

        console.log('\n✅ Pembersihan kelas lama selesai!\n');
        
        // Tampilkan kelas yang tersisa
        const kelasValid = await allQuery('SELECT nama_kelas, COUNT(*) as count FROM Kelas GROUP BY nama_kelas ORDER BY nama_kelas');
        console.log('📊 Kelas yang tersisa di database:');
        kelasValid.forEach(k => console.log(`   - ${k.nama_kelas}: ${k.count} periode`));
        
        console.log('\n✅ Selesai! Silakan jalankan seed_analytics_data.js untuk menambah data dummy.\n');
        
    } catch (error) {
        console.error('❌ Error saat membersihkan kelas lama:', error);
    } finally {
        process.exit(0);
    }
}

// Run the cleaning
cleanOldClasses();
