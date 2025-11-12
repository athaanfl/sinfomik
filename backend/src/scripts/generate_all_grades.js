// Generate grades for ALL currently enrolled students
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../academic_dashboard.db');
const db = new sqlite3.Database(dbPath);

const ACTIVE_SEMESTER = 1; // 2023/2024 Ganjil

console.log('\n📊 GENERATING GRADES FOR ALL ENROLLED STUDENTS\n');
console.log('='.repeat(80));

// Get all enrolled students with their classes
async function getEnrolledStudents() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                sk.id_siswa,
                s.nama_siswa,
                sk.id_kelas,
                k.nama_kelas
            FROM SiswaKelas sk
            JOIN Siswa s ON sk.id_siswa = s.id_siswa
            JOIN Kelas k ON sk.id_kelas = k.id_kelas
            WHERE sk.id_ta_semester = ?
            ORDER BY k.nama_kelas, s.nama_siswa
        `, [ACTIVE_SEMESTER], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Get teacher assignments for each class
async function getTeacherAssignments() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                gmpk.id_kelas,
                gmpk.id_guru,
                gmpk.id_mapel,
                g.nama_guru,
                m.nama_mapel,
                k.nama_kelas
            FROM GuruMataPelajaranKelas gmpk
            JOIN Guru g ON gmpk.id_guru = g.id_guru
            JOIN MataPelajaran m ON gmpk.id_mapel = m.id_mapel
            JOIN Kelas k ON gmpk.id_kelas = k.id_kelas
            WHERE gmpk.id_ta_semester = ?
            ORDER BY k.nama_kelas, m.nama_mapel
        `, [ACTIVE_SEMESTER], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Generate realistic grades
function generateGrades(students, teacherAssignments) {
    console.log('\n📝 GENERATING GRADES:\n');
    
    const grades = [];
    const gradesByClass = {};
    
    students.forEach(student => {
        // Find all teachers teaching in this student's class
        const classTeachers = teacherAssignments.filter(ta => ta.id_kelas === student.id_kelas);
        
        if (classTeachers.length === 0) {
            console.log(`⚠️  No teachers found for ${student.nama_siswa} in ${student.nama_kelas}`);
            return;
        }
        
        if (!gradesByClass[student.nama_kelas]) {
            gradesByClass[student.nama_kelas] = {
                students: 0,
                subjects: new Set()
            };
        }
        gradesByClass[student.nama_kelas].students++;
        
        classTeachers.forEach(teacher => {
            gradesByClass[student.nama_kelas].subjects.add(teacher.nama_mapel);
            
            // Generate 3-5 TP grades per subject
            const numTP = 3 + Math.floor(Math.random() * 3); // 3-5 TP
            
            for (let i = 1; i <= numTP; i++) {
                // Realistic grade distribution: 70-95
                const tpGrade = 70 + Math.floor(Math.random() * 26);
                grades.push({
                    id_siswa: student.id_siswa,
                    id_kelas: student.id_kelas,
                    id_guru: teacher.id_guru,
                    id_mapel: teacher.id_mapel,
                    id_ta_semester: ACTIVE_SEMESTER,
                    jenis_nilai: 'TP',
                    urutan_tp: i,
                    nilai: tpGrade
                });
            }
            
            // Generate 1 UAS grade (usually higher)
            const uasGrade = 75 + Math.floor(Math.random() * 21); // 75-95
            grades.push({
                id_siswa: student.id_siswa,
                id_kelas: student.id_kelas,
                id_guru: teacher.id_guru,
                id_mapel: teacher.id_mapel,
                id_ta_semester: ACTIVE_SEMESTER,
                jenis_nilai: 'UAS',
                urutan_tp: null,
                nilai: uasGrade
            });
        });
    });
    
    // Print summary
    console.log('📊 GRADES SUMMARY BY CLASS:\n');
    Object.keys(gradesByClass).sort().forEach(className => {
        const info = gradesByClass[className];
        console.log(`  ${className.padEnd(20)} | ${info.students} siswa | ${info.subjects.size} mata pelajaran`);
    });
    console.log(`\n✅ Total grade entries to insert: ${grades.length}`);
    
    return grades;
}

// Insert grades to database
async function insertGrades(grades) {
    console.log('\n💾 INSERTING GRADES TO DATABASE...\n');
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            const stmt = db.prepare(`
                INSERT INTO Nilai (id_siswa, id_kelas, id_guru, id_mapel, id_ta_semester, jenis_nilai, urutan_tp, nilai, tanggal_input)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `);
            
            let inserted = 0;
            let errors = 0;
            
            grades.forEach(g => {
                stmt.run(
                    g.id_siswa, g.id_kelas, g.id_guru, g.id_mapel, 
                    g.id_ta_semester, g.jenis_nilai, g.urutan_tp, g.nilai,
                    (err) => {
                        if (err) {
                            errors++;
                        } else {
                            inserted++;
                        }
                    }
                );
            });
            
            stmt.finalize((err) => {
                if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                } else {
                    db.run('COMMIT', (err) => {
                        if (err) reject(err);
                        else {
                            console.log(`✅ Successfully inserted: ${inserted} grades`);
                            if (errors > 0) {
                                console.log(`⚠️  Errors (likely duplicates): ${errors}`);
                            }
                            resolve({ inserted, errors });
                        }
                    });
                }
            });
        });
    });
}

// Check current grade count
async function checkGradeCount() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM Nilai WHERE id_ta_semester = ?`, [ACTIVE_SEMESTER], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });
}

// Main execution
async function main() {
    try {
        const beforeCount = await checkGradeCount();
        console.log(`📋 Current grades in database: ${beforeCount}\n`);
        
        const students = await getEnrolledStudents();
        const teacherAssignments = await getTeacherAssignments();
        
        console.log(`👥 Enrolled Students: ${students.length}`);
        console.log(`👨‍🏫 Teacher Assignments: ${teacherAssignments.length}`);
        
        if (students.length === 0) {
            console.log('\n⚠️  No enrolled students found!');
            db.close();
            return;
        }
        
        if (teacherAssignments.length === 0) {
            console.log('\n⚠️  No teacher assignments found! Please assign teachers first.');
            db.close();
            return;
        }
        
        const grades = generateGrades(students, teacherAssignments);
        
        if (grades.length === 0) {
            console.log('\n⚠️  No grades generated!');
            db.close();
            return;
        }
        
        const result = await insertGrades(grades);
        
        const afterCount = await checkGradeCount();
        
        console.log('\n' + '='.repeat(80));
        console.log('\n✅ GRADE GENERATION COMPLETED!\n');
        console.log(`📊 Before: ${beforeCount} grades`);
        console.log(`📊 After:  ${afterCount} grades`);
        console.log(`📈 Added:  ${afterCount - beforeCount} new grades\n`);
        console.log('🎯 Analytics features are now ready to use!');
        console.log('   - School Analytics: Average across all subjects');
        console.log('   - Angkatan Analytics: Track cohort performance');
        console.log('   - Student Analytics: Individual progress reports');
        console.log('   - Teacher Analytics: Class performance metrics\n');
        console.log('='.repeat(80) + '\n');
        
        db.close();
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        db.close();
    }
}

main();
