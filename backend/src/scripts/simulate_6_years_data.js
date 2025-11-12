// COMPREHENSIVE 6-YEAR SCHOOL DATA SIMULATION
// This will simulate a complete 6-year school operation with:
// - Students progressing from grade 1 to 6
// - Teachers consistently teaching subjects
// - Realistic grades across all semesters
// - 15 students per class

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../academic_dashboard.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🎯 6-YEAR SCHOOL DATA SIMULATION\n');
console.log('='.repeat(80));

// Configuration
const CONFIG = {
    studentsPerClass: 15,
    startYear: '2019/2020', // Start from 6 years ago
    totalYears: 6,
    mainSubjects: ['MATEMATIKA', 'BAHASA INDONESIA', 'IPAS', 'CITIZENSHIP', 'LIFE SKILLS'],
    grades: [1, 2, 3, 4, 5, 6],
    classNames: {
        1: ['Darehdeh', 'Gumujeng', 'Someah'],
        2: ['Daria', 'Gentur', 'Rancage'],
        3: ['Calakan', 'Rancingeus', 'Singer'],
        4: ['Gumanti', 'Jatmika', 'Marahmay'],
        5: ['Binangkit', 'Macakal', 'Rucita'],
        6: ['Gumilang', 'Parigel', 'Sonagar']
    }
};

// Step 1: Backup current database
async function backupDatabase() {
    console.log('\n📦 STEP 1: BACKING UP CURRENT DATABASE\n');
    
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupPath = path.join(__dirname, `../../academic_dashboard_backup_6year_${timestamp}.db`);
        
        const readStream = fs.createReadStream(dbPath);
        const writeStream = fs.createWriteStream(backupPath);
        
        readStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', () => {
            const stats = fs.statSync(backupPath);
            console.log(`✅ Database backed up successfully!`);
            console.log(`📁 Backup location: ${backupPath}`);
            console.log(`💾 Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
            resolve(backupPath);
        });
        
        readStream.pipe(writeStream);
    });
}

// Step 2: Clean existing data (keep structure, remove assignments & grades)
async function cleanExistingData() {
    console.log('\n🧹 STEP 2: CLEANING EXISTING DATA\n');
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Delete in correct order (respect foreign keys)
            db.run('DELETE FROM Nilai', (err) => {
                if (err) console.error('Error deleting Nilai:', err);
                else console.log('✅ Deleted all grades (Nilai)');
            });
            
            db.run('DELETE FROM GuruMataPelajaranKelas', (err) => {
                if (err) console.error('Error deleting GuruMataPelajaranKelas:', err);
                else console.log('✅ Deleted all teacher assignments');
            });
            
            db.run('DELETE FROM SiswaKelas', (err) => {
                if (err) console.error('Error deleting SiswaKelas:', err);
                else console.log('✅ Deleted all student enrollments');
            });
            
            db.run('COMMIT', (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                } else {
                    console.log('\n✅ Database cleaned successfully!\n');
                    resolve();
                }
            });
        });
    });
}

// Step 3: Get or create semester data for 6 years
async function setupSemesters() {
    console.log('\n📅 STEP 3: SETTING UP SEMESTERS (6 YEARS)\n');
    
    const semesters = [];
    const startYear = 2019;
    
    // Generate 6 years of semesters
    for (let i = 0; i < CONFIG.totalYears; i++) {
        const year = startYear + i;
        const tahunAjaran = `${year}/${year + 1}`;
        
        // Ganjil semester
        semesters.push({
            tahun_ajaran: tahunAjaran,
            semester: 'Ganjil',
            is_aktif: (i === CONFIG.totalYears - 1 && 'Ganjil' === 'Ganjil') ? 1 : 0
        });
        
        // Genap semester
        semesters.push({
            tahun_ajaran: tahunAjaran,
            semester: 'Genap',
            is_aktif: (i === CONFIG.totalYears - 1 && 'Genap' === 'Genap') ? 0 : 0
        });
    }
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Get existing semesters
            db.all('SELECT * FROM TahunAjaranSemester ORDER BY tahun_ajaran, semester', [], (err, existing) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`📊 Found ${existing.length} existing semesters in database`);
                
                // Insert missing semesters
                const stmt = db.prepare(`
                    INSERT OR IGNORE INTO TahunAjaranSemester (tahun_ajaran, semester, is_aktif)
                    VALUES (?, ?, ?)
                `);
                
                let inserted = 0;
                semesters.forEach(sem => {
                    stmt.run(sem.tahun_ajaran, sem.semester, sem.is_aktif, (err) => {
                        if (err) console.error('Error inserting semester:', err);
                        else inserted++;
                    });
                });
                
                stmt.finalize((err) => {
                    if (err) reject(err);
                    else {
                        console.log(`✅ Ensured ${semesters.length} semesters exist (${inserted} newly created)\n`);
                        
                        // Fetch all semesters with IDs
                        db.all('SELECT * FROM TahunAjaranSemester ORDER BY tahun_ajaran, semester', [], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        });
                    }
                });
            });
        });
    });
}

// Step 4: Generate or get students (90 students for 6 classes per grade x 15 students)
async function setupStudents() {
    console.log('\n👥 STEP 4: SETTING UP STUDENTS\n');
    
    const totalClassesPerGrade = 3; // 3 classes per grade
    const totalGrades = 6;
    const totalStudents = totalClassesPerGrade * totalGrades * CONFIG.studentsPerClass; // 3 * 6 * 15 = 270
    
    console.log(`📋 Target: ${totalStudents} students (${CONFIG.studentsPerClass} per class, ${totalClassesPerGrade} classes per grade, ${totalGrades} grades)`);
    
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Siswa', [], (err, existingStudents) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log(`📊 Found ${existingStudents.length} existing students`);
            
            if (existingStudents.length >= totalStudents) {
                console.log(`✅ Sufficient students already exist\n`);
                resolve(existingStudents.slice(0, totalStudents));
                return;
            }
            
            // Generate additional students
            const namesToAdd = totalStudents - existingStudents.length;
            console.log(`📝 Generating ${namesToAdd} additional students...`);
            
            const firstNames = ['Andi', 'Budi', 'Citra', 'Dian', 'Eko', 'Fitri', 'Gita', 'Hendra', 'Indah', 'Joko', 
                               'Kevin', 'Lina', 'Maya', 'Nina', 'Omar', 'Putri', 'Qori', 'Rizky', 'Siti', 'Tono',
                               'Umar', 'Vina', 'Wati', 'Xena', 'Yuli', 'Zahra', 'Ayu', 'Bayu', 'Cahya', 'Dewi',
                               'Eka', 'Fajar', 'Gilang', 'Hani', 'Imam', 'Jihan', 'Kiki', 'Lilis', 'Mira', 'Nana'];
            
            const lastNames = ['Pratama', 'Saputra', 'Putri', 'Wijaya', 'Santoso', 'Lestari', 'Nugroho', 'Utami',
                              'Firmansyah', 'Rahayu', 'Setiawan', 'Anggraini', 'Permata', 'Maulana', 'Azzahra',
                              'Alamsyah', 'Khairunnisa', 'Aditya', 'Cahyono', 'Dewi'];
            
            const genders = ['L', 'P'];
            const angkatanYears = ['2019/2020', '2020/2021', '2021/2022', '2022/2023', '2023/2024', '2024/2025'];
            
            const stmt = db.prepare(`
                INSERT INTO Siswa (nama_siswa, tahun_ajaran_masuk, tanggal_lahir, jenis_kelamin)
                VALUES (?, ?, ?, ?)
            `);
            
            for (let i = 0; i < namesToAdd; i++) {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const name = `${firstName} ${lastName} ${i + existingStudents.length}`;
                const gender = genders[Math.floor(Math.random() * genders.length)];
                const angkatan = angkatanYears[Math.floor(Math.random() * angkatanYears.length)];
                const birthYear = 2013 + Math.floor(i / 30); // Spread across years
                const birthDate = `${birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
                
                stmt.run(name, angkatan, birthDate, gender);
            }
            
            stmt.finalize((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ Added ${namesToAdd} new students\n`);
                    
                    // Fetch all students
                    db.all('SELECT * FROM Siswa LIMIT ?', [totalStudents], (err, allStudents) => {
                        if (err) reject(err);
                        else resolve(allStudents);
                    });
                }
            });
        });
    });
}

// Step 5: Get teachers
async function getTeachers() {
    console.log('\n👨‍🏫 STEP 5: GETTING TEACHERS\n');
    
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Guru', [], (err, teachers) => {
            if (err) {
                reject(err);
            } else {
                console.log(`✅ Found ${teachers.length} teachers available\n`);
                resolve(teachers);
            }
        });
    });
}

// Step 6: Get subjects
async function getSubjects() {
    console.log('\n📚 STEP 6: GETTING SUBJECTS\n');
    
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT * FROM MataPelajaran 
            WHERE nama_mapel IN (${CONFIG.mainSubjects.map(() => '?').join(',')})
        `, CONFIG.mainSubjects, (err, subjects) => {
            if (err) {
                reject(err);
            } else {
                console.log(`✅ Found ${subjects.length} main subjects:`);
                subjects.forEach(s => console.log(`   - ${s.nama_mapel}`));
                console.log('');
                resolve(subjects);
            }
        });
    });
}

// Step 7: Get classes
async function getClasses() {
    console.log('\n🏫 STEP 7: GETTING CLASSES\n');
    
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Kelas ORDER BY nama_kelas', [], (err, classes) => {
            if (err) {
                reject(err);
            } else {
                console.log(`✅ Found ${classes.length} classes\n`);
                resolve(classes);
            }
        });
    });
}

// Step 8: Simulate 6 years of data with proper progression
async function simulate6Years(semesters, students, teachers, subjects, classes) {
    console.log('\n🎬 STEP 8: SIMULATING 6 YEARS OF SCHOOL DATA\n');
    console.log('='.repeat(80));
    
    // Organize classes by grade
    const classesByGrade = {};
    CONFIG.grades.forEach(grade => {
        classesByGrade[grade] = classes.filter(c => {
            const classNames = CONFIG.classNames[grade] || [];
            return classNames.some(name => c.nama_kelas.includes(name));
        });
    });
    
    console.log('\n📊 Classes per grade:');
    Object.keys(classesByGrade).forEach(grade => {
        console.log(`   Grade ${grade}: ${classesByGrade[grade].length} classes (${classesByGrade[grade].map(c => c.nama_kelas).join(', ')})`);
    });
    
    // Create cohorts (angkatan) - each cohort has 45 students (3 classes x 15 students)
    const studentsPerCohort = 45; // 3 classes per grade x 15 students per class
    const cohorts = [];
    
    for (let i = 0; i < 6; i++) {
        const year = 2019 + i;
        const angkatan = `${year}/${year + 1}`;
        const cohortStudents = students.slice(i * studentsPerCohort, (i + 1) * studentsPerCohort);
        
        if (cohortStudents.length > 0) {
            cohorts.push({
                angkatan: angkatan,
                year: year,
                students: cohortStudents,
                startGrade: 1 // All cohorts start at grade 1
            });
            
            // Update student angkatan in database
            const updateStmt = db.prepare('UPDATE Siswa SET tahun_ajaran_masuk = ? WHERE id_siswa = ?');
            cohortStudents.forEach(s => {
                updateStmt.run(angkatan, s.id_siswa);
            });
            updateStmt.finalize();
        }
    }
    
    console.log(`\n🎓 Created ${cohorts.length} cohorts (angkatan):`);
    cohorts.forEach(c => {
        console.log(`   ${c.angkatan}: ${c.students.length} students`);
    });
    
    // Assign teachers to subjects per class (consistent across semesters)
    const teacherAssignments = [];
    let teacherIndex = 0;
    
    console.log('\n👨‍🏫 Creating teacher assignments...');
    classes.forEach(kelas => {
        subjects.forEach(subject => {
            const teacher = teachers[teacherIndex % teachers.length];
            teacherAssignments.push({
                id_guru: teacher.id_guru,
                id_mapel: subject.id_mapel,
                id_kelas: kelas.id_kelas,
                teacher_name: teacher.nama_guru,
                subject_name: subject.nama_mapel,
                class_name: kelas.nama_kelas
            });
            teacherIndex++;
        });
    });
    
    console.log(`✅ Created ${teacherAssignments.length} teacher-subject-class combinations`);
    
    // Group semesters by year
    const semestersByYear = {};
    semesters.forEach(sem => {
        const year = sem.tahun_ajaran.split('/')[0];
        if (!semestersByYear[year]) {
            semestersByYear[year] = [];
        }
        semestersByYear[year].push(sem);
    });
    
    // Process each year
    console.log('\n📝 Simulating each year...\n');
    
    const years = Object.keys(semestersByYear).sort();
    
    for (let yearIdx = 0; yearIdx < years.length; yearIdx++) {
        const year = years[yearIdx];
        const yearSemesters = semestersByYear[year];
        const tahunAjaran = `${year}/${parseInt(year) + 1}`;
        
        console.log(`\n${'═'.repeat(80)}`);
        console.log(`� YEAR ${yearIdx + 1}/${years.length}: ${tahunAjaran}`);
        console.log(`${'═'.repeat(80)}`);
        
        // Determine which cohorts are active and their current grade
        const activeCohorts = cohorts.map(cohort => {
            const yearsInSchool = parseInt(year) - cohort.year;
            const currentGrade = cohort.startGrade + yearsInSchool;
            
            // Only include if they're in grades 1-6
            if (currentGrade >= 1 && currentGrade <= 6) {
                return {
                    ...cohort,
                    currentGrade: currentGrade,
                    yearsInSchool: yearsInSchool
                };
            }
            return null;
        }).filter(c => c !== null);
        
        console.log(`\n👥 Active cohorts this year:`);
        activeCohorts.forEach(c => {
            console.log(`   Angkatan ${c.angkatan}: ${c.students.length} students in Grade ${c.currentGrade}`);
        });
        
        // Distribute cohort students to appropriate grade classes
        const classStudentMap = {}; // Map: classId -> [studentIds]
        
        activeCohorts.forEach(cohort => {
            const gradeClasses = classesByGrade[cohort.currentGrade] || [];
            
            if (gradeClasses.length === 0) {
                console.log(`   ⚠️  Warning: No classes found for grade ${cohort.currentGrade}`);
                return;
            }
            
            // Distribute students evenly across classes for this grade
            const studentsPerClassInGrade = Math.ceil(cohort.students.length / gradeClasses.length);
            let studentIdx = 0;
            
            gradeClasses.forEach((kelas, idx) => {
                const studentsForClass = cohort.students.slice(
                    studentIdx, 
                    Math.min(studentIdx + studentsPerClassInGrade, cohort.students.length)
                );
                
                if (!classStudentMap[kelas.id_kelas]) {
                    classStudentMap[kelas.id_kelas] = [];
                }
                classStudentMap[kelas.id_kelas].push(...studentsForClass.map(s => s.id_siswa));
                
                studentIdx += studentsPerClassInGrade;
            });
        });
        
        // Process both semesters of this year
        for (const semester of yearSemesters) {
            console.log(`\n   📅 ${semester.semester}`);
            await insertSemesterData(semester, classStudentMap, teacherAssignments, subjects);
        }
        
        console.log(`\n✅ Completed ${tahunAjaran}\n`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 6-YEAR SIMULATION COMPLETED!');
    console.log('='.repeat(80));
}

// Helper: Insert data for one semester
async function insertSemesterData(semester, classStudentMap, teacherAssignments, subjects) {
    // Insert data in a transaction
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // 1. Enroll students
            const stmtEnroll = db.prepare(`
                INSERT OR IGNORE INTO SiswaKelas (id_siswa, id_kelas, id_ta_semester)
                VALUES (?, ?, ?)
            `);
            
            let enrollCount = 0;
            Object.keys(classStudentMap).forEach(kelasId => {
                classStudentMap[kelasId].forEach(siswaId => {
                    stmtEnroll.run(siswaId, kelasId, semester.id_ta_semester);
                    enrollCount++;
                });
            });
            stmtEnroll.finalize();
            console.log(`   ✅ Enrolled ${enrollCount} students`);
            
            // 2. Assign teachers
            const stmtTeacher = db.prepare(`
                INSERT OR IGNORE INTO GuruMataPelajaranKelas (id_guru, id_mapel, id_kelas, id_ta_semester)
                VALUES (?, ?, ?, ?)
            `);
            
            teacherAssignments.forEach(ta => {
                stmtTeacher.run(ta.id_guru, ta.id_mapel, ta.id_kelas, semester.id_ta_semester);
            });
            stmtTeacher.finalize();
            console.log(`   ✅ Assigned ${teacherAssignments.length} teachers`);
            
            // 3. Generate grades (3-5 TP per subject + 1 UAS)
            const stmtGrade = db.prepare(`
                INSERT INTO Nilai (id_siswa, id_kelas, id_guru, id_mapel, id_ta_semester, jenis_nilai, urutan_tp, nilai, tanggal_input)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `);
            
            let gradeCount = 0;
            
            Object.keys(classStudentMap).forEach(kelasId => {
                const studentsInClass = classStudentMap[kelasId];
                
                // Get teacher assignments for this class
                const classTeachers = teacherAssignments.filter(ta => ta.id_kelas == kelasId);
                
                studentsInClass.forEach(siswaId => {
                    classTeachers.forEach(ta => {
                        // Random 3-5 TP per subject
                        const numTP = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
                        
                        // Generate TP grades
                        for (let i = 1; i <= numTP; i++) {
                            const grade = 70 + Math.floor(Math.random() * 26); // 70-95
                            stmtGrade.run(siswaId, kelasId, ta.id_guru, ta.id_mapel, semester.id_ta_semester, 'TP', i, grade);
                            gradeCount++;
                        }
                        
                        // Generate 1 UAS grade
                        const uasGrade = 75 + Math.floor(Math.random() * 21); // 75-95
                        stmtGrade.run(siswaId, kelasId, ta.id_guru, ta.id_mapel, semester.id_ta_semester, 'UAS', null, uasGrade);
                        gradeCount++;
                    });
                });
            });
            
            stmtGrade.finalize();
            console.log(`   ✅ Generated ${gradeCount} grades`);
            
            db.run('COMMIT', (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
}

// Main execution
async function main() {
    try {
        // Step 1: Backup
        await backupDatabase();
        
        // Step 2: Clean
        await cleanExistingData();
        
        // Step 3-7: Setup resources
        const semesters = await setupSemesters();
        const students = await setupStudents();
        const teachers = await getTeachers();
        const subjects = await getSubjects();
        const classes = await getClasses();
        
        console.log('\n📊 RESOURCES SUMMARY:\n');
        console.log(`   Semesters: ${semesters.length}`);
        console.log(`   Students: ${students.length}`);
        console.log(`   Teachers: ${teachers.length}`);
        console.log(`   Subjects: ${subjects.length}`);
        console.log(`   Classes: ${classes.length}`);
        
        // Step 8: Simulate
        await simulate6Years(semesters, students, teachers, subjects, classes);
        
        // Final statistics
        console.log('\n📈 FINAL STATISTICS:\n');
        
        const stats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    (SELECT COUNT(*) FROM Siswa) as total_students,
                    (SELECT COUNT(*) FROM SiswaKelas) as total_enrollments,
                    (SELECT COUNT(*) FROM GuruMataPelajaranKelas) as total_teacher_assignments,
                    (SELECT COUNT(*) FROM Nilai) as total_grades
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        console.log(`   👥 Total Students: ${stats.total_students}`);
        console.log(`   📚 Total Enrollments: ${stats.total_enrollments}`);
        console.log(`   👨‍🏫 Total Teacher Assignments: ${stats.total_teacher_assignments}`);
        console.log(`   📊 Total Grades: ${stats.total_grades}`);
        
        console.log('\n' + '='.repeat(80));
        console.log('🎉 SUCCESS! 6-year simulation data is ready!');
        console.log('🌐 You can now test all analytics features with comprehensive data!');
        console.log('='.repeat(80) + '\n');
        
        db.close();
        
    } catch (error) {
        console.error('\n❌ ERROR:', error);
        db.close();
        process.exit(1);
    }
}

main();
