// frontend/src/features/admin/teacher.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

// Komponen Modal Edit Guru
const EditTeacherModal = ({ teacher, onClose, onSave }) => {
  const [editedTeacher, setEditedTeacher] = useState({ ...teacher });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTeacher(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const dataToUpdate = {
        username: editedTeacher.username,
        nama_guru: editedTeacher.nama_guru,
        email: editedTeacher.email,
        ...(editedTeacher.password && { password: editedTeacher.password }) // Hanya kirim password jika diisi
      };
      
      const response = await adminApi.updateTeacher(editedTeacher.id_guru, dataToUpdate);
      setMessage(response.message);
      setMessageType('success');
      onSave(); // Panggil fungsi onSave untuk refresh data di parent
      onClose(); // Tutup modal
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Guru: {teacher.nama_guru}</h3>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="form-container-small">
          <div className="form-group">
            <label>ID Guru (Tidak bisa diubah):</label>
            <input type="text" value={editedTeacher.id_guru} disabled />
          </div>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={editedTeacher.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Nama Lengkap Guru:</label>
            <input
              type="text"
              name="nama_guru"
              value={editedTeacher.nama_guru}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={editedTeacher.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Password Baru (kosongkan jika tidak ingin diubah):</label>
            <input
              type="password"
              name="password"
              value={editedTeacher.password || ''}
              onChange={handleChange}
              placeholder="Isi untuk mengubah password"
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


const GuruManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTeacher, setNewTeacher] = useState({
    username: '',
    password: '',
    nama_guru: '',
    email: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getTeachers();
      setTeachers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.addTeacher(newTeacher);
      setMessage(response.message);
      setMessageType('success');
      setNewTeacher({
        username: '',
        password: '',
        nama_guru: '',
        email: ''
      });
      fetchTeachers(); // Refresh daftar
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  const handleEditClick = (teacher) => {
    setSelectedTeacher(teacher);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_guru, nama_guru) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus guru ${nama_guru} (ID: ${id_guru})? Tindakan ini tidak dapat dibatalkan.`)) {
      setMessage('');
      setMessageType('');
      try {
        const response = await adminApi.deleteTeacher(id_guru);
        setMessage(response.message);
        setMessageType('success');
        fetchTeachers(); // Refresh daftar
      } catch (err) {
        setMessage(err.message);
        setMessageType('error');
      }
    }
  };

  if (loading) return <p>Memuat Guru...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Manajemen Guru</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <h4>Tambah Guru Baru</h4>
      <form onSubmit={handleAddTeacher} className="form-container-small">
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={newTeacher.username}
            onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={newTeacher.password}
            onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Nama Lengkap Guru:</label>
          <input
            type="text"
            value={newTeacher.nama_guru}
            onChange={(e) => setNewTeacher({ ...newTeacher, nama_guru: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={newTeacher.email}
            onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
          />
        </div>
        <button type="submit" className="submit-button">Tambah Guru</button>
      </form>

      <h4>Daftar Guru</h4>
      {teachers.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Nama Guru</th>
              <th>Email</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id_guru}>
                <td>{teacher.id_guru}</td>
                <td>{teacher.username}</td>
                <td>{teacher.nama_guru}</td>
                <td>{teacher.email}</td>
                <td>
                  <button onClick={() => handleEditClick(teacher)} className="action-button edit-button">Edit</button>
                  <button onClick={() => handleDeleteClick(teacher.id_guru, teacher.nama_guru)} className="action-button delete-button">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada guru yang terdaftar.</p>
      )}

      {showEditModal && selectedTeacher && (
        <EditTeacherModal
          teacher={selectedTeacher}
          onClose={() => setShowEditModal(false)}
          onSave={fetchTeachers} // Panggil fetchTeachers setelah simpan
        />
      )}
    </div>
  );
};

export default GuruManagement;
