// frontend/src/features/admin/KenaikanKelas.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

const KenaikanKelas = () => {
  const [taSemesters, setTASemesters] = useState([]);
  const [fromTASemesterId, setFromTASemesterId] = useState('');
  const [toTASemesterId, setToTASemesterId] = useState('');
  const [fromKelasId, setFromKelasId] = useState('');
  const [toKelasId, setToKelasId] = useState('');
  const [kelasFrom, setKelasFrom] = useState([]);
  const [kelasTo, setKelasTo] = useState([]);
  const [studentsInFromKelas, setStudentsInFromKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const taData = await adminApi.getTASemester();
      setTASemesters(taData);
      if (taData.length > 0) {
        // Set default to the current active semester if available, otherwise first one
        const currentActive = taData.find(ta => ta.is_aktif);
        setFromTASemesterId(currentActive ? currentActive.id_ta_semester : taData[0].id_ta_semester);
        setToTASemesterId(currentActive ? currentActive.id_ta_semester : taData[0].id_ta_semester);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchKelasForSemester = async (semesterId, setKelasState) => {
    if (!semesterId) {
      setKelasState([]);
      return;
    }
    try {
      const data = await adminApi.getKelas(semesterId);
      setKelasState(data);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setKelasState([]);
    }
  };

  const fetchStudentsForPromotion = async () => {
    if (fromKelasId && fromTASemesterId) {
      try {
        const data = await adminApi.getSiswaInKelas(fromKelasId, fromTASemesterId);
        setStudentsInFromKelas(data);
      } catch (err) {
        console.error("Error fetching students for promotion:", err);
        setStudentsInFromKelas([]);
      }
    } else {
      setStudentsInFromKelas([]);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchKelasForSemester(fromTASemesterId, setKelasFrom);
  }, [fromTASemesterId]);

  useEffect(() => {
    // Set default fromKelasId when kelasFrom is loaded
    if (kelasFrom.length > 0 && !fromKelasId) {
        setFromKelasId(kelasFrom[0].id_kelas);
    } else if (kelasFrom.length === 0) {
        setFromKelasId(''); // Clear if no classes
    }
  }, [kelasFrom, fromKelasId]); // Add fromKelasId to dependency array

  useEffect(() => {
    fetchKelasForSemester(toTASemesterId, setKelasTo);
  }, [toTASemesterId]);

  useEffect(() => {
    // Set default toKelasId when kelasTo is loaded
    if (kelasTo.length > 0 && !toKelasId) {
        setToKelasId(kelasTo[0].id_kelas);
    } else if (kelasTo.length === 0) {
        setToKelasId(''); // Clear if no classes
    }
  }, [kelasTo, toKelasId]); // Add toKelasId to dependency array


  useEffect(() => {
    fetchStudentsForPromotion();
  }, [fromKelasId, fromTASemesterId]);

  const handlePromoteStudents = async () => {
    setMessage('');
    setMessageType('');
    if (!fromKelasId || !toKelasId || !fromTASemesterId || !toTASemesterId || studentsInFromKelas.length === 0) {
      setMessage('Harap lengkapi semua pilihan dan pastikan ada siswa di kelas asal.');
      setMessageType('error');
      return;
    }
    if (fromKelasId === toKelasId && fromTASemesterId === toTASemesterId) {
      setMessage('Kelas asal dan tujuan tidak boleh sama untuk kenaikan kelas di semester yang sama.');
      setMessageType('error');
      return;
    }

    const studentIdsToPromote = studentsInFromKelas.map(s => s.id_siswa);

    try {
      const response = await adminApi.promoteStudents(studentIdsToPromote, toKelasId, toTASemesterId);
      setMessage(response.message);
      setMessageType('success');
      fetchStudentsForPromotion(); // Refresh daftar siswa di kelas asal
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  if (loading) return <p>Memuat data kenaikan kelas...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Kenaikan Kelas Siswa</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}
      <p>Fitur ini akan membantu Anda mempromosikan siswa ke kelas berikutnya untuk tahun ajaran/semester baru.</p>

      <div className="form-row"> {/* Use new class for layout */}
        <div className="form-column">
          <h4>Dari:</h4>
          <div className="form-group">
            <label>Tahun Ajaran & Semester:</label>
            <select value={fromTASemesterId} onChange={(e) => setFromTASemesterId(parseInt(e.target.value))}>
              {taSemesters.map(ta => (
                <option key={ta.id_ta_semester} value={ta.id_ta_semester}>{ta.tahun_ajaran} {ta.semester}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Kelas Asal:</label>
            <select value={fromKelasId} onChange={(e) => setFromKelasId(parseInt(e.target.value))}>
              {kelasFrom.map(k => (
                <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-column">
          <h4>Ke:</h4>
          <div className="form-group">
            <label>Tahun Ajaran & Semester:</label>
            <select value={toTASemesterId} onChange={(e) => setToTASemesterId(parseInt(e.target.value))}>
              {taSemesters.map(ta => (
                <option key={ta.id_ta_semester} value={ta.id_ta_semester}>{ta.tahun_ajaran} {ta.semester}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Kelas Tujuan:</label>
            <select value={toKelasId} onChange={(e) => setToKelasId(parseInt(e.target.value))}>
              {kelasTo.map(k => (
                <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <h4>Siswa di Kelas Asal ({kelasFrom.find(k => k.id_kelas === fromKelasId)?.nama_kelas || ''})</h4>
      {studentsInFromKelas.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Siswa</th>
              <th>Nama Siswa</th>
            </tr>
          </thead>
          <tbody>
            {studentsInFromKelas.map(s => (
              <tr key={s.id_siswa}>
                <td>{s.id_siswa}</td>
                <td>{s.nama_siswa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Tidak ada siswa di kelas asal yang dipilih.</p>
      )}

      <button onClick={handlePromoteStudents} className="submit-button" disabled={studentsInFromKelas.length === 0 || !toKelasId}>
        Promosikan Siswa
      </button>
    </div>
  );
};

export default KenaikanKelas;