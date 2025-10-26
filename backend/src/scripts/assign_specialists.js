const { getDb } = require('../config/db');
const { createHash } = require('crypto');

async function assignSpecialistTeachers() {
  const db = getDb();
  const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function(err){ err?rej(err):res(this); }));
  const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (err,row)=> err?rej(err):res(row)));
  const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (err,rows)=> err?rej(err):res(rows)));

  const hash = (pwd) => createHash('sha256').update(pwd).digest('hex');

  try {
    console.log('=== ASSIGN SPECIALIST TEACHERS ===');

    // 1) Ensure specialist teachers exist
    const specialists = [
      { username: 'guru.agama', nama_guru: 'Guru Agama', email: 'guru.agama@sdbinekas.sch.id' },
      { username: 'guru.musik', nama_guru: 'Guru Musik', email: 'guru.musik@sdbinekas.sch.id' },
      { username: 'guru.olahraga', nama_guru: 'Guru Olahraga', email: 'guru.olahraga@sdbinekas.sch.id' },
      { username: 'guru.budaya', nama_guru: 'Guru Budaya Jabar', email: 'guru.budaya@sdbinekas.sch.id' },
      { username: 'guru.english', nama_guru: 'Guru English', email: 'guru.english@sdbinekas.sch.id' },
    ];

    for (const sp of specialists) {
      const existing = await get('SELECT id_guru FROM Guru WHERE username = ?', [sp.username]);
      if (!existing) {
        await run('INSERT INTO Guru (username, password_hash, nama_guru, email) VALUES (?, ?, ?, ?)', [sp.username, hash('password123'), sp.nama_guru, sp.email]);
        console.log(`  ✅ Created teacher: ${sp.username}`);
      } else {
        console.log(`  ℹ️  Teacher exists: ${sp.username}`);
      }
    }

    // 2) Load subject IDs
    const subjects = await all('SELECT id_mapel, nama_mapel FROM MataPelajaran');
    const subjByName = new Map(subjects.map(s => [s.nama_mapel.toUpperCase(), s]));

    const mapelNeeded = {
      'RELIGION': 'guru.agama',
      'MUSIC': 'guru.musik',
      'SPORT': 'guru.olahraga',
      'BUDAYA JABAR': 'guru.budaya',
      'ENGLISH': 'guru.english',
    };

    // 3) Get active semester id
    const active = await get('SELECT id_ta_semester FROM TahunAjaranSemester WHERE is_aktif = 1');
    if (!active) throw new Error('Active semester not found');
    const tasId = active.id_ta_semester;
    console.log(`  Active semester id: ${tasId}`);

    // 4) List all classes in active semester
    const classes = await all('SELECT id_kelas, nama_kelas FROM Kelas WHERE id_ta_semester = ? ORDER BY id_kelas', [tasId]);
    console.log(`  Classes found: ${classes.length}`);

    // 5) Assign each specialist to all classes for their subject
    let totalAssigned = 0;
    for (const [mapelName, username] of Object.entries(mapelNeeded)) {
      const mapel = subjByName.get(mapelName);
      if (!mapel) { console.warn(`  ⚠️  Subject not found: ${mapelName}`); continue; }
      const guru = await get('SELECT id_guru FROM Guru WHERE username = ?', [username]);
      if (!guru) { console.warn(`  ⚠️  Teacher not found: ${username}`); continue; }

      let inserted = 0;
      for (const cls of classes) {
        await run(
          'INSERT OR IGNORE INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)',
          [guru.id_guru, mapel.id_mapel, cls.id_kelas, tasId]
        );
        inserted++;
      }
      totalAssigned += inserted;
      console.log(`  → ${mapelName}: assigned ${username} to ${inserted} classes`);
    }

    console.log(`\n✅ Specialist assignment done. Total inserts attempted: ${totalAssigned}`);
    console.log('   Password for new specialist accounts: password123 (SHA-256 hashed)');

  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  } finally {
    setTimeout(() => process.exit(0), 100);
  }
}

if (require.main === module) {
  assignSpecialistTeachers();
}

module.exports = { assignSpecialistTeachers };
