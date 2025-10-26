// frontend/src/features/guru/WaliKelasGradeView.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import * as guruApi from '../../api/guru';
import { ALLOWED_MAPEL_WALI, normalizeName } from '../../config/constants';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const WaliKelasGradeView = ({ activeTASemester, userId }) => {
  const [gradesData, setGradesData] = useState(null); // Raw data from API
  const [classInfo, setClassInfo] = useState(null); // Class info from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState({
    gradesPerSubjectTable: new Map(), // Map<nama_mapel, Array<studentGradeData>>
    summaryTableData: [],             // Array<summaryStudentData>
    uniqueTipeNilaiPerMapel: new Map(), // Map<nama_mapel, Set<nama_tipe>>
    gradesByStudentChart: [],
    gradesBySubjectChart: [],
    gradeDistributionChart: [],
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const fetchWaliKelasGrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId || !activeTASemester) {
        setError("Informasi guru atau tahun ajaran aktif tidak tersedia.");
        setLoading(false);
        return;
      }
      const response = await guruApi.getWaliKelasGrades(userId, activeTASemester.id_ta_semester);
      setGradesData(response.grades);
      setClassInfo(response.classInfo);
      processGradeData(response.grades);
    } catch (err) {
      setError(err.message);
      setGradesData([]);
      setClassInfo(null);
      setProcessedData({
        gradesPerSubjectTable: new Map(),
        summaryTableData: [],
        uniqueTipeNilaiPerMapel: new Map(),
        gradesByStudentChart: [],
        gradesBySubjectChart: [],
        gradeDistributionChart: [],
      });
    } finally {
      setLoading(false);
    }
  }, [activeTASemester, userId]);

  useEffect(() => {
    fetchWaliKelasGrades();
  }, [fetchWaliKelasGrades]);

  const processGradeData = (grades) => {
    const gradesPerSubjectTable = new Map(); // { 'Matematika': [{id_siswa, nama_siswa, 'Tugas Harian': 80, 'UTS': 75, total_mapel, count_mapel}, ...]}
    const summaryStudentMap = new Map(); // { id_siswa: { nama_siswa, overall_total, overall_count, 'Fisika_RataRata': 85, ... } }
    const subjectChartMap = new Map(); // { nama_mapel: { total_nilai, count } }
    // gradeDistributionCounts akan dihitung dari rata-rata akhir siswa, bukan nilai individual
    const uniqueTipeNilaiPerMapel = new Map(); // { 'Matematika': Set('Tugas Harian', 'UTS'), ... }

    // First pass: Populate detailed subject data and initial summary data
    grades.forEach(grade => {
      // Ensure grade.nama_mapel and grade.nama_tipe are not null/undefined
      if (!grade.nama_mapel || !grade.nama_tipe) return;

      // Initialize structures if not present
      if (!gradesPerSubjectTable.has(grade.nama_mapel)) {
        gradesPerSubjectTable.set(grade.nama_mapel, new Map()); // Inner map for students
      }
      const studentsInSubjectMap = gradesPerSubjectTable.get(grade.nama_mapel);

      if (!studentsInSubjectMap.has(grade.id_siswa)) {
        studentsInSubjectMap.set(grade.id_siswa, {
          id_siswa: grade.id_siswa,
          nama_siswa: grade.nama_siswa,
          total_mapel_nilai: 0,
          count_mapel_nilai: 0,
        });
      }
      const studentSubjectData = studentsInSubjectMap.get(grade.id_siswa);
      studentSubjectData[grade.nama_tipe] = grade.nilai; // Assign grade by type
      studentSubjectData.total_mapel_nilai += grade.nilai;
      studentSubjectData.count_mapel_nilai++;

      // Collect unique grade types per subject
      if (!uniqueTipeNilaiPerMapel.has(grade.nama_mapel)) {
        uniqueTipeNilaiPerMapel.set(grade.nama_mapel, new Set());
      }
      uniqueTipeNilaiPerMapel.get(grade.nama_mapel).add(grade.nama_tipe);

      // Populate summaryStudentMap (for overall student averages and per-subject averages)
      if (!summaryStudentMap.has(grade.id_siswa)) {
        summaryStudentMap.set(grade.id_siswa, {
          id_siswa: grade.id_siswa,
          nama_siswa: grade.nama_siswa,
          overall_total: 0,
          overall_count: 0,
          subject_totals: new Map(), // { 'Fisika': { total: 0, count: 0 } }
        });
      }
      const studentSummary = summaryStudentMap.get(grade.id_siswa);
      studentSummary.overall_total += grade.nilai;
      studentSummary.overall_count++;

      if (!studentSummary.subject_totals.has(grade.nama_mapel)) {
        studentSummary.subject_totals.set(grade.nama_mapel, { total: 0, count: 0 });
      }
      const subjectTotal = studentSummary.subject_totals.get(grade.nama_mapel);
      subjectTotal.total += grade.nilai;
      subjectTotal.count++;

      // Populate subjectChartMap (for overall subject average chart)
      if (!subjectChartMap.has(grade.nama_mapel)) {
        subjectChartMap.set(grade.nama_mapel, { total_nilai: 0, count: 0 });
      }
      const subjectChart = subjectChartMap.get(grade.nama_mapel);
      subjectChart.total_nilai += grade.nilai;
      subjectChart.count++;
    });

    // Finalize gradesPerSubjectTable
    const finalGradesPerSubjectTable = new Map();
    gradesPerSubjectTable.forEach((studentsMap, nama_mapel) => {
      const studentList = Array.from(studentsMap.values()).map(student => ({
        ...student,
        rata_rata_mapel: student.count_mapel_nilai > 0 ? parseFloat((student.total_mapel_nilai / student.count_mapel_nilai).toFixed(2)) : 0,
      })).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));
      finalGradesPerSubjectTable.set(nama_mapel, studentList);
    });

    // Finalize summaryTableData
    const summaryTableData = Array.from(summaryStudentMap.values()).map(student => {
      const studentSummaryObj = {
        id_siswa: student.id_siswa,
        nama_siswa: student.nama_siswa,
        overall_final_average: student.overall_count > 0 ? parseFloat((student.overall_total / student.overall_count).toFixed(2)) : 0,
      };
      student.subject_totals.forEach((data, nama_mapel) => {
        studentSummaryObj[`${nama_mapel}_RataRata`] = data.count > 0 ? parseFloat((data.total / data.count).toFixed(2)) : null;
      });
      return studentSummaryObj;
    }).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

    // --- NEW LOGIC FOR GRADE DISTRIBUTION CHART (BASED ON STUDENT FINAL AVERAGE) ---
    const gradeDistributionCounts = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'E (<60)': 0 };
    summaryTableData.forEach(student => {
      const average = student.overall_final_average;
      if (average >= 90) gradeDistributionCounts['A (90-100)']++;
      else if (average >= 80) gradeDistributionCounts['B (80-89)']++;
      else if (average >= 70) gradeDistributionCounts['C (70-79)']++;
      else if (average >= 60) gradeDistributionCounts['D (60-69)']++;
      else gradeDistributionCounts['E (<60)']++;
    });
    const totalStudentsForDistribution = Object.values(gradeDistributionCounts).reduce((sum, count) => sum + count, 0);
    const gradeDistributionChart = Object.entries(gradeDistributionCounts).map(([range, count]) => ({
      name: range,
      value: count,
      percentage: totalStudentsForDistribution > 0 ? parseFloat(((count / totalStudentsForDistribution) * 100).toFixed(2)) : 0,
    }));
    // --- END NEW LOGIC ---

    // Chart data (re-using existing logic)
    const gradesByStudentChart = Array.from(summaryStudentMap.values()).map(student => ({
      nama_siswa: student.nama_siswa,
      rata_rata: student.overall_count > 0 ? parseFloat((student.overall_total / student.overall_count).toFixed(2)) : 0,
    })).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

    let gradesBySubjectChart = Array.from(subjectChartMap.entries()).map(([name, data]) => ({
      nama_mapel: name,
      rata_rata: data.count > 0 ? parseFloat((data.total_nilai / data.count).toFixed(2)) : 0,
    })).sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));

    // === Apply Wali Kelas subject filter ===
    const allowedSet = new Set(ALLOWED_MAPEL_WALI.map(normalizeName));

    // Filter the per-subject detailed tables
    const filteredGradesPerSubjectTable = new Map();
    finalGradesPerSubjectTable.forEach((value, key) => {
      if (allowedSet.has(normalizeName(key))) {
        filteredGradesPerSubjectTable.set(key, value);
      }
    });

    // Filter unique grade types map to only allowed subjects
    const filteredUniqueTipeNilaiPerMapel = new Map();
    uniqueTipeNilaiPerMapel.forEach((set, key) => {
      if (allowedSet.has(normalizeName(key))) {
        filteredUniqueTipeNilaiPerMapel.set(key, set);
      }
    });

    // Filter chart data to allowed subjects
    gradesBySubjectChart = gradesBySubjectChart.filter(item => allowedSet.has(normalizeName(item.nama_mapel)));

    setProcessedData({
      gradesPerSubjectTable: filteredGradesPerSubjectTable,
      summaryTableData,
      uniqueTipeNilaiPerMapel: filteredUniqueTipeNilaiPerMapel,
      gradesByStudentChart,
      gradesBySubjectChart,
      gradeDistributionChart, // Use the newly calculated distribution
    });
  };

  const sortedSummaryData = useMemo(() => {
    let sortableItems = [...processedData.summaryTableData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else { // Numeric or null
          aValue = aValue === null ? -Infinity : aValue; // Treat null as very small for sorting
          bValue = bValue === null ? -Infinity : bValue;

          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableItems;
  }, [processedData.summaryTableData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
        direction = 'none'; // Add a 'none' state to remove sorting
        key = null; // Reset key
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') return ' ▲';
      if (sortConfig.direction === 'descending') return ' ▼';
    }
    return '';
  };

  if (loading) return <p>Memuat nilai kelas wali...</p>;
  if (error) return <p className="message error">Error: {error}</p>;
  if (!classInfo) return <p className="message info">Anda bukan wali kelas untuk Tahun Ajaran & Semester aktif ini.</p>;
  if (!gradesData || gradesData.length === 0) return <p className="message info">Belum ada nilai yang diinput untuk kelas {classInfo.nama_kelas} di semester ini.</p>;

  // Get all unique subject names for summary table headers (already filtered)
  const allSubjectNames = Array.from(processedData.gradesPerSubjectTable.keys()).sort();

  return (
    <div className="feature-content">
      <h2>Nilai Kelas Wali: {classInfo.nama_kelas}</h2>
      <p className="message info">Menampilkan semua nilai siswa di kelas {classInfo.nama_kelas} untuk Tahun Ajaran & Semester {activeTASemester.tahun_ajaran} {activeTASemester.semester}.</p>

      {/* Bagian Tabel Nilai per Mata Pelajaran */}
      {Array.from(processedData.gradesPerSubjectTable.entries()).map(([nama_mapel, studentsGradeList]) => {
        const uniqueTipeNilai = Array.from(processedData.uniqueTipeNilaiPerMapel.get(nama_mapel) || []).sort();
        const dynamicColumnsCount = uniqueTipeNilai.length;
        // Adjust column widths for per-subject tables
        const perSubjectGridTemplateColumns = `minmax(150px, 1.5fr) repeat(${dynamicColumnsCount}, minmax(100px, 1fr)) minmax(120px, 0.8fr)`;

        return (
          <div key={nama_mapel} style={{ marginBottom: '40px' }}>
            <h4>Detail Nilai {nama_mapel}</h4>
            <div className="grades-table-wrapper comprehensive-grades-table">
              <div className="grades-grid-header comprehensive-grades-header" style={{ gridTemplateColumns: perSubjectGridTemplateColumns }}>
                <div className="grid-header-item">Nama Siswa</div>
                {uniqueTipeNilai.map(tipe => (
                  <div key={tipe} className="grid-header-item grades-dynamic-header">{tipe}</div>
                ))}
                <div className="grid-header-item">Rata-rata {nama_mapel}</div>
              </div>
              {studentsGradeList.map(student => (
                <div key={student.id_siswa} className="grades-grid-row comprehensive-grades-row" style={{ gridTemplateColumns: perSubjectGridTemplateColumns }}>
                  <div className="grid-cell-item student-name">{student.nama_siswa}</div>
                  {uniqueTipeNilai.map(tipe => (
                    <div key={`${student.id_siswa}-${tipe}`} className="grid-cell-item">
                      {student[tipe] !== undefined ? student[tipe] : '-'}
                    </div>
                  ))}
                  <div className="grid-cell-item grades-average">{student.rata_rata_mapel}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Bagian Tabel Ringkasan Akhir */}
      <h3 style={{ marginTop: '40px' }}>Ringkasan Nilai Siswa Keseluruhan</h3>
      <div className="grades-table-wrapper comprehensive-grades-table">
        <div className="grades-grid-header comprehensive-grades-header"
             style={{ gridTemplateColumns: `minmax(180px, 1.5fr) repeat(${allSubjectNames.length}, minmax(120px, 1fr)) minmax(150px, 0.8fr)` }}>
          <div className="grid-header-item sortable" onClick={() => requestSort('nama_siswa')}>
            Nama Siswa {getSortIndicator('nama_siswa')}
          </div>
          {allSubjectNames.map(subject => (
            <div key={subject} className="grid-header-item grades-dynamic-header sortable" onClick={() => requestSort(`${subject}_RataRata`)}>
              {subject} Rata-rata {getSortIndicator(`${subject}_RataRata`)}
            </div>
          ))}
          <div className="grid-header-item sortable" onClick={() => requestSort('overall_final_average')}>
            Rata-rata Akhir {getSortIndicator('overall_final_average')}
          </div>
        </div>
        {sortedSummaryData.map(student => (
          <div key={student.id_siswa} className="grades-grid-row comprehensive-grades-row"
               style={{ gridTemplateColumns: `minmax(180px, 1.5fr) repeat(${allSubjectNames.length}, minmax(120px, 1fr)) minmax(150px, 0.8fr)` }}>
            <div className="grid-cell-item student-name">{student.nama_siswa}</div>
            {allSubjectNames.map(subject => (
              <div key={`${student.id_siswa}-${subject}_RataRata`} className="grid-cell-item">
                {student[`${subject}_RataRata`] !== null ? student[`${subject}_RataRata`] : '-'}
              </div>
            ))}
            <div className="grid-cell-item grades-average">{student.overall_final_average}</div>
          </div>
        ))}
      </div>


      {/* Bagian Grafik */}
      <h4 style={{ marginTop: '40px' }}>Statistik Nilai</h4>
      <div className="charts-container">
        <div className="chart-card">
          <h5>Rata-rata Nilai per Siswa (Keseluruhan)</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.gradesByStudentChart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nama_siswa" interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rata_rata" fill="#0088FE" name="Rata-rata Nilai" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h5>Rata-rata Nilai per Mata Pelajaran (Kelas)</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.gradesBySubjectChart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nama_mapel" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rata_rata" fill="#00C49F" name="Rata-rata Nilai" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h5>Distribusi Nilai (Berdasarkan Rata-rata Akhir Siswa)</h5>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedData.gradeDistributionChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
              >
                {processedData.gradeDistributionChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              {/* Perbaikan di sini: Mengubah label tooltip menjadi "siswa" */}
              <Tooltip formatter={(value, name, props) => [`${value} siswa`, props.payload.name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WaliKelasGradeView;
