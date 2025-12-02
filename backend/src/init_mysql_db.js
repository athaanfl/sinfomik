// backend/src/init_mysql_db.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { format } = require('date-fns');

// MySQL Connection Config
const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
};

async function initializeMySQLDatabase() {
    let connection;
    
    try {
        // Connect to MySQL server (without database)
        connection = await mysql.createConnection(config);
        console.log('Connected to MySQL server');

        // Create database if not exists
        const dbName = process.env.MYSQL_DATABASE || 'sinfomik_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Database '${dbName}' created or already exists`);

        // Use the database
        await connection.query(`USE \`${dbName}\``);

        // Create tables with MySQL syntax
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Admin (
                id_admin INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                nama_admin VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Guru (
                id_guru INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                nama_guru VARCHAR(255) NOT NULL,
                nip VARCHAR(50) UNIQUE,
                email VARCHAR(255) UNIQUE,
                no_telepon VARCHAR(20)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Siswa (
                id_siswa INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                nama_siswa VARCHAR(255) NOT NULL,
                nisn VARCHAR(50) UNIQUE,
                email VARCHAR(255) UNIQUE,
                tanggal_lahir DATE,
                jenis_kelamin ENUM('L', 'P'),
                alamat TEXT,
                no_telepon VARCHAR(20)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS TahunAjaranSemester (
                id_ta_semester INT AUTO_INCREMENT PRIMARY KEY,
                tahun_ajaran VARCHAR(20) NOT NULL,
                semester ENUM('Ganjil', 'Genap') NOT NULL,
                is_aktif BOOLEAN DEFAULT FALSE,
                tanggal_mulai DATE,
                tanggal_selesai DATE,
                UNIQUE KEY unique_ta_semester (tahun_ajaran, semester)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Kelas (
                id_kelas INT AUTO_INCREMENT PRIMARY KEY,
                nama_kelas VARCHAR(50) NOT NULL,
                id_wali_kelas INT,
                id_ta_semester INT NOT NULL,
                FOREIGN KEY (id_wali_kelas) REFERENCES Guru(id_guru) ON DELETE SET NULL,
                FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester) ON DELETE CASCADE,
                UNIQUE KEY unique_kelas_ta (nama_kelas, id_ta_semester)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS MataPelajaran (
                id_mapel INT AUTO_INCREMENT PRIMARY KEY,
                nama_mapel VARCHAR(255) NOT NULL UNIQUE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS TipeNilai (
                id_tipe_nilai INT AUTO_INCREMENT PRIMARY KEY,
                nama_tipe VARCHAR(50) NOT NULL UNIQUE,
                deskripsi TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS SiswaKelas (
                id_siswa_kelas INT AUTO_INCREMENT PRIMARY KEY,
                id_siswa INT NOT NULL,
                id_kelas INT NOT NULL,
                id_ta_semester INT NOT NULL,
                FOREIGN KEY (id_siswa) REFERENCES Siswa(id_siswa) ON DELETE CASCADE,
                FOREIGN KEY (id_kelas) REFERENCES Kelas(id_kelas) ON DELETE CASCADE,
                FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester) ON DELETE CASCADE,
                UNIQUE KEY unique_siswa_kelas_ta (id_siswa, id_kelas, id_ta_semester)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS GuruMataPelajaranKelas (
                id_guru_mapel_kelas INT AUTO_INCREMENT PRIMARY KEY,
                id_guru INT NOT NULL,
                id_mapel INT NOT NULL,
                id_kelas INT NOT NULL,
                id_ta_semester INT NOT NULL,
                FOREIGN KEY (id_guru) REFERENCES Guru(id_guru) ON DELETE CASCADE,
                FOREIGN KEY (id_mapel) REFERENCES MataPelajaran(id_mapel) ON DELETE CASCADE,
                FOREIGN KEY (id_kelas) REFERENCES Kelas(id_kelas) ON DELETE CASCADE,
                FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester) ON DELETE CASCADE,
                UNIQUE KEY unique_guru_mapel_kelas_ta (id_guru, id_mapel, id_kelas, id_ta_semester)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS Nilai (
                id_nilai INT AUTO_INCREMENT PRIMARY KEY,
                id_siswa INT NOT NULL,
                id_guru INT NOT NULL,
                id_mapel INT NOT NULL,
                id_kelas INT NOT NULL,
                id_ta_semester INT NOT NULL,
                jenis_nilai ENUM('TP', 'UAS') NOT NULL,
                urutan_tp INT,
                nilai DECIMAL(5,2),
                tanggal_input DATETIME DEFAULT CURRENT_TIMESTAMP,
                keterangan TEXT,
                FOREIGN KEY (id_siswa) REFERENCES Siswa(id_siswa) ON DELETE CASCADE,
                FOREIGN KEY (id_guru) REFERENCES Guru(id_guru) ON DELETE CASCADE,
                FOREIGN KEY (id_mapel) REFERENCES MataPelajaran(id_mapel) ON DELETE CASCADE,
                FOREIGN KEY (id_kelas) REFERENCES Kelas(id_kelas) ON DELETE CASCADE,
                FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester) ON DELETE CASCADE,
                INDEX idx_siswa_mapel (id_siswa, id_mapel),
                INDEX idx_guru_mapel_kelas (id_guru, id_mapel, id_kelas),
                INDEX idx_ta_semester (id_ta_semester)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS CapaianPembelajaran (
                id_cp INT AUTO_INCREMENT PRIMARY KEY,
                id_mapel INT NOT NULL,
                fase ENUM('A', 'B', 'C', 'D', 'E', 'F') NOT NULL,
                deskripsi_cp TEXT NOT NULL,
                FOREIGN KEY (id_mapel) REFERENCES MataPelajaran(id_mapel) ON DELETE CASCADE,
                INDEX idx_mapel_fase (id_mapel, fase)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS SiswaCapaianPembelajaran (
                id_siswa_cp INT AUTO_INCREMENT PRIMARY KEY,
                id_siswa INT NOT NULL,
                id_cp INT NOT NULL,
                id_ta_semester INT NOT NULL,
                status_capaian ENUM('Belum', 'Sedang Berkembang', 'Sudah Berkembang', 'Sangat Berkembang') DEFAULT 'Belum',
                tanggal_penilaian DATE,
                catatan TEXT,
                FOREIGN KEY (id_siswa) REFERENCES Siswa(id_siswa) ON DELETE CASCADE,
                FOREIGN KEY (id_cp) REFERENCES CapaianPembelajaran(id_cp) ON DELETE CASCADE,
                FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester) ON DELETE CASCADE,
                UNIQUE KEY unique_siswa_cp_ta (id_siswa, id_cp, id_ta_semester)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS KKM (
                id_kkm INT AUTO_INCREMENT PRIMARY KEY,
                id_mapel INT NOT NULL,
                id_kelas INT NOT NULL,
                id_ta_semester INT NOT NULL,
                nilai_kkm DECIMAL(5,2) NOT NULL,
                FOREIGN KEY (id_mapel) REFERENCES MataPelajaran(id_mapel) ON DELETE CASCADE,
                FOREIGN KEY (id_kelas) REFERENCES Kelas(id_kelas) ON DELETE CASCADE,
                FOREIGN KEY (id_ta_semester) REFERENCES TahunAjaranSemester(id_ta_semester) ON DELETE CASCADE,
                UNIQUE KEY unique_mapel_kelas_ta (id_mapel, id_kelas, id_ta_semester)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS TujuanPembelajaran (
                id_tp INT AUTO_INCREMENT PRIMARY KEY,
                id_mapel INT NOT NULL,
                fase ENUM('A', 'B', 'C') NOT NULL,
                tingkat_kelas INT NOT NULL,
                semester_number INT NOT NULL,
                tujuan_pembelajaran TEXT NOT NULL,
                FOREIGN KEY (id_mapel) REFERENCES MataPelajaran(id_mapel) ON DELETE CASCADE,
                INDEX idx_mapel_fase_kelas (id_mapel, fase, tingkat_kelas, semester_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('All tables created successfully!');

        // Insert dummy data
        await insertDummyData(connection);

        console.log('\n✅ MySQL Database initialization completed successfully!');

    } catch (error) {
        console.error('❌ Error initializing MySQL database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function insertDummyData(connection) {
    try {
        // Check if data already exists
        const [adminRows] = await connection.query('SELECT COUNT(*) as count FROM Admin');
        if (adminRows[0].count > 0) {
            console.log('Data already exists. Skipping dummy data insertion.');
            return;
        }

        console.log('Inserting dummy data...');

        // Hash passwords
        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
        const hashedGuruPassword = await bcrypt.hash('guru123', 10);
        const hashedSiswaPassword = await bcrypt.hash('siswa123', 10);

        // Insert Admin
        await connection.query(`
            INSERT INTO Admin (username, password, nama_admin, email) 
            VALUES ('admin', ?, 'Administrator SD Binekas', 'admin@sdbinekas.sch.id')
        `, [hashedAdminPassword]);

        // Insert Guru
        const guruData = [
            ['budi.s', hashedGuruPassword, 'Pak Budi Santoso', '198501011234567890', 'budi@sdbinekas.sch.id', '081234567890'],
            ['ani.w', hashedGuruPassword, 'Ibu Ani Wijaya', '198602021234567891', 'ani@sdbinekas.sch.id', '081234567891'],
            ['citra.d', hashedGuruPassword, 'Ibu Citra Dewi', '198703031234567892', 'citra@sdbinekas.sch.id', '081234567892']
        ];

        for (const guru of guruData) {
            await connection.query(`
                INSERT INTO Guru (username, password, nama_guru, nip, email, no_telepon) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, guru);
        }

        // Insert Siswa
        const siswaData = [
            ['andi.p', hashedSiswaPassword, 'Andi Pratama', '0051234567', 'andi@email.com', '2015-05-15', 'L', 'Jl. Merdeka No. 1', '081234560001'],
            ['budi.s', hashedSiswaPassword, 'Budi Santoso', '0051234568', 'budi@email.com', '2015-06-20', 'L', 'Jl. Merdeka No. 2', '081234560002'],
            ['citra.d', hashedSiswaPassword, 'Citra Dewi', '0051234569', 'citra@email.com', '2015-07-10', 'P', 'Jl. Merdeka No. 3', '081234560003']
        ];

        for (const siswa of siswaData) {
            await connection.query(`
                INSERT INTO Siswa (username, password, nama_siswa, nisn, email, tanggal_lahir, jenis_kelamin, alamat, no_telepon) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, siswa);
        }

        // Insert Mata Pelajaran
        const mapelData = ['Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'Bahasa Inggris', 'Pendidikan Agama'];
        for (const mapel of mapelData) {
            await connection.query('INSERT INTO MataPelajaran (nama_mapel) VALUES (?)', [mapel]);
        }

        // Insert Tahun Ajaran
        await connection.query(`
            INSERT INTO TahunAjaranSemester (tahun_ajaran, semester, is_aktif, tanggal_mulai, tanggal_selesai) 
            VALUES ('2024/2025', 'Ganjil', TRUE, '2024-07-15', '2024-12-20')
        `);

        console.log('✅ Dummy data inserted successfully!');

    } catch (error) {
        console.error('Error inserting dummy data:', error);
        throw error;
    }
}

// Run initialization
initializeMySQLDatabase()
    .then(() => {
        console.log('Database setup complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database setup failed:', error);
        process.exit(1);
    });
