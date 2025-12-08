// Script untuk reset Siswa table dan remove password_hash jika masih ada
const { getDb } = require('./config/db');

async function resetSiswaTable() {
    const db = getDb();
    
    return new Promise((resolve, reject) => {
        console.log('🔧 Checking Siswa table schema...');
        
        // Check if password_hash column exists
        db.all("PRAGMA table_info(Siswa)", (err, columns) => {
            if (err) {
                console.error('Error checking table schema:', err);
                return reject(err);
            }
            
            const hasPasswordHash = columns.some(col => col.name === 'password_hash');
            
            if (hasPasswordHash) {
                console.log('⚠️  Found password_hash column in Siswa table. Removing it...');
                
                // SQLite doesn't support DROP COLUMN directly in older versions
                // So we'll recreate the table without password_hash
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');
                    
                    // Create temp table with correct schema
                    db.run(`
                        CREATE TABLE Siswa_temp AS 
                        SELECT id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk 
                        FROM Siswa
                    `, (err) => {
                        if (err) {
                            console.error('Error creating temp table:', err);
                            db.run('ROLLBACK');
                            return reject(err);
                        }
                        
                        // Drop old table
                        db.run('DROP TABLE Siswa', (err) => {
                            if (err) {
                                console.error('Error dropping old table:', err);
                                db.run('ROLLBACK');
                                return reject(err);
                            }
                            
                            // Recreate table with correct schema
                            db.run(`
                                CREATE TABLE Siswa (
                                    id_siswa INTEGER PRIMARY KEY,
                                    nama_siswa TEXT NOT NULL,
                                    tanggal_lahir TEXT,
                                    jenis_kelamin TEXT,
                                    tahun_ajaran_masuk TEXT
                                )
                            `, (err) => {
                                if (err) {
                                    console.error('Error recreating table:', err);
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }
                                
                                // Copy data back
                                db.run(`
                                    INSERT INTO Siswa (id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk)
                                    SELECT id_siswa, nama_siswa, tanggal_lahir, jenis_kelamin, tahun_ajaran_masuk 
                                    FROM Siswa_temp
                                `, (err) => {
                                    if (err) {
                                        console.error('Error copying data:', err);
                                        db.run('ROLLBACK');
                                        return reject(err);
                                    }
                                    
                                    // Drop temp table
                                    db.run('DROP TABLE Siswa_temp', (err) => {
                                        if (err) {
                                            console.error('Error dropping temp table:', err);
                                            db.run('ROLLBACK');
                                            return reject(err);
                                        }
                                        
                                        db.run('COMMIT', (err) => {
                                            if (err) {
                                                console.error('Error committing transaction:', err);
                                                return reject(err);
                                            }
                                            console.log('✅ Siswa table schema fixed! password_hash column removed.');
                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            } else {
                console.log('✅ Siswa table schema is correct. No password_hash column found.');
                resolve();
            }
        });
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
