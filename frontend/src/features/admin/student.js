// frontend/src/features/admin/StudentManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';
import { colorScheme, getStatusClasses, getButtonClasses, getCardClasses, getHeaderClasses } from '../../styles/colorScheme';

// Komponen Modal Edit Siswa
const EditStudentModal = ({ student, onClose, onSave }) => {
  const [editedStudent, setEditedStudent] = useState({ ...student });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      // Hanya kirim data yang bisa diupdate (tanpa id_siswa karena itu ada di URL)
      const dataToUpdate = {
        nama_siswa: editedStudent.nama_siswa,
        tanggal_lahir: editedStudent.tanggal_lahir,
        jenis_kelamin: editedStudent.jenis_kelamin,
        // Password hanya dikirim jika diisi
        ...(editedStudent.password && { password: editedStudent.password })
      };
      
      const response = await adminApi.updateStudent(editedStudent.id_siswa, dataToUpdate);
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
        <h3>Edit Siswa: {student.nama_siswa}</h3>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="form-container-small">
          <div className="form-group">
            <label>ID Siswa (Tidak bisa diubah):</label>
            <input type="text" value={editedStudent.id_siswa} disabled />
          </div>
          <div className="form-group">
            <label>Nama Siswa:</label>
            <input
              type="text"
              name="nama_siswa"
              value={editedStudent.nama_siswa}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Tanggal Lahir:</label>
            <input
              type="date"
              name="tanggal_lahir"
              value={editedStudent.tanggal_lahir}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Jenis Kelamin:</label>
            <select name="jenis_kelamin" value={editedStudent.jenis_kelamin} onChange={handleChange}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div className="form-group">
            <label>Password Baru (kosongkan jika tidak ingin diubah):</label>
            <input
              type="password"
              name="password"
              value={editedStudent.password || ''} // Pastikan tidak undefined
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


const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStudent, setNewStudent] = useState({
    id_siswa: '',
    nama_siswa: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getStudents();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const response = await adminApi.addStudent(newStudent);
      setMessage(response.message);
      setMessageType('success');
      setNewStudent({
        id_siswa: '',
        nama_siswa: '',
        tanggal_lahir: '',
        jenis_kelamin: 'L',
        password: ''
      });
      fetchStudents(); // Refresh daftar
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_siswa, nama_siswa) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus siswa ${nama_siswa} (ID: ${id_siswa})? Tindakan ini tidak dapat dibatalkan.`)) {
      setMessage('');
      setMessageType('');
      try {
        const response = await adminApi.deleteStudent(id_siswa);
        setMessage(response.message);
        setMessageType('success');
        fetchStudents(); // Refresh daftar
      } catch (err) {
        setMessage(err.message);
        setMessageType('error');
      }
    }
  };


  if (loading) return <p>Memuat Siswa...</p>;
  if (error) return <p className="message error">Error: {error}</p>;

  return (
    <div className="feature-content">
      <h2>Manajemen Siswa</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <h4>Tambah Siswa Baru</h4>
      <form onSubmit={handleAddStudent} className="form-container-small">
        <div className="form-group">
          <label>ID Siswa (NISN/ID Unik):</label>
          <input
            type="number"
            value={newStudent.id_siswa}
            onChange={(e) => setNewStudent({ ...newStudent, id_siswa: e.target.value })}
            placeholder="Contoh : 1234567890"
            required
          />
        </div>
        <div className="form-group">
          <label>Nama Siswa:</label>
          <input
            type="text"
            value={newStudent.nama_siswa}
            onChange={(e) => setNewStudent({ ...newStudent, nama_siswa: e.target.value })}
            placeholder="Contoh : Atma Riski"
            required
          />
        </div>
        <div className="form-group">
          <label>Tanggal Lahir:</label>
          <input
            type="date"
            value={newStudent.tanggal_lahir}
            onChange={(e) => setNewStudent({ ...newStudent, tanggal_lahir: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Jenis Kelamin:</label>
          <select value={newStudent.jenis_kelamin} onChange={(e) => setNewStudent({ ...newStudent, jenis_kelamin: e.target.value })}>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div className="form-group">
          <label>Password Siswa:</label>
          <input
            type="password"
            value={newStudent.password}
            onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="submit-button">Tambah Siswa</button>
      </form>

      <h4>Daftar Siswa</h4>
      {students.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Siswa</th>
              <th>Nama</th>
              <th>Tgl Lahir</th>
              <th>JK</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id_siswa}>
                <td>{student.id_siswa}</td>
                <td>{student.nama_siswa}</td>
                <td>{student.tanggal_lahir}</td>
                <td>{student.jenis_kelamin}</td>
                <td>
                  <button onClick={() => handleEditClick(student)} className="action-button edit-button">Edit</button>
                  <button onClick={() => handleDeleteClick(student.id_siswa, student.nama_siswa)} className="action-button delete-button">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada siswa yang terdaftar.</p>
      )}

      {showEditModal && selectedStudent && (
        <EditStudentModal
          student={selectedStudent}
          onClose={() => setShowEditModal(false)}
          onSave={fetchStudents} // Panggil fetchStudents setelah simpan
        />
      )}
    </div>
  );
};

export default StudentManagement;