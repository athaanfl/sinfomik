// Check Siswa table structure
const { getDb } = require('./config/db');

const db = getDb();

db.all("PRAGMA table_info(Siswa)", [], (err, rows) => {
    if (err) {
        console.error('Error checking table:', err.message);
    } else {
        console.log('Current Siswa table structure:');
        console.table(rows);
    }
    db.close();
});
