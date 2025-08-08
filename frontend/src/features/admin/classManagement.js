// frontend/src/features/admin/classManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';
import { colorScheme, getStatusClasses, getButtonClasses, getCardClasses, getHeaderClasses } from '../../styles/colorScheme';

// Komponen Modal Edit Kelas
const EditKelasModal = ({ kelas, onClose, onSave, teachers }) => {
  const [editedKelas, setEditedKelas] = useState({ ...kelas });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedKelas(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const dataToUpdate = {
        nama_kelas: editedKelas.nama_kelas,
        id_wali_kelas: editedKelas.id_wali_kelas || null, // Pastikan NULL jika tidak ada wali kelas
      };
      
      const response = await adminApi.updateKelas(editedKelas.id_kelas, dataToUpdate);
      setMessage(response.message);
      setMessageType('success');
      onSave(); // Panggil fungsi onSave untuk refresh data di parent
      // onClose(); // Tutup modal setelah simpan
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Kelas: {kelas.nama_kelas}</h3>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="form-container-small">
          <div className="form-group">
            <label>ID Kelas (Tidak bisa diubah):</label>
            <input type="text" value={editedKelas.id_kelas} disabled />
          </div>
          <div className="form-group">
            <label>Nama Kelas:</label>
            <input
              type="text"
              name="nama_kelas"
              value={editedKelas.nama_kelas}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Wali Kelas:</label>
            <select
              name="id_wali_kelas"
              value={editedKelas.id_wali_kelas || ''}
              onChange={handleChange}
            >
              <option value="">Pilih Wali Kelas</option>
              {teachers.map(teacher => (
                <option key={teacher.id_guru} value={teacher.id_guru}>{teacher.nama_guru}</option>
              ))}
            </select>
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


const KelasManagement = ({ activeTASemester }) => {
  const [kelas, setKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newKelasName, setNewKelasName] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [selectedWaliKelas, setSelectedWaliKelas] = useState(''); // Nama guru untuk input baru
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);

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

  const handleEditClick = (kelas) => {
    setSelectedKelas(kelas);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_kelas, nama_kelas) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kelas ${nama_kelas} (ID: ${id_kelas})? Tindakan ini tidak dapat dibatalkan.`)) {
      setMessage('');
      setMessageType('');
      try {
        const response = await adminApi.deleteKelas(id_kelas);
        setMessage(response.message);
        setMessageType('success');
        fetchKelasAndTeachers(); // Refresh daftar
      } catch (err) {
        setMessage(err.message);
        setMessageType('error');
      }
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
              <th>Aksi</th>
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
                <td>
                  <button onClick={() => handleEditClick(k)} className="action-button edit-button">Edit</button>
                  <button onClick={() => handleDeleteClick(k.id_kelas, k.nama_kelas)} className="action-button delete-button">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada kelas yang terdaftar untuk Tahun Ajaran & Semester aktif ini.</p>
      )}

      {showEditModal && selectedKelas && (
        <EditKelasModal
          kelas={selectedKelas}
          onClose={() => setShowEditModal(false)}
          onSave={fetchKelasAndTeachers}
          teachers={teachers}
        />
      )}
    </div>
  );
};

export default KelasManagement;
