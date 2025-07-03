// frontend/src/features/admin/MataPelajaranManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

const MataPelajaranManagement = () => {
  const [mataPelajaran, setMataPelajaran] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMapelName, setNewMapelName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchMataPelajaran = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getMataPelajaran();
      setMataPelajaran(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMataPelajaran();
  }, []);

  const handleAddMataPelajaran = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.addMataPelajaran(newMapelName);
      setMessage(response.message);
      setMessageType('success');
      setNewMapelName('');
      fetchMataPelajaran(); // Refresh daftar
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  if (loading) return <p>Memuat Mata Pelajaran...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Manajemen Mata Pelajaran</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <h4>Tambah Mata Pelajaran Baru</h4>
      <form onSubmit={handleAddMataPelajaran} className="form-container-small">
        <div className="form-group">
          <label>Nama Mata Pelajaran:</label>
          <input
            type="text"
            value={newMapelName}
            onChange={(e) => setNewMapelName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button">Tambah Mata Pelajaran</button>
      </form>

      <h4>Daftar Mata Pelajaran</h4>
      {mataPelajaran.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Mata Pelajaran</th>
            </tr>
          </thead>
          <tbody>
            {mataPelajaran.map((mapel) => (
              <tr key={mapel.id_mapel}>
                <td>{mapel.id_mapel}</td>
                <td>{mapel.nama_mapel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada mata pelajaran yang terdaftar.</p>
      )}
    </div>
  );
};

export default MataPelajaranManagement;
