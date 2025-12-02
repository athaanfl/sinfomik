// backend/src/scripts/migrate_sqlite_to_mysql.js
require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');

(async () => {
  const sqlitePath = path.resolve(__dirname, '../../academic_dashboard.db');
  const sqliteDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY);

  const mysqlConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'sinfomik_db',
    multipleStatements: true
  };

  let mysqlConn;
  try {
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('Connected to MySQL for migration.');

    // Helper to read all rows from SQLite
    const readAll = (query) => new Promise((resolve, reject) => {
      sqliteDb.all(query, [], (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
      });
    });

    // Disable foreign key checks during bulk inserts
    await mysqlConn.query('SET FOREIGN_KEY_CHECKS=0');

    // Migrate tables in dependency order
    const admins = await readAll('SELECT * FROM Admin');
    for (const a of admins) {
      await mysqlConn.query(
        'INSERT IGNORE INTO Admin (id_admin, username, password, nama_admin, email) VALUES (?, ?, ?, ?, ?)',
        [a.id_admin, a.username, a.password, a.nama_admin, a.email]
      );
    }
    console.log(`Admin migrated: ${admins.length}`);

    const gurus = await readAll('SELECT * FROM Guru');
    for (const g of gurus) {
      await mysqlConn.query(
        'INSERT IGNORE INTO Guru (id_guru, username, password, nama_guru, nip, email, no_telepon) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [g.id_guru, g.username, g.password, g.nama_guru, g.nip, g.email, g.no_telepon]
      );
    }
    console.log(`Guru migrated: ${gurus.length}`);

    const siswas = await readAll('SELECT * FROM Siswa');
    for (const s of siswas) {
      await mysqlConn.query(
        'INSERT IGNORE INTO Siswa (id_siswa, username, password, nama_siswa, nisn, email, tanggal_lahir, jenis_kelamin, alamat, no_telepon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.id_siswa, s.username, s.password, s.nama_siswa, s.nisn, s.email, s.tanggal_lahir, s.jenis_kelamin, s.alamat, s.no_telepon]
      );
    }
    console.log(`Siswa migrated: ${siswas.length}`);

    const tas = await readAll('SELECT * FROM TahunAjaranSemester');
    for (const t of tas) {
      await mysqlConn.query(
        'INSERT IGNORE INTO TahunAjaranSemester (id_ta_semester, tahun_ajaran, semester, is_aktif, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?, ?, ?)',
        [t.id_ta_semester, t.tahun_ajaran, t.semester, t.is_aktif ? 1 : 0, t.tanggal_mulai, t.tanggal_selesai]
      );
    }
    console.log(`TA Semester migrated: ${tas.length}`);

    const mapels = await readAll('SELECT * FROM MataPelajaran');
    for (const m of mapels) {
      await mysqlConn.query(
        'INSERT IGNORE INTO MataPelajaran (id_mapel, nama_mapel) VALUES (?, ?)',
        [m.id_mapel, m.nama_mapel]
      );
    }
    console.log(`MataPelajaran migrated: ${mapels.length}`);

    const tipeNilai = await readAll('SELECT * FROM TipeNilai');
    for (const tn of tipeNilai) {
      await mysqlConn.query(
        'INSERT IGNORE INTO TipeNilai (id_tipe_nilai, nama_tipe, deskripsi) VALUES (?, ?, ?)',
        [tn.id_tipe_nilai, tn.nama_tipe, tn.deskripsi]
      );
    }
    console.log(`TipeNilai migrated: ${tipeNilai.length}`);

    const kelas = await readAll('SELECT * FROM Kelas');
    for (const k of kelas) {
      await mysqlConn.query(
        'INSERT IGNORE INTO Kelas (id_kelas, nama_kelas, id_wali_kelas, id_ta_semester) VALUES (?, ?, ?, ?)',
        [k.id_kelas, k.nama_kelas, k.id_wali_kelas, k.id_ta_semester]
      );
    }
    console.log(`Kelas migrated: ${kelas.length}`);

    const sk = await readAll('SELECT * FROM SiswaKelas');
    for (const row of sk) {
      await mysqlConn.query(
        'INSERT IGNORE INTO SiswaKelas (id_siswa_kelas, id_siswa, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)',
        [row.id_siswa_kelas, row.id_siswa, row.id_kelas, row.id_ta_semester]
      );
    }
    console.log(`SiswaKelas migrated: ${sk.length}`);

    const gmk = await readAll('SELECT * FROM GuruMataPelajaranKelas');
    for (const row of gmk) {
      await mysqlConn.query(
        'INSERT IGNORE INTO GuruMataPelajaranKelas (id_guru_mapel_kelas, id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?, ?)',
        [row.id_guru_mapel_kelas, row.id_guru, row.id_mapel, row.id_kelas, row.id_ta_semester]
      );
    }
    console.log(`GuruMataPelajaranKelas migrated: ${gmk.length}`);

    const nilai = await readAll('SELECT * FROM Nilai');
    for (const n of nilai) {
      await mysqlConn.query(
        'INSERT IGNORE INTO Nilai (id_nilai, id_siswa, id_guru, id_mapel, id_kelas, id_ta_semester, jenis_nilai, urutan_tp, nilai, tanggal_input, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [n.id_nilai, n.id_siswa, n.id_guru, n.id_mapel, n.id_kelas, n.id_ta_semester, n.jenis_nilai, n.urutan_tp, n.nilai, n.tanggal_input, n.keterangan]
      );
    }
    console.log(`Nilai migrated: ${nilai.length}`);

    const cp = await readAll('SELECT * FROM CapaianPembelajaran');
    for (const c of cp) {
      await mysqlConn.query(
        'INSERT IGNORE INTO CapaianPembelajaran (id_cp, id_mapel, fase, deskripsi_cp) VALUES (?, ?, ?, ?)',
        [c.id_cp, c.id_mapel, c.fase, c.deskripsi_cp]
      );
    }
    console.log(`CapaianPembelajaran migrated: ${cp.length}`);

    const scp = await readAll('SELECT * FROM SiswaCapaianPembelajaran');
    for (const row of scp) {
      await mysqlConn.query(
        'INSERT IGNORE INTO SiswaCapaianPembelajaran (id_siswa_cp, id_siswa, id_cp, id_ta_semester, status_capaian, tanggal_penilaian, catatan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [row.id_siswa_cp, row.id_siswa, row.id_cp, row.id_ta_semester, row.status_capaian, row.tanggal_penilaian, row.catatan]
      );
    }
    console.log(`SiswaCapaianPembelajaran migrated: ${scp.length}`);

    // KKM table may not exist in older SQLite versions – skip gracefully
    try {
      const kkm = await readAll('SELECT * FROM KKM');
      for (const row of kkm) {
        await mysqlConn.query(
          'INSERT IGNORE INTO KKM (id_kkm, id_mapel, id_kelas, id_ta_semester, nilai_kkm) VALUES (?, ?, ?, ?, ?)',
          [row.id_kkm, row.id_mapel, row.id_kelas, row.id_ta_semester, row.nilai_kkm]
        );
      }
      console.log(`KKM migrated: ${kkm.length}`);
    } catch (e) {
      console.warn('KKM table not found in SQLite – skipping migration for KKM.');
    }

    await mysqlConn.query('SET FOREIGN_KEY_CHECKS=1');
    console.log('\n✅ Migration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    sqliteDb.close();
  }
})();
