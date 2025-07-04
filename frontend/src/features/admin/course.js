// frontend/src/features/admin/MataPelajaranManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

// Komponen Modal Edit Mata Pelajaran
const EditMataPelajaranModal = ({ mapel, onClose, onSave }) => {
  const [editedMapelName, setEditedMapelName] = useState(mapel.nama_mapel);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.updateMataPelajaran(mapel.id_mapel, editedMapelName);
      setMessage(response.message);
      setMessageType('success');
      onSave(); // Panggil onSave untuk refresh data
      // onClose(); // Tutup modal setelah simpan
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Mata Pelajaran: {mapel.nama_mapel}</h3>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="form-container-small">
          <div className="form-group">
            <label>ID Mata Pelajaran (Tidak bisa diubah):</label>
            <input type="text" value={mapel.id_mapel} disabled />
          </div>
          <div className="form-group">
            <label>Nama Mata Pelajaran:</label>
            <input
              type="text"
              name="nama_mapel"
              value={editedMapelName}
              onChange={(e) => setEditedMapelName(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="submit-button">Simpan Perubahan</button>
            <button type="button" onClick={onClose} className="cancel-button">Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const MataPelajaranManagement = () => {
  const [mataPelajaran, setMataPelajaran] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMapelName, setNewMapelName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState(null);

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

  const handleEditClick = (mapel) => {
    setSelectedMapel(mapel);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_mapel, nama_mapel) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus mata pelajaran ${nama_mapel} (ID: ${id_mapel})? Tindakan ini tidak dapat dibatalkan.`)) {
      setMessage('');
      setMessageType('');
      try {
        const response = await adminApi.deleteMataPelajaran(id_mapel);
        setMessage(response.message);
        setMessageType('success');
        fetchMataPelajaran(); // Refresh daftar
      } catch (err) {
        setMessage(err.message);
        setMessageType('error');
      }
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
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {mataPelajaran.map((mapel) => (
              <tr key={mapel.id_mapel}>
                <td>{mapel.id_mapel}</td>
                <td>{mapel.nama_mapel}</td>
                <td>
                  <button onClick={() => handleEditClick(mapel)} className="action-button edit-button">Edit</button>
                  <button onClick={() => handleDeleteClick(mapel.id_mapel, mapel.nama_mapel)} className="action-button delete-button">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada mata pelajaran yang terdaftar.</p>
      )}

      {showEditModal && selectedMapel && (
        <EditMataPelajaranModal
          mapel={selectedMapel}
          onClose={() => setShowEditModal(false)}
          onSave={fetchMataPelajaran}
        />
      )}
    </div>
  );
};

export default MataPelajaranManagement;
