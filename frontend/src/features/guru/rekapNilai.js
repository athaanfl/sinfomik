// frontend/src/features/guru/rekapNilai.js
import React, { useState, useEffect } from 'react';
import * as guruApi from '../../api/guru';
import Button from '../../components/Button';
import Table from '../../components/Table';
import ModuleContainer from '../../components/ModuleContainer';
import PageHeader from '../../components/PageHeader';
import FormSection from '../../components/FormSection';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusMessage from '../../components/StatusMessage';
import EmptyState from '../../components/EmptyState';

const RekapNilai = ({ activeTASemester, userId }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [rekapNilai, setRekapNilai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId || !activeTASemester) {
        setError("Informasi guru atau tahun ajaran aktif tidak tersedia.");
        return;
      }
      const assignmentsData = await guruApi.getGuruAssignments(userId, activeTASemester.id_ta_semester);
      setAssignments(assignmentsData);

      if (assignmentsData.length > 0 && !selectedAssignment) {
        setSelectedAssignment(`${assignmentsData[0].id_kelas}-${assignmentsData[0].id_mapel}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRekap = async () => {
    if (selectedAssignment && activeTASemester && userId) {
      const [kelasId, mapelId] = selectedAssignment.split('-').map(Number);
      try {
        const data = await guruApi.getRekapNilai(userId, mapelId, kelasId, activeTASemester.id_ta_semester);
        setRekapNilai(data);
      } catch (err) {
        setError(err.message);
        setRekapNilai([]);
      }
    } else {
      setRekapNilai([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTASemester, userId]);

  useEffect(() => {
    fetchRekap();
  }, [selectedAssignment, activeTASemester, userId]);

  if (loading) return <LoadingSpinner message="Memuat data rekap nilai..." />;
  if (error) return <StatusMessage type="error" message={error} />;

  const currentAssignment = assignments.find(
    assign => `${assign.id_kelas}-${assign.id_mapel}` === selectedAssignment
  );

  // Mengolah data rekap untuk tampilan tabel pivot
  const processedRekap = {};
  const gradeTypes = new Set();
  rekapNilai.forEach(item => {
    if (!processedRekap[item.nama_siswa]) {
      processedRekap[item.nama_siswa] = { id_siswa: item.id_siswa, nama_siswa: item.nama_siswa };
    }
    
    // Create column name based on jenis_nilai and urutan_tp
    let columnName;
    if (item.jenis_nilai === 'TP') {
      columnName = `TP${item.urutan_tp}`;
    } else if (item.jenis_nilai === 'UAS') {
      columnName = 'UAS';
    } else {
      columnName = item.jenis_nilai; // fallback
    }
    
    processedRekap[item.nama_siswa][columnName] = item.nilai;
    gradeTypes.add(columnName);
  });

  const uniqueGradeTypes = Array.from(gradeTypes).sort((a, b) => {
    // Custom sort: TP1, TP2, TP3, ..., UAS
    if (a.startsWith('TP') && b.startsWith('TP')) {
      const numA = parseInt(a.substring(2));
      const numB = parseInt(b.substring(2));
      return numA - numB;
    } else if (a.startsWith('TP') && b === 'UAS') {
      return -1; // TP comes before UAS
    } else if (a === 'UAS' && b.startsWith('TP')) {
      return 1; // UAS comes after TP
    }
    return a.localeCompare(b);
  });
  const rekapTableData = Object.values(processedRekap);

  // Prepare columns for Table component
  const columns = [
    {
      key: 'nama_siswa',
      label: 'Nama Siswa',
      className: 'font-medium text-gray-900',
    },
    ...uniqueGradeTypes.map(tipe => ({
      key: tipe,
      label: tipe,
      className: 'text-center',
      render: (row) => (
        <span className={`inline-flex items-center justify-center w-16 px-2 py-1 rounded ${
          typeof row[tipe] === 'number' 
            ? row[tipe] >= 75 
              ? 'bg-green-100 text-green-800 font-semibold'
              : row[tipe] >= 60
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800 font-semibold'
            : 'text-gray-400'
        }`}>
          {typeof row[tipe] === 'number' ? row[tipe] : '-'}
        </span>
      ),
    })),
    {
      key: 'nilai_akhir',
      label: 'Nilai Akhir',
      className: 'text-center font-semibold',
      render: (row) => {
        // Calculate TP average
        const tpGrades = uniqueGradeTypes
          .filter(tipe => tipe.startsWith('TP'))
          .map(tipe => row[tipe])
          .filter(n => typeof n === 'number');
        const tpAverage = tpGrades.length > 0 ? tpGrades.reduce((sum, n) => sum + n, 0) / tpGrades.length : 0;
        
        // Get UAS value
        const uasValue = row['UAS'];
        
        // Calculate final grade (70% TP + 30% UAS)
        let finalGrade = '-';
        if (tpGrades.length > 0 && typeof uasValue === 'number') {
          finalGrade = (tpAverage * 0.7 + uasValue * 0.3).toFixed(2);
        }
        
        return (
          <span className={`inline-flex items-center justify-center w-20 px-3 py-1 rounded-full font-bold ${
            finalGrade !== '-'
              ? parseFloat(finalGrade) >= 75 
                ? 'bg-green-500 text-white'
                : parseFloat(finalGrade) >= 60
                ? 'bg-yellow-500 text-white'
                : 'bg-red-500 text-white'
              : 'text-gray-400'
          }`}>
            {finalGrade}
          </span>
        );
      },
    },
  ];

  return (
    <ModuleContainer>
      <PageHeader
        icon="clipboard-list"
        title="Rekap Nilai Siswa"
        subtitle={activeTASemester ? `${activeTASemester.tahun_ajaran} - ${activeTASemester.semester}` : 'Belum ada tahun ajaran aktif'}
        badge={currentAssignment ? `${currentAssignment.nama_kelas} - ${currentAssignment.nama_mapel}` : null}
      />

      {message && <StatusMessage type={messageType} message={message} />}

      {!activeTASemester && (
        <StatusMessage
          type="warning"
          message="Tahun Ajaran & Semester aktif belum diatur. Harap hubungi Admin."
        />
      )}

      {assignments.length > 0 ? (
        <>
          <FormSection title="Pilih Kelas dan Mata Pelajaran">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas dan Mata Pelajaran
                </label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  {assignments.map(assign => (
                    <option key={`${assign.id_kelas}-${assign.id_mapel}`} value={`${assign.id_kelas}-${assign.id_mapel}`}>
                      {assign.nama_kelas} - {assign.nama_mapel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FormSection>

          {currentAssignment && (
            <div className="card-body">
              <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  <i className="fas fa-chart-line mr-2"></i>
                  Rekap Nilai {currentAssignment.nama_mapel} di Kelas {currentAssignment.nama_kelas}
                </h3>
                <p className="text-sm text-gray-600">
                  <i className="fas fa-info-circle mr-1"></i>
                  <strong>Keterangan:</strong> Nilai Akhir = 70% rata-rata TP + 30% UAS
                </p>
              </div>

              {rekapTableData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table
                    columns={columns}
                    data={rekapTableData}
                    keyField="id_siswa"
                  />
                </div>
              ) : (
                <EmptyState
                  icon="clipboard-list"
                  title="Belum Ada Nilai"
                  message="Belum ada nilai yang diinput untuk kombinasi kelas dan mata pelajaran ini."
                />
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="chalkboard-teacher"
          title="Belum Ada Penugasan"
          message="Anda belum ditugaskan mengajar mata pelajaran di kelas manapun untuk semester aktif ini. Silakan hubungi Admin."
        />
      )}
    </ModuleContainer>
  );
};

export default RekapNilai;
