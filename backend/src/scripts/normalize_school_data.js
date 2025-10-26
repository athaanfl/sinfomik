// backend/src/scripts/normalize_school_data.js
// Normalize database to enforce school policies:
// - Class names restricted to the official list
// - Ensure required subjects exist
// - Homeroom teacher (wali kelas) only teaches 5 subjects:
//   Matematika, Citizenship, Bahasa Indonesia, Life Skills, IPAS (IPAS only for grade 3-6)

const { getDb } = require('../config/db');

const OFFICIAL_CLASSES = [
  '1 Gumujeng','1 Someah','1 Darehdeh',
  '2 Gentur','2 Rancage','2 Daria',
  '3 Calakan','3 Singer','3 Rancingeus',
  '4 Jatmika','4 Gumanti','4 Marahmay',
  '5 Rucita','5 Binangkit','5 Macakal',
  '6 Gumilang','6 Sonagar','6 Parigel',
];

// Normalize helper (case-insensitive comparison key)
const norm = (s) => (s || '').toString().trim().toUpperCase();

// Subject canonical names we want to exist in the DB
const REQUIRED_SUBJECTS = [
  // Homeroom subjects
  'Matematika', // keep Indonesian capitalization to match common usage
  'Citizenship',
  'Bahasa Indonesia',
  'Life Skills',
  'IPAS',
  // Specialist subjects
  'Religion',
  'Music',
  'Sport',
  'Budaya Jabar',
  'English',
];

async function normalize() {
  const db = getDb();

  const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function(err){ err?rej(err):res(this); }));
  const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (err,row)=> err?rej(err):res(row)));
  const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (err,rows)=> err?rej(err):res(rows)));

  try {
    console.log('--- Starting normalization script ---');

    // 1) Ensure required subjects exist
    const subjects = await all('SELECT id_mapel, nama_mapel FROM MataPelajaran');
    const existingSet = new Set(subjects.map(s => norm(s.nama_mapel)));
    for (const name of REQUIRED_SUBJECTS) {
      if (!existingSet.has(norm(name))) {
        await run('INSERT INTO MataPelajaran (nama_mapel) VALUES (?)', [name]);
        console.log(`Inserted subject: ${name}`);
      }
    }

    // Re-read subjects map
    const subjectRows = await all('SELECT id_mapel, nama_mapel FROM MataPelajaran');
    const subjectByName = new Map(subjectRows.map(s => [norm(s.nama_mapel), s]));

    // 2) Get ALL TA/Semester (not just active) to clean up all historical data
    const allTASemesters = await all('SELECT id_ta_semester, tahun_ajaran, semester, is_aktif FROM TahunAjaranSemester');
    
    if (allTASemesters.length === 0) {
      console.log('No TahunAjaranSemester found. Aborting.');
      return;
    }

    console.log(`Found ${allTASemesters.length} TA/Semester periods. Will normalize ALL of them.`);

    // Process each TA/Semester
    for (const tas of allTASemesters) {
      const tasId = tas.id_ta_semester;
      const tasLabel = `${tas.tahun_ajaran} ${tas.semester}${tas.is_aktif ? ' [ACTIVE]' : ''}`;
      console.log(`\n=== Processing ${tasLabel} (id=${tasId}) ===`);

      // 3) Get all classes for this semester
      const classRows = await all('SELECT id_kelas, nama_kelas, id_wali_kelas FROM Kelas WHERE id_ta_semester = ?', [tasId]);
      const existingMap = new Map(classRows.map(c => [norm(c.nama_kelas), c]));
      
      // Insert missing official classes
      for (const cls of OFFICIAL_CLASSES) {
        if (!existingMap.has(norm(cls))) {
          await run('INSERT INTO Kelas (nama_kelas, id_wali_kelas, id_ta_semester) VALUES (?, NULL, ?)', [cls, tasId]);
          console.log(`  Inserted missing class: ${cls}`);
        }
      }

      // 4) DELETE non-official classes for this semester
      const officialSet = new Set(OFFICIAL_CLASSES.map(norm));
      for (const cls of classRows) {
        if (!officialSet.has(norm(cls.nama_kelas))) {
          // Delete related data first (to avoid FK constraints)
          await run('DELETE FROM GuruMataPelajaranKelas WHERE id_kelas = ? AND id_ta_semester = ?', [cls.id_kelas, tasId]);
          await run('DELETE FROM SiswaKelas WHERE id_kelas = ? AND id_ta_semester = ?', [cls.id_kelas, tasId]);
          await run('DELETE FROM Nilai WHERE id_kelas = ? AND id_ta_semester = ?', [cls.id_kelas, tasId]);
          await run('DELETE FROM SiswaCapaianPembelajaran WHERE id_ta_semester = ? AND id_siswa IN (SELECT id_siswa FROM SiswaKelas WHERE id_kelas = ? AND id_ta_semester = ?)', [tasId, cls.id_kelas, tasId]);
          await run('DELETE FROM Kelas WHERE id_kelas = ?', [cls.id_kelas]);
          console.log(`  Deleted non-official class: ${cls.nama_kelas} (id=${cls.id_kelas})`);
        }
      }

      // 4a) Auto-assign wali kelas to classes that don't have one (only for active semester)
      // IMPORTANT: Each teacher should be wali for AT MOST ONE class
      if (tas.is_aktif) {
        const allTeachers = await all('SELECT id_guru, nama_guru FROM Guru ORDER BY id_guru');
        if (allTeachers.length > 0) {
          const classesNeedingWali = await all('SELECT id_kelas, nama_kelas FROM Kelas WHERE id_ta_semester = ? AND id_wali_kelas IS NULL', [tasId]);
          
          // Get teachers who are NOT yet wali of any class
          const existingWali = await all('SELECT DISTINCT id_wali_kelas FROM Kelas WHERE id_ta_semester = ? AND id_wali_kelas IS NOT NULL', [tasId]);
          const usedWaliIds = new Set(existingWali.map(w => w.id_wali_kelas));
          const availableTeachers = allTeachers.filter(t => !usedWaliIds.has(t.id_guru));
          
          let teacherIndex = 0;
          for (const cls of classesNeedingWali) {
            // Try to use available teachers first, then cycle through all if needed
            const teacher = availableTeachers.length > 0 
              ? availableTeachers[teacherIndex % availableTeachers.length]
              : allTeachers[teacherIndex % allTeachers.length];
            
            await run('UPDATE Kelas SET id_wali_kelas = ? WHERE id_kelas = ?', [teacher.id_guru, cls.id_kelas]);
            console.log(`  Assigned ${teacher.nama_guru} as wali kelas for ${cls.nama_kelas}`);
            teacherIndex++;
          }
        }
        
        // Now fix conflicts: if a teacher is wali for MULTIPLE classes, keep only the FIRST one
        const allClasses = await all('SELECT id_kelas, nama_kelas, id_wali_kelas FROM Kelas WHERE id_ta_semester = ? AND id_wali_kelas IS NOT NULL ORDER BY id_kelas', [tasId]);
        const waliSeen = new Map();
        for (const cls of allClasses) {
          if (waliSeen.has(cls.id_wali_kelas)) {
            // This wali already assigned to another class - unassign from this one
            await run('UPDATE Kelas SET id_wali_kelas = NULL WHERE id_kelas = ?', [cls.id_kelas]);
            console.log(`  Removed wali ${cls.id_wali_kelas} from ${cls.nama_kelas} (already wali elsewhere)`);
          } else {
            waliSeen.set(cls.id_wali_kelas, cls.nama_kelas);
          }
        }
      }

      // 5) Constrain Wali Kelas assignments to allowed homeroom subjects (only for active semester)
      if (tas.is_aktif) {
        const classesNow = await all('SELECT id_kelas, nama_kelas, id_wali_kelas FROM Kelas WHERE id_ta_semester = ?', [tasId]);
        
        // Build a list of all wali kelas IDs for this semester
        const waliKelasIds = new Set(classesNow.filter(c => c.id_wali_kelas).map(c => c.id_wali_kelas));
        
        console.log(`  Found ${waliKelasIds.size} wali kelas teachers to process`);

        // STEP 1: First ensure all required homeroom assignments exist
        for (const cls of classesNow) {
          if (!cls.id_wali_kelas) continue;

          const gradeMatch = String(cls.nama_kelas).match(/^(\d+)/);
          const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : null;

          const homeroomSubjects = [
            subjectByName.get(norm('Matematika')),
            subjectByName.get(norm('Citizenship')),
            subjectByName.get(norm('Bahasa Indonesia')),
            subjectByName.get(norm('Life Skills')),
          ].filter(Boolean);
          
          if (grade !== null && grade >= 3 && grade <= 6) {
            const ipas = subjectByName.get(norm('IPAS'));
            if (ipas) homeroomSubjects.push(ipas);
          }

          // Insert required subjects (INSERT OR IGNORE)
          for (const sub of homeroomSubjects) {
            await run(
              `INSERT OR IGNORE INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester) VALUES (?, ?, ?, ?)`,
              [cls.id_wali_kelas, sub.id_mapel, cls.id_kelas, tasId]
            );
          }
          console.log(`    Ensured ${homeroomSubjects.length} subjects for ${cls.nama_kelas}`);
        }

        // STEP 2: Delete non-homeroom assignments
        for (const cls of classesNow) {
          if (!cls.id_wali_kelas) continue;

          const gradeMatch = String(cls.nama_kelas).match(/^(\d+)/);
          const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : null;

          const homeroomSubjects = [
            subjectByName.get(norm('Matematika')),
            subjectByName.get(norm('Citizenship')),
            subjectByName.get(norm('Bahasa Indonesia')),
            subjectByName.get(norm('Life Skills')),
          ].filter(Boolean);
          
          if (grade !== null && grade >= 3 && grade <= 6) {
            const ipas = subjectByName.get(norm('IPAS'));
            if (ipas) homeroomSubjects.push(ipas);
          }

          const allowedIds = homeroomSubjects.map(s => s.id_mapel);
          if (allowedIds.length > 0) {
            const placeholders = allowedIds.map(() => '?').join(',');
            const result = await run(
              `DELETE FROM GuruMataPelajaranKelas 
               WHERE id_guru = ? AND id_kelas = ? AND id_ta_semester = ? 
               AND id_mapel NOT IN (${placeholders})`,
              [cls.id_wali_kelas, cls.id_kelas, tasId, ...allowedIds]
            );
            if (result.changes > 0) {
              console.log(`    Deleted ${result.changes} non-homeroom for ${cls.nama_kelas}`);
            }
          }
        }

        // STEP 3: Remove wali assignments in OTHER classes
        for (const waliId of waliKelasIds) {
          const waliClass = classesNow.find(c => c.id_wali_kelas === waliId);
          if (!waliClass) continue;

          const result = await run(
            `DELETE FROM GuruMataPelajaranKelas 
             WHERE id_guru = ? AND id_ta_semester = ? AND id_kelas != ?`,
            [waliId, tasId, waliClass.id_kelas]
          );
          if (result.changes > 0) {
            console.log(`    Cleaned up ${result.changes} for wali (kept ${waliClass.nama_kelas})`);
          }
        }
      }
    }

    console.log('\n--- Normalization complete for ALL semesters. ---');
  } catch (err) {
    console.error('Normalization failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Give sqlite time to flush
    setTimeout(() => process.exit(), 100);
  }
}

if (require.main === module) {
  normalize();
}

module.exports = { normalize };
