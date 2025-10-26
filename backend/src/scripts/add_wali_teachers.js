const { getDb } = require('../config/db');

async function addWaliTeachers() {
  const db = getDb();

  const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function(err){ err?rej(err):res(this); }));
  const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (err,row)=> err?rej(err):res(row)));
  const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (err,rows)=> err?rej(err):res(rows)));

  try {
    console.log('=== ADDING NEW WALI KELAS TEACHERS ===\n');

    // Check current teachers
    const currentTeachers = await all('SELECT id_guru, nama_guru FROM Guru ORDER BY id_guru');
    console.log('Current teachers in database:');
    currentTeachers.forEach(t => console.log(`  ${t.id_guru}. ${t.nama_guru}`));
    console.log(`\nTotal: ${currentTeachers.length} teachers\n`);

    // New wali kelas teachers to add (we need 18 total, have 7, so add 11 more)
    const newTeachers = [
      { nama_guru: 'Ibu Siti Nurhaliza', username: 'siti.nurhaliza', email: 'siti.nurhaliza@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Pak Ahmad Dahlan', username: 'ahmad.dahlan', email: 'ahmad.dahlan@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Ibu Dewi Kartika', username: 'dewi.kartika', email: 'dewi.kartika@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Pak Rudi Hartono', username: 'rudi.hartono', email: 'rudi.hartono@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Ibu Rina Susanti', username: 'rina.susanti', email: 'rina.susanti@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Pak Agus Salim', username: 'agus.salim', email: 'agus.salim@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Ibu Maya Sari', username: 'maya.sari', email: 'maya.sari@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Pak Hendra Wijaya', username: 'hendra.wijaya', email: 'hendra.wijaya@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Ibu Lina Marlina', username: 'lina.marlina', email: 'lina.marlina@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Pak Dedi Supriadi', username: 'dedi.supriadi', email: 'dedi.supriadi@sdbinekas.sch.id', password_hash: 'password123' },
      { nama_guru: 'Ibu Fitri Handayani', username: 'fitri.handayani', email: 'fitri.handayani@sdbinekas.sch.id', password_hash: 'password123' }
    ];

    console.log(`Adding ${newTeachers.length} new wali kelas teachers...\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const teacher of newTeachers) {
      // Check if username already exists
      const existing = await get('SELECT id_guru FROM Guru WHERE username = ?', [teacher.username]);
      
      if (existing) {
        console.log(`⚠️  Skipped: ${teacher.nama_guru} (username already exists)`);
        skippedCount++;
      } else {
        await run(
          'INSERT INTO Guru (username, password_hash, nama_guru, email) VALUES (?, ?, ?, ?)',
          [teacher.username, teacher.password_hash, teacher.nama_guru, teacher.email]
        );
        console.log(`✅ Added: ${teacher.nama_guru}`);
        addedCount++;
      }
    }

    // Show final teacher count
    const finalTeachers = await all('SELECT id_guru, nama_guru FROM Guru ORDER BY id_guru');
    console.log(`\n=== FINAL TEACHER LIST (${finalTeachers.length} total) ===`);
    finalTeachers.forEach(t => console.log(`  ${t.id_guru}. ${t.nama_guru}`));

    console.log('\n✅ Successfully added new wali kelas teachers!');
    console.log(`   Added: ${addedCount}, Skipped: ${skippedCount}`);
    console.log('\n📝 Next step: Run normalize_school_data.js to assign them to classes');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the function
addWaliTeachers();
