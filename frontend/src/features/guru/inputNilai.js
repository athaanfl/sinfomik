// frontend/src/features/guru/inputNilai.js
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import * as guruApi from '../../api/guru'; // Import API guru
import * as adminApi from '../../api/admin'; // Perlu getTipeNilai dari adminApi
import { colorScheme, getStatusClasses, getButtonClasses, getCardClasses, getHeaderClasses } from '../../styles/colorScheme';

const InputNilai = ({ activeTASemester, userId }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [tipeNilai, setTipeNilai] = useState([]);
  const [gradesInput, setGradesInput] = useState({}); // { studentId_tipeNilaiId: value }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Wrap fetchData with useCallback to prevent re-creation on every render
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId || !activeTASemester) {
        setError("Informasi guru atau tahun ajaran aktif tidak tersedia.");
        return;
      }
      const [assignmentsData, tipeNilaiData] = await Promise.all([
        guruApi.getGuruAssignments(userId, activeTASemester.id_ta_semester),
        adminApi.getTipeNilai() // Mengambil tipe nilai dari adminApi
      ]);
      setAssignments(assignmentsData);
      setTipeNilai(tipeNilaiData);

      if (assignmentsData.length > 0 && !selectedAssignment) {
        setSelectedAssignment(`${assignmentsData[0].id_kelas}-${assignmentsData[0].id_mapel}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTASemester, userId, selectedAssignment]); // Add selectedAssignment to dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Now fetchData is a stable dependency

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedAssignment && activeTASemester) {
        const [kelasId] = selectedAssignment.split('-').map(Number); // mapelId removed as it's unused
        try {
          const studentsData = await guruApi.getStudentsInClass(kelasId, activeTASemester.id_ta_semester);
          setStudentsInClass(studentsData);
          // Inisialisasi gradesInput dengan nilai yang sudah ada jika memungkinkan
          // Untuk demo, kita abaikan inisialisasi nilai lama dan fokus pada input baru
          setGradesInput({});
        } catch (err) {
          setError(err.message);
          setStudentsInClass([]);
        }
      } else {
        setStudentsInClass([]);
      }
    };
    fetchStudents();
  }, [selectedAssignment, activeTASemester]);

  const handleGradeChange = (studentId, tipeNilaiId, value) => {
    setGradesInput(prev => ({
      ...prev,
      [`${studentId}_${tipeNilaiId}`]: value
    }));
  };

  const handleSubmitGrades = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    if (!selectedAssignment || !activeTASemester || studentsInClass.length === 0 || tipeNilai.length === 0) {
      setMessage('Harap pilih kelas/mapel dan pastikan ada siswa serta tipe nilai.');
      setMessageType('error');
      return;
    }

    const [kelasId, mapelId] = selectedAssignment.split('-').map(Number);
    let successCount = 0;
    let failCount = 0;

    const gradePromises = [];
    studentsInClass.forEach(student => {
      tipeNilai.forEach(tipe => {
        const gradeValue = gradesInput[`${student.id_siswa}_${tipe.id_tipe_nilai}`];
        if (gradeValue !== undefined && gradeValue !== null && gradeValue !== '') {
          gradePromises.push(
            guruApi.addOrUpdateGrade({
              id_siswa: student.id_siswa,
              id_guru: userId,
              id_mapel: mapelId,
              id_kelas: kelasId,
              id_ta_semester: activeTASemester.id_ta_semester,
              id_tipe_nilai: tipe.id_tipe_nilai,
              nilai: parseFloat(gradeValue),
              keterangan: '' // Keterangan bisa ditambahkan input terpisah
            })
            .then(() => { successCount++; })
            .catch(err => {
              console.error(`Gagal menyimpan nilai untuk ${student.nama_siswa} (${tipe.nama_tipe}):`, err);
              failCount++;
            })
          );
        }
      });
    });

    try {
      await Promise.all(gradePromises);
      if (successCount > 0) {
        setMessage(`Berhasil menyimpan ${successCount} nilai. ${failCount} gagal.`);
        setMessageType('success');
        // Mungkin perlu refresh data nilai yang sudah ada di form jika ingin edit
      } else if (failCount > 0) {
        setMessage(`Gagal menyimpan ${failCount} nilai. Periksa konsol untuk detail.`);
        setMessageType('error');
      } else {
        setMessage('Tidak ada nilai yang diinput atau diubah.');
        setMessageType('info');
      }
    } catch (err) {
      setMessage(`Terjadi kesalahan umum saat menyimpan nilai: ${err.message}`);
      setMessageType('error');
    }
  };

  if (loading) return <p>Memuat data guru...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  const currentAssignment = assignments.find(
    assign => `${assign.id_kelas}-${assign.id_mapel}` === selectedAssignment
  );

  return (
    <div className="feature-content">
      <h2>Input Nilai Siswa</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      {!activeTASemester && <p className="message warning">Tahun Ajaran & Semester aktif belum diatur. Harap hubungi Admin.</p>}

      {assignments.length > 0 ? (
        <div className="form-group">
          <label>Pilih Kelas dan Mata Pelajaran:</label>
          <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)}>
            {assignments.map(assign => (
              <option key={`${assign.id_kelas}-${assign.id_mapel}`} value={`${assign.id_kelas}-${assign.id_mapel}`}>
                {assign.nama_kelas} - {assign.nama_mapel}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="message warning">Anda belum ditugaskan mengajar mata pelajaran di kelas manapun untuk semester aktif ini. Silakan hubungi Admin.</p>
      )}

      {currentAssignment && (
        <>
          <h3>Input Nilai untuk {currentAssignment.nama_mapel} di Kelas {currentAssignment.nama_kelas}</h3>
          {studentsInClass.length > 0 && tipeNilai.length > 0 ? (
            <form onSubmit={handleSubmitGrades} className="form-container-small">
              {/* Mengubah struktur grid */}
              <div className="grades-table-wrapper"> {/* Wrapper baru untuk tabel grid */}
                <div className="grades-grid-header"> {/* Baris header grid */}
                  <div className="grid-header-item">Nama Siswa</div>
                  {tipeNilai.map(tipe => (
                    <div key={tipe.id_tipe_nilai} className="grid-header-item">{tipe.nama_tipe}</div>
                  ))}
                </div>
                
                {studentsInClass.map(student => (
                  <div key={student.id_siswa} className="grades-grid-row"> {/* Setiap baris siswa adalah baris grid */}
                    <div className="grid-cell-item student-name">{student.nama_siswa}</div>
                    {tipeNilai.map(tipe => (
                      <div key={`${student.id_siswa}-${tipe.id_tipe_nilai}`} className="grid-cell-item">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={gradesInput[`${student.id_siswa}_${tipe.id_tipe_nilai}`] || ''}
                          onChange={(e) => handleGradeChange(student.id_siswa, tipe.id_tipe_nilai, e.target.value)}
                          className="grade-input-field"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div> {/* Akhir grades-table-wrapper */}
              <button type="submit" className="submit-button">Simpan Semua Nilai</button>
            </form>
          ) : (
            <p>Tidak ada siswa di kelas ini atau tipe nilai belum terdaftar.</p>
          )}
        </>
      )}
    </div>
  );
};

export default InputNilai;
