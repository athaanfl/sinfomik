// frontend/src/features/admin/teacherClassEnroll.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

const GuruMapelKelasAssignment = ({ activeTASemester }) => {
  const [teachers, setTeachers] = useState([]);
  const [mataPelajaran, setMataPelajaran] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedGuruId, setSelectedGuruId] = useState('');
  const [selectedMapelId, setSelectedMapelId] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teachersData, mapelData, kelasData, assignmentsData] = await Promise.all([
        adminApi.getTeachers(),
        adminApi.getMataPelajaran(),
        activeTASemester ? adminApi.getKelas(activeTASemester.id_ta_semester) : Promise.resolve([]),
        activeTASemester ? adminApi.getGuruMapelKelasAssignments(activeTASemester.id_ta_semester) : Promise.resolve([])
      ]);
      setTeachers(teachersData);
      setMataPelajaran(mapelData);
      setKelas(kelasData);
      setAssignments(assignmentsData);

      // Set default selected values if available
      if (teachersData.length > 0 && !selectedGuruId) setSelectedGuruId(teachersData[0].id_guru);
      if (mapelData.length > 0 && !selectedMapelId) setSelectedMapelId(mapelData[0].id_mapel);
      if (kelasData.length > 0 && !selectedKelasId) setSelectedKelasId(kelasData[0].id_kelas);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTASemester]);

  const handleAssignGuru = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    if (!activeTASemester || !selectedGuruId || !selectedMapelId || !selectedKelasId) {
      setMessage('Harap lengkapi semua pilihan.');
      setMessageType('error');
      return;
    }

    try {
      const response = await adminApi.assignGuruToMapelKelas({
        id_guru: selectedGuruId,
        id_mapel: selectedMapelId,
        id_kelas: selectedKelasId,
        id_ta_semester: activeTASemester.id_ta_semester
      });
      setMessage(response.message);
      setMessageType('success');
      fetchData(); // Refresh daftar
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  if (loading) return <p>Memuat data penugasan guru...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Penugasan Guru ke Mata Pelajaran & Kelas</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      {activeTASemester ? (
        <p className="message info">Penugasan untuk Tahun Ajaran & Semester Aktif: <b>{activeTASemester.tahun_ajaran} {activeTASemester.semester}</b></p>
      ) : (
        <p className="message warning">Harap atur Tahun Ajaran & Semester aktif terlebih dahulu.</p>
      )}

      {teachers.length > 0 && mataPelajaran.length > 0 && kelas.length > 0 ? (
        <>
          <h4>Tugaskan Guru</h4>
          <form onSubmit={handleAssignGuru} className="form-container-small">
            <div className="form-group">
              <label>Pilih Guru:</label>
              <select value={selectedGuruId} onChange={(e) => setSelectedGuruId(parseInt(e.target.value))}>
                {teachers.map(t => (
                  <option key={t.id_guru} value={t.id_guru}>{t.nama_guru}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Pilih Mata Pelajaran:</label>
              <select value={selectedMapelId} onChange={(e) => setSelectedMapelId(parseInt(e.target.value))}>
                {mataPelajaran.map(mp => (
                  <option key={mp.id_mapel} value={mp.id_mapel}>{mp.nama_mapel}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Pilih Kelas:</label>
              <select value={selectedKelasId} onChange={(e) => setSelectedKelasId(parseInt(e.target.value))}>
                {kelas.map(k => (
                  <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="submit-button" disabled={!activeTASemester}>Tugaskan Guru</button>
          </form>

          <h4>Daftar Penugasan Guru</h4>
          {assignments.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guru</th>
                  <th>Mata Pelajaran</th>
                  <th>Kelas</th>
                  <th>Tahun Ajaran</th>
                  <th>Semester</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assign, index) => (
                  <tr key={index}>
                    <td>{assign.nama_guru}</td>
                    <td>{assign.nama_mapel}</td>
                    <td>{assign.nama_kelas}</td>
                    <td>{assign.tahun_ajaran}</td>
                    <td>{assign.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Belum ada penugasan guru yang terdaftar untuk semester aktif ini.</p>
          )}
        </>
      ) : (
        <p className="message warning">Pastikan Guru, Mata Pelajaran, dan Kelas sudah terdaftar dan Tahun Ajaran/Semester aktif sudah diatur.</p>
      )}
    </div>
  );
};

export default GuruMapelKelasAssignment;
