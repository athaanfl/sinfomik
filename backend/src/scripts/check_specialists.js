const { getDb } = require('../config/db');

async function checkSpecialists() {
  const db = getDb();
  const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (err,rows)=> err?rej(err):res(rows)));
  const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (err,row)=> err?rej(err):res(row)));

  try {
    console.log('=== CHECK SPECIALIST ASSIGNMENTS ===');
    const active = await get('SELECT id_ta_semester FROM TahunAjaranSemester WHERE is_aktif = 1');
    if (!active) throw new Error('Active semester not found');

    const q = `
      SELECT m.nama_mapel, COUNT(DISTINCT k.id_kelas) AS kelas_tercover, COUNT(*) AS total_rows
      FROM GuruMataPelajaranKelas g
      JOIN MataPelajaran m ON m.id_mapel = g.id_mapel
      JOIN Kelas k ON k.id_kelas = g.id_kelas AND k.id_ta_semester = g.id_ta_semester
      WHERE g.id_ta_semester = ? AND m.nama_mapel IN ('RELIGION','MUSIC','SPORT','BUDAYA JABAR','ENGLISH')
      GROUP BY m.nama_mapel
      ORDER BY m.nama_mapel;
    `;

    const rows = await all(q, [active.id_ta_semester]);
    rows.forEach(r => console.log(`${r.nama_mapel.padEnd(12)}: kelas=${r.kelas_tercover}/18, rows=${r.total_rows}`));

    console.log('\nDetail per mapel (contoh 5 baris per mapel):');
    const detail = await all(`
      SELECT m.nama_mapel, k.nama_kelas, gmk.id_guru
      FROM GuruMataPelajaranKelas gmk
      JOIN MataPelajaran m ON m.id_mapel = gmk.id_mapel
      JOIN Kelas k ON k.id_kelas = gmk.id_kelas AND k.id_ta_semester = gmk.id_ta_semester
      WHERE gmk.id_ta_semester = ? AND m.nama_mapel IN ('RELIGION','MUSIC','SPORT','BUDAYA JABAR','ENGLISH')
      ORDER BY m.nama_mapel, k.id_kelas
      LIMIT 25;
    `, [active.id_ta_semester]);

    for (const r of detail) {
      console.log(`  ${r.nama_mapel} -> ${r.nama_kelas} (guru:${r.id_guru})`);
    }

  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  } finally {
    setTimeout(() => process.exit(0), 100);
  }
}

if (require.main === module) {
  checkSpecialists();
}

module.exports = { checkSpecialists };
