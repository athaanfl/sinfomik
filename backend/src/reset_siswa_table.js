// Script untuk reset Siswa table dan remove password_hash jika masih ada
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determine database path - support both local and Azure
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../academic_dashboard.db');

console.log(`📁 Using database: ${DB_PATH}`);

// Utility functions for callbacks-based sqlite3
function runQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function resetSiswaTable() {
    // Check if database file exists
    if (!fs.existsSync(DB_PATH)) {
        console.log('❌ Database file not found at:', DB_PATH);
        console.log('ℹ️  Run init_db.js first to initialize database');
        return;
    }

    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, async (err) => {
        if (err) {
            console.error('❌ Error connecting to database:', err.message);
            process.exit(1);
        }

        try {
            console.log('🔧 Checking Siswa table schema...');
            
            // Check if password_hash column exists
            const columns = await allQuery(db, "PRAGMA table_info(Siswa)");
            console.log('Current columns:', columns.map(c => c.name).join(', '));
            
            const hasPasswordHash = columns.some(col => col.name === 'password_hash');
            
            if (hasPasswordHash) {
                console.log('⚠️  Found password_hash column in Siswa table. Removing it...');
                
                try {
                    // First, disable foreign key checks
                    await runQuery(db, "PRAGMA foreign_keys = OFF");
                    
                    // Create temp table with correct schema
                    console.log('  Creating temp table...');
                    await runQuery(db, `
                        CREATE TABLE Siswa_temp (
                            id_siswa INTEGER PRIMARY KEY,
                            nama_siswa TEXT NOT NULL,
                            tanggal_lahir TEXT,
                            jenis_kelamin TEXT,
                            tahun_ajaran_masuk TEXT
                        )
                    `);
                    
                    // Copy data from old table
                    console.log('  Copying data...');
                    await runQuery(db, `
                        INSERT INTO Siswa_temp (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk)
                        SELECT id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk 
                        FROM Siswa
                    `);
                    
                    // Drop old table
                    console.log('  Dropping old table...');
                    await runQuery(db, 'DROP TABLE Siswa');
                    
                    // Recreate table with correct schema
                    console.log('  Recreating table...');
                    await runQuery(db, `
                        CREATE TABLE Siswa (
                            id_siswa INTEGER PRIMARY KEY,
                            nama_siswa TEXT NOT NULL,
                            tanggal_lahir TEXT,
                            jenis_kelamin TEXT,
                            tahun_ajaran_masuk TEXT
                        )
                    `);
                    
                    // Copy data back
                    console.log('  Copying data back...');
                    await runQuery(db, `
                        INSERT INTO Siswa (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk)
                        SELECT id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk 
                        FROM Siswa_temp
                    `);
                    
                    // Drop temp table
                    console.log('  Cleaning up...');
                    await runQuery(db, 'DROP TABLE Siswa_temp');
                    
                    // Re-enable foreign keys
                    await runQuery(db, "PRAGMA foreign_keys = ON");
                    
                    console.log('✅ Siswa table schema fixed! password_hash column removed.');
                } catch (innerErr) {
                    console.error('❌ Error during table recreation:', innerErr.message);
                    try {
                        await runQuery(db, "PRAGMA foreign_keys = ON");
                    } catch (e) {}
                    throw innerErr;
                }
            } else {
                console.log('✅ Siswa table schema is correct. No password_hash column found.');
            }
        } catch (err) {
            console.error('❌ Error:', err.message);
            throw err;
        } finally {
            db.close();
        }
    });
}

// Run the reset if this file is executed directly
if (require.main === module) {
    resetSiswaTable()
        .then(() => {
            console.log('\n✨ All done!');
            process.exit(0);
        })
        .catch((err) => {
            console.error('\n❌ Error:', err);
            process.exit(1);
        });
}

module.exports = resetSiswaTable;

module.exports = resetSiswaTable;
