// backend/src/remove_siswa_password.js
// Migration script to remove password_hash column from Siswa table
const { getDb } = require('./config/db');

function migrateSiswaTable() {
    const db = getDb();
    
    console.log('Starting migration: Removing password_hash from Siswa table...');
    
    db.serialize(() => {
        // Step 0: Disable foreign key constraints temporarily
        db.run('PRAGMA foreign_keys = OFF', (err) => {
            if (err) {
                console.error('Error disabling foreign keys:', err.message);
                return;
            }
            console.log('✓ Foreign keys disabled');
        });
        
        // Step 1: Create new table without password_hash
        db.run(`
            CREATE TABLE IF NOT EXISTS Siswa_new (
                id_siswa INTEGER PRIMARY KEY,
                nama_siswa TEXT NOT NULL,
                tanggal_lahir TEXT,
                jenis_kelamin TEXT,
                tahun_ajaran_masuk TEXT
            )
        `, (err) => {
            if (err) {
                console.error('Error creating new Siswa table:', err.message);
                return;
            }
            console.log('✓ Created Siswa_new table');
        });
        
        // Step 2: Copy data from old table to new table (excluding password_hash)
        db.run(`
            INSERT INTO Siswa_new (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk)
            SELECT id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk
            FROM Siswa
        `, (err) => {
            if (err) {
                console.error('Error copying data to new table:', err.message);
                return;
            }
            console.log('✓ Copied data from Siswa to Siswa_new');
        });
        
        // Step 3: Drop old table
        db.run(`DROP TABLE Siswa`, (err) => {
            if (err) {
                console.error('Error dropping old Siswa table:', err.message);
                return;
            }
            console.log('✓ Dropped old Siswa table');
        });
        
        // Step 4: Rename new table to Siswa
        db.run(`ALTER TABLE Siswa_new RENAME TO Siswa`, (err) => {
            if (err) {
                console.error('Error renaming table:', err.message);
                return;
            }
            console.log('✓ Renamed Siswa_new to Siswa');
            
            // Step 5: Re-enable foreign keys
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    console.error('Error re-enabling foreign keys:', err.message);
                    return;
                }
                console.log('✓ Foreign keys re-enabled');
                console.log('✅ Migration completed successfully!');
                console.log('The password_hash column has been removed from Siswa table.');
                
                // Close database connection after migration
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                    } else {
                        console.log('Database connection closed.');
                    }
                });
            });
        });
    });
}

// Run migration
migrateSiswaTable();
