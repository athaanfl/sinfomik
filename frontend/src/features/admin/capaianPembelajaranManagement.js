// frontend/src/features/admin/CapaianPembelajaranManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

// Komponen Modal Edit Capaian Pembelajaran
const EditCapaianPembelajaranModal = ({ cp, onClose, onSave, mataPelajaranOptions }) => {
  const [editedCp, setEditedCp] = useState({ ...cp });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedCp(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.updateCapaianPembelajaran(editedCp.id_cp, {
        id_mapel: parseInt(editedCp.id_mapel), // Pastikan ini integer
        kode_cp: editedCp.kode_cp,
        deskripsi_cp: editedCp.deskripsi_cp
      });
      setMessage(response.message);
      setMessageType('success');
      onSave(); // Refresh daftar
      // onClose(); // Tutup modal setelah simpan
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Capaian Pembelajaran</h3>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="form-container-small">
          <div className="form-group">
            <label>ID CP (Tidak bisa diubah):</label>
            <input type="text" value={editedCp.id_cp} disabled />
          </div>
          <div className="form-group">
            <label>Mata Pelajaran:</label>
            <select
              name="id_mapel"
              value={editedCp.id_mapel}
              onChange={handleChange}
              required
            >
              <option value="">Pilih Mata Pelajaran</option>
              {mataPelajaranOptions.map(mapel => (
                <option key={mapel.id_mapel} value={mapel.id_mapel}>{mapel.nama_mapel}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Kode CP (Opsional):</label>
            <input
              type="text"
              name="kode_cp"
              value={editedCp.kode_cp || ''}
              onChange={handleChange}
              placeholder="Contoh: MTK-1.1"
            />
          </div>
          <div className="form-group">
            <label>Deskripsi CP:</label>
            <textarea
              name="deskripsi_cp"
              value={editedCp.deskripsi_cp}
              onChange={handleChange}
              required
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


const CapaianPembelajaranManagement = () => {
  const [cps, setCps] = useState([]);
  const [mataPelajaranOptions, setMataPelajaranOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCp, setNewCp] = useState({
    id_mapel: '',
    kode_cp: '',
    deskripsi_cp: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCp, setSelectedCp] = useState(null);

  const fetchCpsAndMapel = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cpsData, mapelData] = await Promise.all([
        adminApi.getCapaianPembelajaran(),
        adminApi.getMataPelajaran()
      ]);
      setCps(cpsData);
      setMataPelajaranOptions(mapelData);
      if (mapelData.length > 0 && !newCp.id_mapel) {
        setNewCp(prev => ({ ...prev, id_mapel: mapelData[0].id_mapel }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCpsAndMapel();
  }, []);

  const handleAddCp = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.addCapaianPembelajaran({
        id_mapel: parseInt(newCp.id_mapel), // Pastikan integer
        kode_cp: newCp.kode_cp,
        deskripsi_cp: newCp.deskripsi_cp
      });
      setMessage(response.message);
      setMessageType('success');
      setNewCp({
        id_mapel: mataPelajaranOptions.length > 0 ? mataPelajaranOptions[0].id_mapel : '',
        kode_cp: '',
        deskripsi_cp: ''
      });
      fetchCpsAndMapel(); // Refresh daftar
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  const handleEditClick = (cp) => {
    setSelectedCp(cp);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_cp, deskripsi_cp) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Capaian Pembelajaran: "${deskripsi_cp}" (ID: ${id_cp})? Tindakan ini tidak dapat dibatalkan.`)) {
      setMessage('');
      setMessageType('');
      try {
        const response = await adminApi.deleteCapaianPembelajaran(id_cp);
        setMessage(response.message);
        setMessageType('success');
        fetchCpsAndMapel(); // Refresh daftar
      } catch (err) {
        setMessage(err.message);
        setMessageType('error');
      }
    }
  };

  if (loading) return <p>Memuat Capaian Pembelajaran...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Manajemen Capaian Pembelajaran</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <h4>Tambah Capaian Pembelajaran Baru</h4>
      <form onSubmit={handleAddCp} className="form-container-small">
        <div className="form-group">
          <label>Mata Pelajaran:</label>
          <select
            name="id_mapel"
            value={newCp.id_mapel}
            onChange={(e) => setNewCp({ ...newCp, id_mapel: e.target.value })}
            required
          >
            <option value="">Pilih Mata Pelajaran</option>
            {mataPelajaranOptions.map(mapel => (
              <option key={mapel.id_mapel} value={mapel.id_mapel}>{mapel.nama_mapel}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Kode CP (Opsional):</label>
          <input
            type="text"
            name="kode_cp"
            value={newCp.kode_cp}
            onChange={(e) => setNewCp({ ...newCp, kode_cp: e.target.value })}
            placeholder="Contoh: MTK-1.1"
          />
        </div>
        <div className="form-group">
          <label>Deskripsi CP:</label>
          <textarea
            name="deskripsi_cp"
            value={newCp.deskripsi_cp}
            onChange={(e) => setNewCp({ ...newCp, deskripsi_cp: e.target.value })}
            required
          ></textarea>
        </div>
        <button type="submit" className="submit-button">Tambah Capaian Pembelajaran</button>
      </form>

      <h4>Daftar Capaian Pembelajaran</h4>
      {cps.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mata Pelajaran</th>
              <th>Kode CP</th>
              <th>Deskripsi CP</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {cps.map((cp) => (
              <tr key={cp.id_cp}>
                <td>{cp.id_cp}</td>
                <td>{cp.nama_mapel}</td>
                <td>{cp.kode_cp || '-'}</td>
                <td>{cp.deskripsi_cp}</td>
                <td>
                  <button onClick={() => handleEditClick(cp)} className="action-button edit-button">Edit</button>
                  <button onClick={() => handleDeleteClick(cp.id_cp, cp.deskripsi_cp)} className="action-button delete-button">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada Capaian Pembelajaran yang terdaftar.</p>
      )}

      {showEditModal && selectedCp && (
        <EditCapaianPembelajaranModal
          cp={selectedCp}
          onClose={() => setShowEditModal(false)}
          onSave={fetchCpsAndMapel}
          mataPelajaranOptions={mataPelajaranOptions}
        />
      )}
    </div>
  );
};

export default CapaianPembelajaranManagement;
