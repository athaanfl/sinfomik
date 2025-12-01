// frontend/src/features/admin/TASemester.js
import React, { useState, useEffect } from 'react';
import * as adminApi from '../../api/admin';
import Button from '../../components/Button';
import Table from '../../components/Table';
import ModuleContainer from '../../components/ModuleContainer';
import PageHeader from '../../components/PageHeader';
import FormSection from '../../components/FormSection';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusMessage from '../../components/StatusMessage';
import EmptyState from '../../components/EmptyState';

const TASemesterManagement = ({ activeTASemester, setActiveTASemester }) => {
  const [taSemesters, setTASemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTahunAjaran, setNewTahunAjaran] = useState('');
  const [newSemester, setNewSemester] = useState('Ganjil');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const fetchTASemesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getTASemester();
      setTASemesters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTASemesters();
  }, []);

  const handleAddTASemester = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    
    if (!newTahunAjaran.trim()) {
      setMessage('Tahun Ajaran harus diisi');
      setMessageType('error');
      return;
    }
    
    try {
      const response = await adminApi.addTASemester(newTahunAjaran, newSemester);
      setMessage(response.message);
      setMessageType('success');
      setNewTahunAjaran('');
      setNewSemester('Ganjil');
      fetchTASemesters(); // Refresh daftar
      
      // Hide message after 5 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  const handleSetActive = async (id) => {
    const selectedTA = taSemesters.find(ta => ta.id_ta_semester === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Aktivasi',
      message: `Apakah Anda yakin ingin mengaktifkan "${selectedTA.tahun_ajaran} - ${selectedTA.semester}"? Tahun ajaran yang aktif saat ini akan dinonaktifkan.`,
      onConfirm: async () => {
        setMessage('');
        setMessageType('');
        try {
          const response = await adminApi.setActiveTASemester(id);
          setMessage(response.message);
          setMessageType('success');
          // Update activeTASemester state in parent (AdminDashboardContent)
          const updatedActive = taSemesters.find(ta => ta.id_ta_semester === id);
          setActiveTASemester(updatedActive || null);
          fetchTASemesters(); // Refresh daftar untuk update status aktif
          
          // Hide message after 5 seconds
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 5000);
        } catch (err) {
          setMessage(err.message);
          setMessageType('error');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id_ta_semester',
      className: 'text-gray-500'
    },
    {
      header: 'Tahun Ajaran',
      accessor: 'tahun_ajaran',
      className: 'font-medium text-gray-900'
    },
    {
      header: 'Semester',
      accessor: 'semester',
      className: 'text-gray-500'
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          row.is_aktif 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.is_aktif ? 'Aktif' : 'Tidak Aktif'}
        </span>
      )
    },
    {
      header: 'Aksi',
      accessor: (row) => (
        !row.is_aktif && (
          <Button
            variant="text"
            icon="check-circle"
            onClick={() => handleSetActive(row.id_ta_semester)}
          >
            Set Aktif
          </Button>
        )
      )
    }
  ];

  return (
    <ModuleContainer>
      <PageHeader
        icon="calendar-alt"
        title="Manajemen Tahun Ajaran & Semester"
        badge={activeTASemester ? `Aktif: ${activeTASemester.tahun_ajaran} - ${activeTASemester.semester}` : 'Tidak ada yang aktif'}
        badgeColor="blue"
      />

      <StatusMessage message={message} type={messageType} />

      <FormSection title="Tambah Tahun Ajaran & Semester Baru" icon="plus-circle">
        <form onSubmit={handleAddTASemester} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-calendar text-gray-400"></i>
                </div>
                <input 
                  type="text" 
                  value={newTahunAjaran}
                  onChange={(e) => setNewTahunAjaran(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border transition-colors duration-200" 
                  placeholder="Contoh: 2024/2025" 
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-book text-gray-400"></i>
                </div>
                <select 
                  value={newSemester} 
                  onChange={(e) => setNewSemester(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border transition-colors duration-200"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" variant="primary" icon="save">
              Tambah
            </Button>
          </div>
        </form>
      </FormSection>

      {loading && <LoadingSpinner text="Memuat data tahun ajaran..." />}

      {error && (
        <StatusMessage 
          message={`Error: ${error}`} 
          type="error" 
        />
      )}

      {!loading && !error && taSemesters.length === 0 && (
        <EmptyState
          icon="calendar-times"
          message="Belum ada Tahun Ajaran & Semester yang terdaftar."
        />
      )}

      {!loading && !error && taSemesters.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 flex items-center">
              <i className="fas fa-list-alt mr-2 text-purple-500"></i>
              Daftar Tahun Ajaran & Semester
            </h4>
          </div>
          <Table
            columns={columns}
            data={taSemesters}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </ModuleContainer>
  );
};

export default TASemesterManagement;