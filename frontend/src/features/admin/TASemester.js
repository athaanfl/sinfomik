// frontend/src/features/admin/TASemester.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

const TASemesterManagement = ({ activeTASemester, setActiveTASemester }) => {
  const [taSemesters, setTASemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTahunAjaran, setNewTahunAjaran] = useState('');
  const [newSemester, setNewSemester] = useState('Ganjil');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchTASemesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getTASemester();
      setTASemesters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTASemesters();
  }, []);

  const handleAddTASemester = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.addTASemester(newTahunAjaran, newSemester);
      setMessage(response.message);
      setMessageType('success');
      setNewTahunAjaran('');
      setNewSemester('Ganjil');
      fetchTASemesters(); // Refresh daftar
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  const handleSetActive = async (id) => {
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.setActiveTASemester(id);
      setMessage(response.message);
      setMessageType('success');
      // Update activeTASemester state in parent (AdminDashboardContent)
      const updatedActive = taSemesters.find(ta => ta.id_ta_semester === id);
      setActiveTASemester(updatedActive || null);
      fetchTASemesters(); // Refresh daftar untuk update status aktif
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  if (loading) return <p>Memuat Tahun Ajaran & Semester...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Manajemen Tahun Ajaran & Semester</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <h4>Tambah Tahun Ajaran & Semester Baru</h4>
      <form onSubmit={handleAddTASemester} className="form-container-small">
        <div className="form-group">
          <label>Tahun Ajaran:</label>
          <input
            type="text"
            value={newTahunAjaran}
            onChange={(e) => setNewTahunAjaran(e.target.value)}
            placeholder="Contoh: 2024/2025"
            required
          />
        </div>
        <div className="form-group">
          <label>Semester:</label>
          <select value={newSemester} onChange={(e) => setNewSemester(e.target.value)}>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
        <button type="submit" className="submit-button">Tambah</button>
      </form>

      <h4>Daftar Tahun Ajaran & Semester</h4>
      {taSemesters.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tahun Ajaran</th>
              <th>Semester</th>
              <th>Aktif</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {taSemesters.map((ta) => (
              <tr key={ta.id_ta_semester}>
                <td>{ta.id_ta_semester}</td>
                <td>{ta.tahun_ajaran}</td>
                <td>{ta.semester}</td>
                <td>{ta.is_aktif ? 'Ya' : 'Tidak'}</td>
                <td>
                  {!ta.is_aktif && (
                    <button onClick={() => handleSetActive(ta.id_ta_semester)} className="action-button">Set Aktif</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada Tahun Ajaran & Semester yang terdaftar.</p>
      )}
    </div>
  );
};

export default TASemesterManagement;
