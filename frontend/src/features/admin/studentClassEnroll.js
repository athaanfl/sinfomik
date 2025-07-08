// frontend/src/features/admin/studentClassEnroll.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

const SiswaKelasAssignment = ({ activeTASemester }) => {
  const [students, setStudents] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]); // Array of student IDs
  const [studentsInSelectedKelas, setStudentsInSelectedKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, kelasData] = await Promise.all([
        adminApi.getStudents(),
        activeTASemester ? adminApi.getKelas(activeTASemester.id_ta_semester) : Promise.resolve([])
      ]);
      setStudents(studentsData);
      setKelas(kelasData);
      if (kelasData.length > 0 && !selectedKelasId) {
        setSelectedKelasId(kelasData[0].id_kelas);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsInKelas = async (kelasId, taSemesterId) => {
    if (!kelasId || !taSemesterId) {
      setStudentsInSelectedKelas([]);
      return;
    }
    try {
      const data = await adminApi.getSiswaInKelas(kelasId, taSemesterId);
      setStudentsInSelectedKelas(data);
    } catch (err) {
      console.error("Error fetching students in class:", err);
      setStudentsInSelectedKelas([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTASemester]);

  useEffect(() => {
    fetchStudentsInKelas(selectedKelasId, activeTASemester?.id_ta_semester);
  }, [selectedKelasId, activeTASemester, students]); // Re-fetch when students list changes (after adding new student)

  const handleCheckboxChange = (studentId) => {
    setSelectedStudents(prevSelected => {
      if (prevSelected.includes(studentId)) {
        return prevSelected.filter(id => id !== studentId);
      } else {
        return [...prevSelected, studentId];
      }
    });
  };

  const handleAssignStudents = async () => {
    setMessage('');
    setMessageType('');
    if (!selectedKelasId || !activeTASemester || selectedStudents.length === 0) {
      setMessage('Harap pilih kelas dan setidaknya satu siswa.');
      setMessageType('error');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Use a Promise.all to send all requests concurrently
    const assignmentPromises = selectedStudents.map(studentId => {
      return adminApi.assignSiswaToKelas({
        id_siswa: studentId,
        id_kelas: selectedKelasId,
        id_ta_semester: activeTASemester.id_ta_semester
      })
      .then(() => {
        successCount++;
      })
      .catch(err => {
        // Log the specific error for debugging
        console.error(`Failed to assign student ${studentId}:`, err);
        failCount++;
        // You might want to collect specific error messages for display
      });
    });

    try {
      await Promise.all(assignmentPromises);

      if (successCount > 0) {
        setMessage(`Berhasil menambahkan ${successCount} siswa ke kelas. ${failCount} gagal atau sudah ada.`);
        setMessageType('success');
        setSelectedStudents([]); // Clear selection
        fetchStudentsInKelas(selectedKelasId, activeTASemester.id_ta_semester); // Refresh daftar siswa di kelas
      } else if (failCount > 0) {
        setMessage(`Gagal menambahkan ${failCount} siswa. Mungkin sudah terdaftar atau ada kesalahan.`);
        setMessageType('error');
      } else {
        setMessage('Tidak ada siswa yang ditambahkan.');
        setMessageType('info');
      }
    } catch (err) {
      // This catch will only trigger if Promise.all itself fails, not for individual assignment errors
      setMessage(`Terjadi kesalahan umum saat penugasan: ${err.message}`);
      setMessageType('error');
    }
  };

  const availableStudents = students.filter(s =>
    !studentsInSelectedKelas.some(sisInKelas => sisInKelas.id_siswa === s.id_siswa)
  );

  if (loading) return <p>Memuat data...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Penugasan Siswa ke Kelas</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      {activeTASemester ? (
        <p className="message info">Penugasan untuk Tahun Ajaran & Semester Aktif: <b>{activeTASemester.tahun_ajaran} {activeTASemester.semester}</b></p>
      ) : (
        <p className="message warning">Harap atur Tahun Ajaran & Semester aktif terlebih dahulu.</p>
      )}

      {kelas.length > 0 ? (
        <>
          <div className="form-group">
            <label>Pilih Kelas:</label>
            <select value={selectedKelasId} onChange={(e) => setSelectedKelasId(parseInt(e.target.value))}>
              {kelas.map(k => (
                <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>

          <h4>Daftar Siswa di Kelas {kelas.find(k => k.id_kelas === selectedKelasId)?.nama_kelas || ''}</h4>
          {studentsInSelectedKelas.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Siswa</th>
                  <th>Nama Siswa</th>
                </tr>
              </thead>
              <tbody>
                {studentsInSelectedKelas.map(s => (
                  <tr key={s.id_siswa}>
                    <td>{s.id_siswa}</td>
                    <td>{s.nama_siswa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Tidak ada siswa di kelas ini untuk semester aktif.</p>
          )}

          <h4>Tambahkan Siswa ke Kelas Ini</h4>
          {availableStudents.length > 0 ? (
            <div className="student-checkbox-list"> {/* New container for checkboxes */}
              {availableStudents.map(s => (
                <label key={s.id_siswa} className="checkbox-item">
                  <input
                    type="checkbox"
                    value={s.id_siswa}
                    checked={selectedStudents.includes(s.id_siswa)}
                    onChange={() => handleCheckboxChange(s.id_siswa)}
                  />
                  {s.nama_siswa}
                </label>
              ))}
              <button onClick={handleAssignStudents} className="submit-button" disabled={!activeTASemester || selectedStudents.length === 0}>Tambahkan Siswa</button>
            </div>
          ) : (
            <p>Semua siswa sudah terdaftar di kelas ini atau tidak ada siswa yang tersedia.</p>
          )}
        </>
      ) : (
        <p className="message warning">Belum ada kelas yang terdaftar untuk Tahun Ajaran & Semester aktif ini.</p>
      )}
    </div>
  );
};

export default SiswaKelasAssignment;
