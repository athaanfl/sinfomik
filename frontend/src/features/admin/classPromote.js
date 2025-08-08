// frontend/src/features/admin/KenaikanKelas.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';
import { colorScheme, getStatusClasses, getButtonClasses, getCardClasses, getHeaderClasses } from '../../styles/colorScheme';

const KenaikanKelas = () => {
  const [taSemesters, setTASemesters] = useState([]);
  const [fromTASemesterId, setFromTASemesterId] = useState('');
  const [toTASemesterId, setToTASemesterId] = useState('');
  const [fromKelasId, setFromKelasId] = useState('');
  const [toKelasId, setToKelasId] = useState('');
  const [kelasFrom, setKelasFrom] = useState([]);
  const [kelasTo, setKelasTo] = useState([]);
  const [studentsInFromKelas, setStudentsInFromKelas] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]); // Track selected students
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const taData = await adminApi.getTASemester();
      setTASemesters(taData);
      if (taData.length > 0) {
        // Set default to the current active semester if available, otherwise first one
        const currentActive = taData.find(ta => ta.is_aktif);
        setFromTASemesterId(currentActive ? currentActive.id_ta_semester : taData[0].id_ta_semester);
        setToTASemesterId(currentActive ? currentActive.id_ta_semester : taData[0].id_ta_semester);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchKelasForSemester = async (semesterId, setKelasState) => {
    if (!semesterId) {
      setKelasState([]);
      return;
    }
    try {
      const data = await adminApi.getKelas(semesterId);
      setKelasState(data);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setKelasState([]);
    }
  };

  const fetchStudentsForPromotion = async () => {
    if (fromKelasId && fromTASemesterId) {
      try {
        const data = await adminApi.getSiswaInKelas(fromKelasId, fromTASemesterId);
        setStudentsInFromKelas(data);
        setSelectedStudents([]); // Reset selection when changing class
      } catch (err) {
        console.error("Error fetching students for promotion:", err);
        setStudentsInFromKelas([]);
        setSelectedStudents([]);
      }
    } else {
      setStudentsInFromKelas([]);
      setSelectedStudents([]);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchKelasForSemester(fromTASemesterId, setKelasFrom);
  }, [fromTASemesterId]);

  useEffect(() => {
    // Set default fromKelasId when kelasFrom is loaded
    if (kelasFrom.length > 0 && !fromKelasId) {
        setFromKelasId(kelasFrom[0].id_kelas);
    } else if (kelasFrom.length === 0) {
        setFromKelasId(''); // Clear if no classes
    }
  }, [kelasFrom, fromKelasId]); // Add fromKelasId to dependency array

  useEffect(() => {
    fetchKelasForSemester(toTASemesterId, setKelasTo);
  }, [toTASemesterId]);

  useEffect(() => {
    // Set default toKelasId when kelasTo is loaded
    if (kelasTo.length > 0 && !toKelasId) {
        setToKelasId(kelasTo[0].id_kelas);
    } else if (kelasTo.length === 0) {
        setToKelasId(''); // Clear if no classes
    }
  }, [kelasTo, toKelasId]); // Add toKelasId to dependency array


  useEffect(() => {
    fetchStudentsForPromotion();
  }, [fromKelasId, fromTASemesterId]);

  const handlePromoteStudents = async () => {
    setMessage('');
    setMessageType('');
    setIsPromoting(true);
    
    if (!fromKelasId || !toKelasId || !fromTASemesterId || !toTASemesterId || selectedStudents.length === 0) {
      setMessage('Harap lengkapi semua pilihan dan pilih siswa yang akan dipromosikan.');
      setMessageType('error');
      setIsPromoting(false);
      return;
    }
    if (fromKelasId === toKelasId && fromTASemesterId === toTASemesterId) {
      setMessage('Kelas asal dan tujuan tidak boleh sama untuk kenaikan kelas di semester yang sama.');
      setMessageType('error');
      setIsPromoting(false);
      return;
    }

    try {
      const response = await adminApi.promoteStudents(selectedStudents, toKelasId, toTASemesterId);
      setMessage(response.message);
      setMessageType('success');
      fetchStudentsForPromotion(); // Refresh daftar siswa di kelas asal
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleStudentSelection = (studentId, isSelected) => {
    if (isSelected) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id_siswa));
    }
  };

  // Filter students based on search term
  const filteredStudents = studentsInFromKelas.filter(student => 
    student.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id_siswa.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-blue-50 text-blue-600">
            <i className="fas fa-spinner animate-spin mr-3 text-xl"></i>
            <span className="font-medium">Loading class promotion data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle mr-2 text-xl"></i>
              <span className="font-medium">Error: {error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Professional Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center mb-2">
                  <i className="fas fa-graduation-cap text-3xl text-white mr-4"></i>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                      Class Promotion Management
                    </h1>
                    <p className="text-blue-100 mt-1">Promote students to next academic level</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={fetchInitialData}
                  className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors duration-200 flex items-center space-x-2"
                >
                  <i className="fas fa-sync-alt"></i>
                  <span className="hidden md:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Professional Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold mt-1">{studentsInFromKelas.length}</p>
                  <p className="text-blue-200 text-xs mt-2">Available for promotion</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <i className="fas fa-users text-2xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Selected</p>
                  <p className="text-3xl font-bold mt-1">{selectedStudents.length}</p>
                  <p className="text-indigo-200 text-xs mt-2">Ready to promote</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <i className="fas fa-check-circle text-2xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">From Class</p>
                  <p className="text-lg font-semibold mt-1 truncate">{kelasFrom.find(k => k.id_kelas === fromKelasId)?.nama_kelas || 'Select class'}</p>
                  <p className="text-blue-200 text-xs mt-2">Source</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <i className="fas fa-school text-2xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">To Class</p>
                  <p className="text-lg font-semibold mt-1 truncate">{kelasTo.find(k => k.id_kelas === toKelasId)?.nama_kelas || 'Select class'}</p>
                  <p className="text-indigo-200 text-xs mt-2">Destination</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <i className="fas fa-flag-checkered text-2xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Message Display */}
          {message && (
            <div className={`mx-6 mb-6 p-4 rounded-lg border-l-4 ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-500 text-green-700' 
                : 'bg-red-50 border-red-500 text-red-700'
            }`}>
              <div className="flex items-center">
                <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-3 text-lg`}></i>
                <div>
                  <p className="font-medium">{messageType === 'success' ? 'Success' : 'Error'}</p>
                  <p className="text-sm">{message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Professional Configuration Section */}
          <div className="px-6 pb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <i className="fas fa-cog mr-3 text-blue-600"></i>
                Promotion Configuration
              </h2>
              <p className="text-gray-600 text-sm">Configure source and destination for student promotion</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Source Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-700 flex items-center">
                    <i className="fas fa-arrow-up mr-2 text-blue-600"></i>
                    Source
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year & Semester
                    </label>
                    <select 
                      value={fromTASemesterId} 
                      onChange={(e) => setFromTASemesterId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {taSemesters.map(ta => (
                        <option key={ta.id_ta_semester} value={ta.id_ta_semester}>
                          {ta.tahun_ajaran} - {ta.semester}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source Class
                    </label>
                    <select 
                      value={fromKelasId} 
                      onChange={(e) => setFromKelasId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {kelasFrom.map(k => (
                        <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-700 flex items-center">
                    <i className="fas fa-arrow-down mr-2 text-indigo-600"></i>
                    Destination
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year & Semester
                    </label>
                    <select 
                      value={toTASemesterId} 
                      onChange={(e) => setToTASemesterId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {taSemesters.map(ta => (
                        <option key={ta.id_ta_semester} value={ta.id_ta_semester}>
                          {ta.tahun_ajaran} - {ta.semester}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination Class
                    </label>
                    <select 
                      value={toKelasId} 
                      onChange={(e) => setToKelasId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {kelasTo.map(k => (
                        <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Students List */}
          <div className="px-6 pb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <i className="fas fa-list mr-3 text-indigo-600"></i>
                Student Selection
              </h2>
              <p className="text-gray-600 text-sm">Select students to promote to the next academic level</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <i className="fas fa-users text-indigo-600"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Student Database</h3>
                    <p className="text-gray-500 text-sm">
                      {filteredStudents.length} students • {selectedStudents.length} selected
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search students..." 
                      className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                  </div>
                  
                  <button 
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                  >
                    {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {filteredStudents.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="inline-block p-6 bg-gray-50 rounded-lg mb-4">
                    <i className="fas fa-search text-3xl text-gray-400"></i>
                  </div>
                  <h5 className="text-lg font-medium text-gray-700 mb-2">No Students Found</h5>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm ? `No students match your search for "${searchTerm}".` : "No students available in the selected source class."}
                  </p>
                </div>
              )}

              {filteredStudents.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input 
                            type="checkbox"
                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student, index) => (
                        <tr 
                          key={student.id_siswa} 
                          className={`hover:bg-gray-50 transition-colors duration-200 ${
                            selectedStudents.includes(student.id_siswa) ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="checkbox"
                              checked={selectedStudents.includes(student.id_siswa)}
                              onChange={(e) => handleStudentSelection(student.id_siswa, e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              #{student.id_siswa}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                <i className="fas fa-user text-indigo-600 text-sm"></i>
                              </div>
                              <div className="text-sm font-medium text-gray-900">{student.nama_siswa}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              selectedStudents.includes(student.id_siswa) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <i className={`fas ${selectedStudents.includes(student.id_siswa) ? 'fa-check-circle' : 'fa-circle'} mr-1`}></i>
                              {selectedStudents.includes(student.id_siswa) ? 'Selected' : 'Available'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Clean Promotion Button */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-center">
                  <button 
                    onClick={handlePromoteStudents} 
                    disabled={selectedStudents.length === 0 || !toKelasId || isPromoting}
                    className={`flex items-center px-8 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                      selectedStudents.length === 0 || !toKelasId || isPromoting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                    }`}
                  >
                    {isPromoting ? (
                      <>
                        <i className="fas fa-spinner animate-spin mr-3"></i>
                        Promoting {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-graduation-cap mr-3"></i>
                        Promote {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KenaikanKelas;