// frontend/src/features/admin/grade.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

// Komponen Modal Edit Tipe Nilai
const EditTipeNilaiModal = ({ tipe, onClose, onSave }) => {
  const [editedTipe, setEditedTipe] = useState({ ...tipe });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTipe(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.updateTipeNilai(editedTipe.id_tipe_nilai, {
        nama_tipe: editedTipe.nama_tipe,
        deskripsi: editedTipe.deskripsi
      });
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
        <h3>Edit Tipe Nilai: {tipe.nama_tipe}</h3>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="form-container-small">
          <div className="form-group">
            <label>ID Tipe Nilai (Tidak bisa diubah):</label>
            <input type="text" value={editedTipe.id_tipe_nilai} disabled />
          </div>
          <div className="form-group">
            <label>Nama Tipe Nilai:</label>
            <input
              type="text"
              name="nama_tipe"
              value={editedTipe.nama_tipe}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Deskripsi (opsional):</label>
            <textarea
              name="deskripsi"
              value={editedTipe.deskripsi || ''}
              onChange={handleChange}
            ></textarea>
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


const TipeNilaiManagement = () => {
  const [tipeNilai, setTipeNilai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTipeName, setNewTipeName] = useState('');
  const [newTipeDescription, setNewTipeDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTipe, setSelectedTipe] = useState(null);

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

  const handleEditClick = (tipe) => {
    setSelectedTipe(tipe);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_tipe_nilai, nama_tipe) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus tipe nilai ${nama_tipe} (ID: ${id_tipe_nilai})? Tindakan ini tidak dapat dibatalkan.`)) {
      setMessage('');
      setMessageType('');
      try {
        const response = await adminApi.deleteTipeNilai(id_tipe_nilai);
        setMessage(response.message);
        setMessageType('success');
        fetchTipeNilai(); // Refresh daftar
      } catch (err) {
        setMessage(err.message);
        setMessageType('error');
      }
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
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tipeNilai.map((tipe) => (
              <tr key={tipe.id_tipe_nilai}>
                <td>{tipe.id_tipe_nilai}</td>
                <td>{tipe.nama_tipe}</td>
                <td>{tipe.deskripsi || '-'}</td>
                <td>
                  <button onClick={() => handleEditClick(tipe)} className="action-button edit-button">Edit</button>
                  <button onClick={() => handleDeleteClick(tipe.id_tipe_nilai, tipe.nama_tipe)} className="action-button delete-button">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada tipe nilai yang terdaftar.</p>
      )}

      {showEditModal && selectedTipe && (
        <EditTipeNilaiModal
          tipe={selectedTipe}
          onClose={() => setShowEditModal(false)}
          onSave={fetchTipeNilai}
        />
      )}
    </div>
  );
};

export default TipeNilaiManagement;
