// frontend/src/features/admin/StudentManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

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
      
      // Show success message then close modal
      setTimeout(() => {
        onSave(); // Refresh data di parent
        onClose(); // Tutup modal
      }, 1000);
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Student: {student.nama_siswa}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            messageType === 'success' 
              ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
              : 'bg-red-100 border-l-4 border-red-500 text-red-700'
          }`}>
            <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Student ID (Cannot be changed)</label>
            <input 
              type="text" 
              value={editedStudent.id_siswa} 
              disabled 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Student Name</label>
            <input
              type="text"
              name="nama_siswa"
              value={editedStudent.nama_siswa}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
            <input
              type="date"
              name="tanggal_lahir"
              value={editedStudent.tanggal_lahir}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
            <select 
              name="jenis_kelamin" 
              value={editedStudent.jenis_kelamin} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="L">Male</option>
              <option value="P">Female</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
            <input
              type="password"
              name="password"
              value={editedStudent.password || ''}
              onChange={handleChange}
              placeholder="Fill to change password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
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

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    
    if (!newStudent.id_siswa.trim()) {
      showMessage('Student ID must be filled', 'error');
      return;
    }
    
    try {
      const response = await adminApi.addStudent(newStudent);
      showMessage(response.message);
      setNewStudent({
        id_siswa: '',
        nama_siswa: '',
        tanggal_lahir: '',
        jenis_kelamin: 'L',
        password: ''
      });
      fetchStudents(); // Refresh daftar
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_siswa, nama_siswa) => {
    if (window.confirm(`Are you sure you want to delete student ${nama_siswa} (ID: ${id_siswa})? This action cannot be undone.`)) {
      setMessage('');
      setMessageType('');
      try {
        const response = await adminApi.deleteStudent(id_siswa);
        showMessage(response.message);
        fetchStudents(); // Refresh daftar
      } catch (err) {
        showMessage(err.message, 'error');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <i className="fas fa-user-graduate mr-2 text-blue-600"></i> Manajemen Siswa
        </h1>
        
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded transition-all duration-300 ease-in-out ${
            messageType === 'success' 
              ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
              : 'bg-red-100 border-l-4 border-red-500 text-red-700'
          }`}>
            <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
            {message}
          </div>
        )}
        
        {/* Add Student Form */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <i className="fas fa-user-plus mr-2 text-green-600"></i> Tambah Siswa Baru
          </h2>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">ID Siswa (NISN)</label>
              <input 
                type="number" 
                value={newStudent.id_siswa}
                onChange={(e) => setNewStudent({ ...newStudent, id_siswa: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: 1234567890"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nama Siswa</label>
              <input 
                type="text" 
                value={newStudent.nama_siswa}
                onChange={(e) => setNewStudent({ ...newStudent, nama_siswa: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: Slamet Kopling"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
              <input 
                type="date" 
                value={newStudent.tanggal_lahir}
                onChange={(e) => setNewStudent({ ...newStudent, tanggal_lahir: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
              <select 
                value={newStudent.jenis_kelamin} 
                onChange={(e) => setNewStudent({ ...newStudent, jenis_kelamin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                value={newStudent.password}
                onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i className="fas fa-plus mr-2"></i> Add Student
              </button>
            </div>
          </form>
        </div>
        
        {/* Student List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <i className="fas fa-list mr-2 text-purple-600"></i> Student List
          </h2>
          
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              <i className="fas fa-exclamation-circle mr-2"></i>
              Error: {error}
            </div>
          )}
          
          {!loading && !error && students.length === 0 && (
            <div className="text-center py-8">
              <i className="fas fa-user-times text-4xl text-gray-400 mb-3"></i>
              <p className="text-gray-600">No students registered yet.</p>
            </div>
          )}
          
          {!loading && !error && students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Lahir</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Kelamin</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id_siswa} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.id_siswa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.nama_siswa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.tanggal_lahir || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          student.jenis_kelamin === 'L' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {student.jenis_kelamin === 'L' ? 'Male' : 'Female'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEditClick(student)} 
                          className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors duration-200"
                        >
                          <i className="fas fa-edit mr-1"></i>Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(student.id_siswa, student.nama_siswa)} 
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <i className="fas fa-trash-alt mr-1"></i>Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showEditModal && selectedStudent && (
        <EditStudentModal
          student={selectedStudent}
          onClose={() => setShowEditModal(false)}
          onSave={fetchStudents}
        />
      )}
    </div>
  );
};

export default StudentManagement;