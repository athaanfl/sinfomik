// frontend/src/features/admin/KelasManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

const KelasManagement = ({ activeTASemester }) => {
  const [kelas, setKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newKelasName, setNewKelasName] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [selectedWaliKelas, setSelectedWaliKelas] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchKelasAndTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTASemester) {
        const kelasData = await adminApi.getKelas(activeTASemester.id_ta_semester);
        setKelas(kelasData);
      } else {
        setKelas([]);
      }
      const teachersData = await adminApi.getTeachers();
      setTeachers(teachersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelasAndTeachers();
  }, [activeTASemester]);

  const handleAddKelas = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    if (!activeTASemester) {
      setMessage('Harap atur Tahun Ajaran & Semester aktif terlebih dahulu.');
      setMessageType('error');
      return;
    }

    const waliKelasId = selectedWaliKelas ? teachers.find(t => t.nama_guru === selectedWaliKelas)?.id_guru : null;

    try {
      const response = await adminApi.addKelas({
        nama_kelas: newKelasName,
        id_wali_kelas: waliKelasId,
        id_ta_semester: activeTASemester.id_ta_semester
      });
      setMessage(response.message);
      setMessageType('success');
      setNewKelasName('');
      setSelectedWaliKelas('');
      fetchKelasAndTeachers(); // Refresh daftar
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  if (loading) return <p>Memuat Kelas...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Manajemen Kelas</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      {activeTASemester ? (
        <p className="message info">Kelas akan ditambahkan untuk Tahun Ajaran & Semester Aktif: <b>{activeTASemester.tahun_ajaran} {activeTASemester.semester}</b></p>
      ) : (
        <p className="message warning">Harap atur Tahun Ajaran & Semester aktif terlebih dahulu.</p>
      )}

      <h4>Tambah Kelas Baru</h4>
      <form onSubmit={handleAddKelas} className="form-container-small">
        <div className="form-group">
          <label>Nama Kelas:</label>
          <input
            type="text"
            value={newKelasName}
            onChange={(e) => setNewKelasName(e.target.value)}
            placeholder="Contoh: X-A, XI IPA 1"
            required
          />
        </div>
        <div className="form-group">
          <label>Wali Kelas:</label>
          <select value={selectedWaliKelas} onChange={(e) => setSelectedWaliKelas(e.target.value)}>
            <option value="">Pilih Wali Kelas</option>
            {teachers.map(teacher => (
              <option key={teacher.id_guru} value={teacher.nama_guru}>{teacher.nama_guru}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="submit-button" disabled={!activeTASemester}>Tambah Kelas</button>
      </form>

      <h4>Daftar Kelas (Berdasarkan Tahun Ajaran & Semester Aktif)</h4>
      {kelas.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Kelas</th>
              <th>Wali Kelas</th>
              <th>Tahun Ajaran</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            {kelas.map((k) => (
              <tr key={k.id_kelas}>
                <td>{k.id_kelas}</td>
                <td>{k.nama_kelas}</td>
                <td>{k.wali_kelas || '-'}</td>
                <td>{k.tahun_ajaran}</td>
                <td>{k.semester}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada kelas yang terdaftar untuk Tahun Ajaran & Semester aktif ini.</p>
      )}
    </div>
  );
};

export default KelasManagement;
