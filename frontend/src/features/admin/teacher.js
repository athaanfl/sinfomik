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
      
      // Show success message then close modal after delay
      setTimeout(() => {
        onSave(); // Refresh data di parent
        onClose(); // Tutup modal
      }, 1500);
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Edit Teacher: {teacher.nama_guru}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {message && (
          <div className={`p-4 mb-4 rounded ${
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
            <label className="block text-sm font-medium text-gray-700">Teacher ID (cannot be changed):</label>
            <input 
              type="text" 
              value={editedTeacher.id_guru} 
              disabled 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username:</label>
            <input
              type="text"
              name="username"
              value={editedTeacher.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Full Name:</label>
            <input
              type="text"
              name="nama_guru"
              value={editedTeacher.nama_guru}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email"
              name="email"
              value={editedTeacher.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current):</label>
            <input
              type="password"
              name="password"
              value={editedTeacher.password || ''}
              onChange={handleChange}
              placeholder="Fill to change password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button 
              type="submit" 
              className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TeacherManagement = () => {
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

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    
    if (!newTeacher.username.trim()) {
      showMessage('Username must be filled', 'error');
      return;
    }
    
    try {
      const response = await adminApi.addTeacher(newTeacher);
      showMessage(response.message);
      setNewTeacher({
        username: '',
        password: '',
        nama_guru: '',
        email: ''
      });
      fetchTeachers(); // Refresh daftar
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleEditClick = (teacher) => {
    setSelectedTeacher(teacher);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_guru, nama_guru) => {
    if (window.confirm(`Are you sure you want to delete teacher ${nama_guru} (ID: ${id_guru})? This action cannot be undone.`)) {
      setMessage('');
      setMessageType('');
      try {
        const response = await adminApi.deleteTeacher(id_guru);
        showMessage(response.message);
        fetchTeachers(); // Refresh daftar
      } catch (err) {
        showMessage(err.message, 'error');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <i className="fas fa-chalkboard-teacher mr-2 text-indigo-600"></i>
          Teacher Management
        </h2>
        
        {/* Message Display */}
        {message && (
          <div className={`p-4 mb-6 rounded transition-all duration-300 ease-in-out ${
            messageType === 'success' 
              ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
              : 'bg-red-100 border-l-4 border-red-500 text-red-700'
          }`}>
            <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
            {message}
          </div>
        )}
        
        {/* Add Teacher Form */}
        <div className="mb-10">
          <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <i className="fas fa-user-plus mr-2 text-green-600"></i>
            Add New Teacher
          </h4>
          <form onSubmit={handleAddTeacher} className="max-w-md space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Username:</label>
              <input 
                type="text" 
                value={newTeacher.username}
                onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password:</label>
              <input 
                type="password" 
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Full Name:</label>
              <input 
                type="text" 
                value={newTeacher.nama_guru}
                onChange={(e) => setNewTeacher({ ...newTeacher, nama_guru: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email:</label>
              <input 
                type="email" 
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Teacher
            </button>
          </form>
        </div>
        
        {/* Teachers List */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <i className="fas fa-list mr-2 text-purple-600"></i>
            Teachers List
          </h4>
          
          {loading && (
            <div className="text-center py-4">
              <i className="fas fa-spinner animate-spin text-indigo-600 mr-2"></i>
              Loading teachers...
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              <i className="fas fa-exclamation-circle mr-2"></i>
              Error: {error}
            </div>
          )}
          
          {!loading && !error && teachers.length === 0 && (
            <div className="text-center py-8">
              <i className="fas fa-user-times text-4xl text-gray-400 mb-3"></i>
              <p className="text-gray-500">No teachers registered yet.</p>
            </div>
          )}
          
          {!loading && !error && teachers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id_guru} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.id_guru}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.nama_guru}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEditClick(teacher)} 
                          className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors duration-200"
                        >
                          <i className="fas fa-edit mr-1"></i> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(teacher.id_guru, teacher.nama_guru)} 
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <i className="fas fa-trash-alt mr-1"></i> Delete
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

      {showEditModal && selectedTeacher && (
        <EditTeacherModal
          teacher={selectedTeacher}
          onClose={() => setShowEditModal(false)}
          onSave={fetchTeachers}
        />
      )}
    </div>
  );
};

export default TeacherManagement;
