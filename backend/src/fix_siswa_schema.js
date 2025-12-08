// Fix database schema - remove password_hash column
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../academic_dashboard.db');

console.log('🔧 Fixing database schema...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

// Check if password_hash column exists
db.all("PRAGMA table_info(Siswa)", [], (err, columns) => {
    if (err) {
        console.error('❌ Error checking table schema:', err.message);
        db.close();
        process.exit(1);
    }

    const hasPasswordHash = columns.some(col => col.name === 'password_hash');
    
    if (hasPasswordHash) {
        console.log('⚠️  Found password_hash column, removing it...');
        
        // SQLite doesn't support DROP COLUMN directly, need to recreate table
        db.serialize(() => {
            // Create new table without password_hash
            db.run(`CREATE TABLE Siswa_new (
                id_siswa TEXT PRIMARY KEY,
                nama_siswa TEXT NOT NULL,
                tanggal_lahir DATE,
                jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
                tahun_ajaran_masuk TEXT
            )`, (err) => {
                if (err) {
                    console.error('❌ Error creating new table:', err.message);
                    db.close();
                    process.exit(1);
                }
                console.log('✅ Created new table structure');
            });

            // Copy data from old table
            db.run(`INSERT INTO Siswa_new (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk)
                    SELECT id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk FROM Siswa`, (err) => {
                if (err) {
                    console.error('❌ Error copying data:', err.message);
                    db.close();
                    process.exit(1);
                }
                console.log('✅ Copied all student data');
            });

            // Drop old table
            db.run(`DROP TABLE Siswa`, (err) => {
                if (err) {
                    console.error('❌ Error dropping old table:', err.message);
                    db.close();
                    process.exit(1);
                }
                console.log('✅ Dropped old table');
            });

            // Rename new table
            db.run(`ALTER TABLE Siswa_new RENAME TO Siswa`, (err) => {
                if (err) {
                    console.error('❌ Error renaming table:', err.message);
                    db.close();
                    process.exit(1);
                }
                console.log('✅ Renamed table');
                console.log('🎉 Database schema fixed successfully!');
                
                // Verify
                db.all("PRAGMA table_info(Siswa)", [], (err, columns) => {
                    if (err) {
                        console.error('❌ Error verifying schema:', err.message);
                    } else {
                        console.log('📋 New schema columns:', columns.map(c => c.name).join(', '));
                    }
                    db.close();
                });
            });
        });
    } else {
        console.log('✅ Schema is already correct - no password_hash column found');
        db.close();
    }
});
