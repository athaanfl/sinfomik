// frontend/src/features/admin/TipeNilaiManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

const TipeNilaiManagement = () => {
  const [tipeNilai, setTipeNilai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTipeName, setNewTipeName] = useState('');
  const [newTipeDescription, setNewTipeDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchTipeNilai = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getTipeNilai();
      setTipeNilai(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipeNilai();
  }, []);

  const handleAddTipeNilai = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.addTipeNilai({
        nama_tipe: newTipeName,
        deskripsi: newTipeDescription
      });
      setMessage(response.message);
      setMessageType('success');
      setNewTipeName('');
      setNewTipeDescription('');
      fetchTipeNilai(); // Refresh daftar
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  if (loading) return <p>Memuat Tipe Nilai...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Manajemen Tipe Nilai</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <h4>Tambah Tipe Nilai Baru</h4>
      <form onSubmit={handleAddTipeNilai} className="form-container-small">
        <div className="form-group">
          <label>Nama Tipe Nilai:</label>
          <input
            type="text"
            value={newTipeName}
            onChange={(e) => setNewTipeName(e.target.value)}
            placeholder="Contoh: Tugas, UTS, UAS"
            required
          />
        </div>
        <div className="form-group">
          <label>Deskripsi (opsional):</label>
          <textarea
            value={newTipeDescription}
            onChange={(e) => setNewTipeDescription(e.target.value)}
          ></textarea>
        </div>
        <button type="submit" className="submit-button">Tambah Tipe Nilai</button>
      </form>

      <h4>Daftar Tipe Nilai</h4>
      {tipeNilai.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Tipe</th>
              <th>Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            {tipeNilai.map((tipe) => (
              <tr key={tipe.id_tipe_nilai}>
                <td>{tipe.id_tipe_nilai}</td>
                <td>{tipe.nama_tipe}</td>
                <td>{tipe.deskripsi || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada tipe nilai yang terdaftar.</p>
      )}
    </div>
  );
};

export default TipeNilaiManagement;
