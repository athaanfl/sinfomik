// frontend/src/features/admin/classManagement.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

// Komponen Modal Edit Kelas dengan Modern Tailwind Design
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
        id_wali_kelas: editedKelas.id_wali_kelas || null,
      };
      
      const response = await adminApi.updateKelas(editedKelas.id_kelas, dataToUpdate);
      setMessage(response.message);
      setMessageType('success');
      
      // Show success message then close modal after delay
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition-colors duration-200 text-lg z-10"
        >
          <i className="fas fa-times"></i>
        </button>
        
        <div className="flex items-center mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
            <i className="fas fa-edit text-indigo-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Edit Kelas: {kelas.nama_kelas}</h3>
        </div>
        
        {message && (
          <div className={`p-4 mb-4 rounded-lg border-l-4 flex items-center transition-all duration-300 relative overflow-hidden ${
            messageType === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500 text-green-700' 
              : 'bg-gradient-to-r from-red-50 to-red-100 border-red-500 text-red-700'
          }`}>
            <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Kelas:</label>
            <input 
              type="text" 
              value={editedKelas.id_kelas} 
              disabled 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas:</label>
            <input
              type="text"
              name="nama_kelas"
              value={editedKelas.nama_kelas}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              placeholder="Contoh: X-A, XI IPA 1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas:</label>
            <select
              name="id_wali_kelas"
              value={editedKelas.id_wali_kelas || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="">Pilih Wali Kelas</option>
              {teachers.map(teacher => (
                <option key={teacher.id_guru} value={teacher.id_guru}>{teacher.nama_guru}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center relative overflow-hidden"
            >
              <i className="fas fa-save mr-2"></i> Simpan
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
            >
              <i className="fas fa-times mr-2"></i> Batal
            </button>
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
  const [selectedWaliKelas, setSelectedWaliKelas] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');

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

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleAddKelas = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    
    if (!activeTASemester) {
      showMessage('Harap atur Tahun Ajaran & Semester aktif terlebih dahulu.', 'error');
      return;
    }

    const waliKelasId = selectedWaliKelas ? teachers.find(t => t.nama_guru === selectedWaliKelas)?.id_guru : null;

    try {
      const response = await adminApi.addKelas({
        nama_kelas: newKelasName,
        id_wali_kelas: waliKelasId,
        id_ta_semester: activeTASemester.id_ta_semester
      });
      showMessage(response.message, 'success');
      setNewKelasName('');
      setSelectedWaliKelas('');
      fetchKelasAndTeachers();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleEditClick = (kelas) => {
    setSelectedKelas(kelas);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id_kelas, nama_kelas) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kelas ${nama_kelas} (ID: ${id_kelas})? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        const response = await adminApi.deleteKelas(id_kelas);
        showMessage(response.message, 'success');
        fetchKelasAndTeachers();
      } catch (err) {
        showMessage(err.message, 'error');
      }
    }
  };

  // Filter and search functionality
  const filteredKelas = kelas.filter(k => {
    const matchesSearch = k.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (k.wali_kelas && k.wali_kelas.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSemester = filterSemester === 'all' || k.semester === filterSemester;
    return matchesSearch && matchesSemester;
  });

  // Calculate stats
  const totalClasses = kelas.length;
  const classesWithTeachers = kelas.filter(k => k.wali_kelas).length;
  const classesWithoutTeachers = totalClasses - classesWithTeachers;

  // Get current time
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 font-medium">Memuat data kelas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg relative overflow-hidden">
            <i className="fas fa-exclamation-circle mr-2"></i>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Sistem Manajemen Kelas</h1>
              <p className="text-blue-100 opacity-90">Kelola data kelas dan wali kelas dengan mudah</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center">
                <i className="fas fa-calendar-alt mr-2 text-blue-100"></i>
                <span className="text-blue-100 font-medium">
                  {activeTASemester ? `${activeTASemester.tahun_ajaran}` : '2023/2024'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center">
                <i className="fas fa-clock mr-2 text-blue-100"></i>
                <span className="text-blue-100 font-medium">{currentTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12 -mt-16">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 relative border border-gray-100 backdrop-filter backdrop-blur-lg">
          {/* Page Title */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                <i className="fas fa-chalkboard-teacher text-indigo-600 text-xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Manajemen Kelas</h2>
                <p className="text-gray-500 text-sm">Kelola semua kelas di sekolah Anda</p>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 mb-6 rounded-lg border-l-4 flex items-center transition-all duration-300 relative overflow-hidden ${
              messageType === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500 text-green-700' 
                : messageType === 'error'
                ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-500 text-red-700'
                : messageType === 'warning'
                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500 text-yellow-700'
                : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500 text-blue-700'
            }`}>
              <i className={`fas ${
                messageType === 'success' ? 'fa-check-circle' : 
                messageType === 'error' ? 'fa-exclamation-circle' :
                messageType === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
              } mr-2`}></i>
              {message}
            </div>
          )}

          {/* Active Semester Info */}
          {activeTASemester ? (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-lg relative overflow-hidden">
              <i className="fas fa-info-circle mr-2"></i>
              Kelas akan ditambahkan untuk Tahun Ajaran & Semester Aktif: <strong>{activeTASemester.tahun_ajaran} {activeTASemester.semester}</strong>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg relative overflow-hidden">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Harap atur Tahun Ajaran & Semester aktif terlebih dahulu.
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Kelas</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalClasses}</h3>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <i className="fas fa-school text-indigo-600 text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Kelas dengan Wali</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{classesWithTeachers}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <i className="fas fa-user-tie text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Kelas Tanpa Wali</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{classesWithoutTeachers}</h3>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <i className="fas fa-exclamation-circle text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Add New Class Form */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                <i className="fas fa-plus-circle mr-2 text-green-600"></i>
                Tambah Kelas Baru
              </h4>
              <button 
                onClick={() => setShowForm(!showForm)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-200"
              >
                <i className={`fas ${showForm ? 'fa-chevron-up' : 'fa-chevron-down'} mr-1`}></i> 
                {showForm ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            
            {showForm && (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <form onSubmit={handleAddKelas} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas:</label>
                      <input
                        type="text"
                        value={newKelasName}
                        onChange={(e) => setNewKelasName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        placeholder="Contoh: X-A, XI IPA 1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas:</label>
                      <select 
                        value={selectedWaliKelas} 
                        onChange={(e) => setSelectedWaliKelas(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none bg-white pr-8"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="">Pilih Wali Kelas</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id_guru} value={teacher.nama_guru}>{teacher.nama_guru}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      type="submit" 
                      disabled={!activeTASemester}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                    >
                      <i className="fas fa-plus-circle mr-2"></i> Tambah Kelas
                    </button>
                    
                    <button 
                      type="reset" 
                      onClick={() => {
                        setNewKelasName('');
                        setSelectedWaliKelas('');
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center"
                    >
                      <i className="fas fa-undo mr-2"></i> Reset
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Class List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                <i className="fas fa-list mr-2 text-purple-600"></i>
                Daftar Kelas
              </h4>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <select 
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-8 appearance-none bg-white"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="all">Semua Semester</option>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                    placeholder="Cari kelas..."
                  />
                  <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                </div>
              </div>
            </div>
            
            {filteredKelas.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider w-16">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Nama Kelas</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Wali Kelas</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Tahun Ajaran</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider w-40">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredKelas.map((k, index) => (
                      <tr key={k.id_kelas} className={`hover:bg-indigo-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{k.id_kelas}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{k.nama_kelas}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {k.wali_kelas ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <i className="fas fa-user-tie mr-1"></i> {k.wali_kelas}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <i className="fas fa-exclamation-circle mr-1"></i> Belum ada wali
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{k.tahun_ajaran}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {k.semester}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditClick(k)} 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
                            >
                              <i className="fas fa-edit mr-1"></i> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(k.id_kelas, k.nama_kelas)} 
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:from-red-600 hover:to-red-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
                            >
                              <i className="fas fa-trash mr-1"></i> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <div className="text-4xl text-gray-300 mb-4">
                  <i className="fas fa-school"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Tidak Ada Kelas</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-6">Belum ada kelas yang terdaftar untuk Tahun Ajaran & Semester aktif ini.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                >
                  <i className="fas fa-plus-circle mr-2"></i> Tambah Kelas Pertama
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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
