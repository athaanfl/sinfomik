const { getDb } = require('../config/db');

async function addOneMoreTeacher() {
  const db = getDb();

  const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function(err){ err?rej(err):res(this); }));
  const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (err,rows)=> err?rej(err):res(rows)));

  try {
    await run(
      'INSERT INTO Guru (username, password_hash, nama_guru, email) VALUES (?, ?, ?, ?)',
      ['septian.putra', 'password123', 'Pak Septian Putra', 'septian.putra@sdbinekas.sch.id']
    );
    console.log('✅ Added: Pak Septian Putra');
    
    const teachers = await all('SELECT id_guru, nama_guru FROM Guru ORDER BY id_guru');
    console.log(`\nTotal teachers now: ${teachers.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addOneMoreTeacher();
