// Quick script to verify teacher assignments after normalization
const { getDb } = require('../config/db');

const db = getDb();

console.log('\n=== CHECKING TEACHER ASSIGNMENTS ===\n');

// Check active semester classes and their wali kelas
db.all(`
  SELECT 
    k.id_kelas,
    k.nama_kelas,
    g.nama_guru as wali_kelas,
    COUNT(DISTINCT gmpk.id_mapel) as total_subjects
  FROM Kelas k
  LEFT JOIN Guru g ON k.id_wali_kelas = g.id_guru
  LEFT JOIN TahunAjaranSemester tas ON k.id_ta_semester = tas.id_ta_semester
  LEFT JOIN GuruMataPelajaranKelas gmpk ON k.id_kelas = gmpk.id_kelas 
    AND k.id_wali_kelas = gmpk.id_guru 
    AND k.id_ta_semester = gmpk.id_ta_semester
  WHERE tas.is_aktif = 1
  GROUP BY k.id_kelas
  ORDER BY k.nama_kelas
`, [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }

  console.log('Classes in ACTIVE semester (2024/2025 Ganjil):\n');
  console.log('Kelas'.padEnd(20) + 'Wali Kelas'.padEnd(25) + 'Subjects');
  console.log('='.repeat(70));
  
  rows.forEach(row => {
    console.log(
      (row.nama_kelas || '-').padEnd(20) +
      (row.wali_kelas || 'NOT ASSIGNED').padEnd(25) +
      (row.total_subjects || 0)
    );
  });

  // Now check subject details for wali kelas
  console.log('\n\n=== SUBJECT DETAILS PER WALI KELAS ===\n');
  
  db.all(`
    SELECT 
      g.nama_guru,
      k.nama_kelas,
      GROUP_CONCAT(mp.nama_mapel, ', ') as subjects_taught
    FROM Kelas k
    JOIN Guru g ON k.id_wali_kelas = g.id_guru
    JOIN TahunAjaranSemester tas ON k.id_ta_semester = tas.id_ta_semester
    LEFT JOIN GuruMataPelajaranKelas gmpk ON k.id_kelas = gmpk.id_kelas 
      AND g.id_guru = gmpk.id_guru 
      AND k.id_ta_semester = gmpk.id_ta_semester
    LEFT JOIN MataPelajaran mp ON gmpk.id_mapel = mp.id_mapel
    WHERE tas.is_aktif = 1 AND k.id_wali_kelas IS NOT NULL
    GROUP BY g.id_guru, k.id_kelas
    ORDER BY k.nama_kelas
  `, [], (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }

    rows.forEach(row => {
      console.log(`${row.nama_guru} (Wali ${row.nama_kelas}):`);
      console.log(`  → ${row.subjects_taught || 'NO SUBJECTS ASSIGNED'}\n`);
    });

    setTimeout(() => process.exit(0), 100);
  });
});
