// frontend/src/features/admin/teacherClassEnroll.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';

const GuruMapelKelasAssignment = ({ activeTASemester }) => {
  const [teachers, setTeachers] = useState([]);
  const [mataPelajaran, setMataPelajaran] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedGuruId, setSelectedGuruId] = useState('');
  const [selectedMapelId, setSelectedMapelId] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teachersData, mapelData, kelasData, assignmentsData] = await Promise.all([
        adminApi.getTeachers(),
        adminApi.getMataPelajaran(),
        activeTASemester ? adminApi.getKelas(activeTASemester.id_ta_semester) : Promise.resolve([]),
        activeTASemester ? adminApi.getGuruMapelKelasAssignments(activeTASemester.id_ta_semester) : Promise.resolve([])
      ]);
      setTeachers(teachersData);
      setMataPelajaran(mapelData);
      setKelas(kelasData);
      setAssignments(assignmentsData);

      // Set default selected values if available
      if (teachersData.length > 0 && !selectedGuruId) setSelectedGuruId(teachersData[0].id_guru);
      if (mapelData.length > 0 && !selectedMapelId) setSelectedMapelId(mapelData[0].id_mapel);
      if (kelasData.length > 0 && !selectedKelasId) setSelectedKelasId(kelasData[0].id_kelas);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTASemester]);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 6000);
  };

  const handleAssignGuru = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setIsAssigning(true);
    
    if (!activeTASemester || !selectedGuruId || !selectedMapelId || !selectedKelasId) {
      showMessage('Please complete all selections.', 'error');
      setIsAssigning(false);
      return;
    }

    try {
      const response = await adminApi.assignGuruToMapelKelas({
        id_guru: selectedGuruId,
        id_mapel: selectedMapelId,
        id_kelas: selectedKelasId,
        id_ta_semester: activeTASemester.id_ta_semester
      });
      showMessage(response.message, 'success');
      fetchData();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Helper functions for icons and colors
  const getSubjectIcon = (namaMapel) => {
    const subject = namaMapel.toLowerCase();
    if (subject.includes('math') || subject.includes('matematika')) return 'fa-calculator';
    if (subject.includes('science') || subject.includes('ipa') || subject.includes('fisika') || subject.includes('kimia') || subject.includes('biologi')) return 'fa-flask';
    if (subject.includes('english') || subject.includes('bahasa')) return 'fa-language';
    if (subject.includes('history') || subject.includes('sejarah')) return 'fa-landmark';
    if (subject.includes('geography') || subject.includes('geografi')) return 'fa-globe';
    if (subject.includes('art') || subject.includes('seni')) return 'fa-palette';
    if (subject.includes('sport') || subject.includes('olahraga') || subject.includes('penjaskes')) return 'fa-running';
    if (subject.includes('computer') || subject.includes('tik') || subject.includes('komputer')) return 'fa-laptop';
    if (subject.includes('religion') || subject.includes('agama')) return 'fa-pray';
    return 'fa-book';
  };

  const getRandomColor = (index) => {
    const colors = [
      'from-rose-400 to-pink-500',
      'from-orange-400 to-amber-500', 
      'from-emerald-400 to-cyan-500',
      'from-blue-400 to-indigo-500',
      'from-purple-400 to-violet-500',
      'from-pink-400 to-rose-500',
      'from-teal-400 to-green-500',
      'from-indigo-400 to-blue-500'
    ];
    return colors[index % colors.length];
  };

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment =>
    assignment.nama_guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTeacher = teachers.find(t => t.id_guru === selectedGuruId);
  const selectedSubject = mataPelajaran.find(mp => mp.id_mapel === selectedMapelId);
  const selectedClass = kelas.find(k => k.id_kelas === selectedKelasId);

  const renderAssignmentsTable = () => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-rose-50 to-pink-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-rose-600 uppercase tracking-wider">Teacher</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-rose-600 uppercase tracking-wider">Subject</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-rose-600 uppercase tracking-wider">Class</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-rose-600 uppercase tracking-wider">Academic Year</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-rose-600 uppercase tracking-wider">Semester</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredAssignments.map((assign, index) => (
            <tr key={index} className={`hover:bg-gray-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-2 rounded-full mr-3">
                    <i className="fas fa-chalkboard-teacher text-white text-sm"></i>
                  </div>
                  <span className="font-medium">{assign.nama_guru}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center">
                  <div className={`bg-gradient-to-br ${getRandomColor(index)} p-2 rounded-lg mr-3`}>
                    <i className={`fas ${getSubjectIcon(assign.nama_mapel)} text-white text-sm`}></i>
                  </div>
                  <span className="font-medium">{assign.nama_mapel}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  <i className="fas fa-door-open mr-1"></i>
                  {assign.nama_kelas}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{assign.tahun_ajaran}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {assign.semester}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAssignmentsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAssignments.map((assign, index) => (
        <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
          <div className={`bg-gradient-to-r ${getRandomColor(index)} p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-3 rounded-full mr-3">
                  <i className="fas fa-chalkboard-teacher text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg truncate">{assign.nama_guru}</h3>
                  <p className="text-white/80 text-sm">Teacher</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <div className={`bg-gradient-to-br ${getRandomColor(index + 1)} p-2 rounded-lg mr-3`}>
                  <i className={`fas ${getSubjectIcon(assign.nama_mapel)} text-white text-sm`}></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium text-gray-900">{assign.nama_mapel}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-indigo-400 to-blue-500 p-2 rounded-lg mr-3">
                  <i className="fas fa-door-open text-white text-sm"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium text-gray-900">{assign.nama_kelas}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">{assign.tahun_ajaran}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {assign.semester}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-100 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-gray-700">Loading teacher assignment data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-100 min-h-screen p-8">
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
    <div className="bg-gradient-to-br from-rose-50 to-pink-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 -m-6 mb-6 p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <i className="fas fa-user-tie mr-3 text-4xl"></i>
                  Teacher Assignment System
                </h1>
                <p className="text-rose-100 mt-2">Assign teachers to subjects and classes</p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-white text-sm">Total Assignments</p>
                  <p className="text-2xl font-bold text-white">{assignments.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-rose-400 to-pink-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm">Teachers</p>
                  <p className="text-2xl font-bold">{teachers.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <i className="fas fa-chalkboard-teacher text-2xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Subjects</p>
                  <p className="text-2xl font-bold">{mataPelajaran.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <i className="fas fa-book text-2xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Classes</p>
                  <p className="text-2xl font-bold">{kelas.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <i className="fas fa-door-open text-2xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Assignments</p>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <i className="fas fa-tasks text-2xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 mb-6 rounded-lg transition-all duration-300 ease-in-out border-l-4 ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-500 text-green-700' 
                : 'bg-red-50 border-red-500 text-red-700'
            }`}>
              <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
              {message}
            </div>
          )}

          {/* Active Semester Info */}
          {activeTASemester ? (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200 mb-6">
              <div className="flex items-center">
                <div className="bg-indigo-500 p-3 rounded-full mr-4">
                  <i className="fas fa-calendar-alt text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Active Academic Term</h3>
                  <p className="text-indigo-600 font-medium">{activeTASemester.tahun_ajaran} - {activeTASemester.semester}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle mr-2 text-xl"></i>
                <span className="font-medium">Please set an active Academic Year & Semester first.</span>
              </div>
            </div>
          )}

          {teachers.length > 0 && mataPelajaran.length > 0 && kelas.length > 0 ? (
            <div className="space-y-8">
              {/* Assignment Form */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <i className="fas fa-user-plus mr-3 text-rose-500 text-3xl"></i>
                  <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                    Assign Teacher
                  </span>
                </h3>

                <form onSubmit={handleAssignGuru} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Teacher Selection */}
                    <div className="relative">
                      <select 
                        value={selectedGuruId} 
                        onChange={(e) => setSelectedGuruId(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 appearance-none"
                      >
                        {teachers.map(t => (
                          <option key={t.id_guru} value={t.id_guru}>{t.nama_guru}</option>
                        ))}
                      </select>
                      <label className="absolute -top-2 left-3 bg-white px-1 text-sm text-gray-600 font-medium">
                        Select Teacher
                      </label>
                      <i className="fas fa-chalkboard-teacher absolute right-3 top-4 text-gray-400"></i>
                    </div>

                    {/* Subject Selection */}
                    <div className="relative">
                      <select 
                        value={selectedMapelId} 
                        onChange={(e) => setSelectedMapelId(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 appearance-none"
                      >
                        {mataPelajaran.map(mp => (
                          <option key={mp.id_mapel} value={mp.id_mapel}>{mp.nama_mapel}</option>
                        ))}
                      </select>
                      <label className="absolute -top-2 left-3 bg-white px-1 text-sm text-gray-600 font-medium">
                        Select Subject
                      </label>
                      <i className="fas fa-book absolute right-3 top-4 text-gray-400"></i>
                    </div>

                    {/* Class Selection */}
                    <div className="relative">
                      <select 
                        value={selectedKelasId} 
                        onChange={(e) => setSelectedKelasId(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 appearance-none"
                      >
                        {kelas.map(k => (
                          <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
                        ))}
                      </select>
                      <label className="absolute -top-2 left-3 bg-white px-1 text-sm text-gray-600 font-medium">
                        Select Class
                      </label>
                      <i className="fas fa-door-open absolute right-3 top-4 text-gray-400"></i>
                    </div>
                  </div>

                  {/* Assignment Preview */}
                  {selectedTeacher && selectedSubject && selectedClass && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Assignment Preview:</h4>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-2 rounded-full mr-2">
                            <i className="fas fa-chalkboard-teacher text-white text-sm"></i>
                          </div>
                          <span className="text-sm font-medium">{selectedTeacher.nama_guru}</span>
                        </div>
                        <i className="fas fa-arrow-right text-gray-400"></i>
                        <div className="flex items-center">
                          <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-2 rounded-lg mr-2">
                            <i className={`fas ${getSubjectIcon(selectedSubject.nama_mapel)} text-white text-sm`}></i>
                          </div>
                          <span className="text-sm font-medium">{selectedSubject.nama_mapel}</span>
                        </div>
                        <i className="fas fa-arrow-right text-gray-400"></i>
                        <div className="flex items-center">
                          <div className="bg-gradient-to-br from-indigo-400 to-blue-500 p-2 rounded-lg mr-2">
                            <i className="fas fa-door-open text-white text-sm"></i>
                          </div>
                          <span className="text-sm font-medium">{selectedClass.nama_kelas}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!activeTASemester || isAssigning}
                    className="w-full md:w-auto flex items-center justify-center px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 font-semibold shadow-lg"
                  >
                    {isAssigning ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        Assigning Teacher...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus mr-3 text-lg"></i>
                        Assign Teacher
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Assignments List */}
              <div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    <i className="fas fa-list-check mr-3 text-pink-500 text-3xl"></i>
                    <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      Teacher Assignments
                    </span>
                  </h3>
                  
                  <div className="flex space-x-3 mt-3 md:mt-0">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search assignments..." 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      />
                      <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                    
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1 rounded-md transition-all duration-200 ${viewMode === 'table' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-600'}`}
                      >
                        <i className="fas fa-table"></i>
                      </button>
                      <button 
                        onClick={() => setViewMode('card')}
                        className={`px-3 py-1 rounded-md transition-all duration-200 ${viewMode === 'card' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-600'}`}
                      >
                        <i className="fas fa-th-large"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {filteredAssignments.length > 0 ? (
                  viewMode === 'table' ? renderAssignmentsTable() : renderAssignmentsCards()
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                      <i className="fas fa-clipboard-list text-4xl text-gray-400"></i>
                    </div>
                    <h5 className="text-lg font-medium text-gray-700 mb-2">
                      {searchTerm ? 'No Assignments Match Search' : 'No Teacher Assignments'}
                    </h5>
                    <p className="text-gray-500">
                      {searchTerm 
                        ? `No assignments match your search for "${searchTerm}".`
                        : 'No teacher assignments are registered for the active semester.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-block p-6 bg-yellow-50 rounded-full mb-4">
                <i className="fas fa-exclamation-triangle text-4xl text-yellow-400"></i>
              </div>
              <h5 className="text-lg font-medium text-gray-700 mb-2">Missing Required Data</h5>
              <p className="text-gray-500">Make sure Teachers, Subjects, and Classes are registered and an Active Academic Year/Semester is set.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuruMapelKelasAssignment;
