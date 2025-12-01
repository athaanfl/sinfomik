// frontend/src/features/guru/inputNilai.js
import React, { useState, useEffect, useCallback } from 'react';
import * as guruApi from '../../api/guru';
import Button from '../../components/Button';
import Table from '../../components/Table';
import ModuleContainer from '../../components/ModuleContainer';
import PageHeader from '../../components/PageHeader';
import FormSection from '../../components/FormSection';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusMessage from '../../components/StatusMessage';
import EmptyState from '../../components/EmptyState';

const InputNilai = ({ activeTASemester, userId }) => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [tpColumns, setTpColumns] = useState([1]);
  const [tpDescriptions, setTpDescriptions] = useState({});
  const [isLoadingTp, setIsLoadingTp] = useState(false);
  const [gradesInput, setGradesInput] = useState({});
  const [kkm, setKkm] = useState({ UAS: 75, FINAL: 75 });
  const [showKkmSettings, setShowKkmSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fetchData = useCallback(async () => {
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
  }, [activeTASemester, userId, selectedAssignment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedAssignment && activeTASemester) {
        const [kelasId, mapelId] = selectedAssignment.split('-').map(Number);
        try {
          const studentsData = await guruApi.getStudentsInClass(kelasId, activeTASemester.id_ta_semester);
          setStudentsInClass(studentsData);
          
          setGradesInput({});
          setTpColumns([1]);
          setTpDescriptions({});
          
          await loadTpFromAtp(mapelId, kelasId);
          await loadKkmFromDatabase(mapelId, kelasId);
          await loadExistingGrades(kelasId, mapelId);
        } catch (err) {
          setError(err.message);
          setStudentsInClass([]);
        }
      } else {
        setStudentsInClass([]);
        setGradesInput({});
        setTpColumns([1]);
        setTpDescriptions({});
      }
    };
    fetchStudents();
  }, [selectedAssignment, activeTASemester]);

  const loadExistingGrades = async (kelasId, mapelId) => {
    try {
      const existingGrades = await guruApi.getGradesByAssignment(userId, mapelId, kelasId, activeTASemester.id_ta_semester);
      
      if (!existingGrades || existingGrades.length === 0) {
        return;
      }
      
      const gradesData = {};
      
      existingGrades.forEach(grade => {
        if (grade.jenis_nilai === 'TP') {
          gradesData[`${grade.id_siswa}_TP${grade.urutan_tp}`] = grade.nilai;
        } else if (grade.jenis_nilai === 'UAS') {
          gradesData[`${grade.id_siswa}_UAS`] = grade.nilai;
        }
      });
      
      setGradesInput(gradesData);
    } catch (err) {
      console.log('Error loading existing grades:', err.message);
    }
  };

  const loadTpFromAtp = async (mapelId, kelasId) => {
    setIsLoadingTp(true);
    try {
      const currentAssignment = assignments.find(
        assign => `${assign.id_kelas}-${assign.id_mapel}` === selectedAssignment
      );

      if (!currentAssignment) {
        return;
      }

      let fase = 'A';
      const kelasName = currentAssignment?.nama_kelas || '';
      const tingkatKelas = parseInt(kelasName.match(/^(\d+)/)?.[1] || '1');
      
      if (tingkatKelas >= 1 && tingkatKelas <= 2) fase = 'A';
      else if (tingkatKelas >= 3 && tingkatKelas <= 4) fase = 'B';
      else if (tingkatKelas >= 5 && tingkatKelas <= 6) fase = 'C';

      let semesterNumber = null;
      if (activeTASemester && activeTASemester.semester) {
        semesterNumber = activeTASemester.semester.toLowerCase() === 'ganjil' ? 1 : 2;
      }

      const tpData = await guruApi.getTpByMapelFaseKelas(mapelId, fase, kelasId, semesterNumber);
      
      if (tpData.success && tpData.tp_list && tpData.tp_list.length > 0) {
        const tpNumbers = tpData.tp_list.map((_, index) => index + 1);
        setTpColumns(tpNumbers);
        
        const descriptions = {};
        tpData.tp_list.forEach((tp, index) => {
          descriptions[index + 1] = tp.tujuan_pembelajaran;
        });
        setTpDescriptions(descriptions);
        
        const newKkm = { UAS: 75, FINAL: 75 };
        tpData.tp_list.forEach((tp, index) => {
          if (tp.kktp && !isNaN(parseFloat(tp.kktp))) {
            newKkm[`TP${index + 1}`] = parseFloat(tp.kktp);
          } else {
            newKkm[`TP${index + 1}`] = 75;
          }
        });
        setKkm(newKkm);
        
        const semesterText = tpData.semester_text || 'Semua';
        setMessage(`✅ Berhasil memuat ${tpData.total_tp} TP dari ATP ${tpData.mapel} Fase ${fase} - Semester ${semesterText} untuk ${tpData.nama_kelas}`);
        setMessageType('success');
        
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 5000);
      } else {
        setMessage('ℹ️ Tidak ada TP untuk semester ini. Silakan tambah TP manual.');
        setMessageType('info');
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
      }
    } catch (err) {
      console.log('Error loading TP from ATP:', err.message);
    } finally {
      setIsLoadingTp(false);
    }
  };

  const addTpColumn = () => {
    const nextTpNumber = Math.max(...tpColumns) + 1;
    setTpColumns([...tpColumns, nextTpNumber]);
    setKkm(prev => ({
      ...prev,
      [`TP${nextTpNumber}`]: 75
    }));
  };

  const removeTpColumn = (tpNumber) => {
    if (tpNumber === 1) return;
    setTpColumns(tpColumns.filter(tp => tp !== tpNumber));
    
    const newGradesInput = { ...gradesInput };
    Object.keys(newGradesInput).forEach(key => {
      if (key.includes(`_TP${tpNumber}`)) {
        delete newGradesInput[key];
      }
    });
    setGradesInput(newGradesInput);

    const newKkm = { ...kkm };
    delete newKkm[`TP${tpNumber}`];
    setKkm(newKkm);
  };

  useEffect(() => {
    const newKkm = { ...kkm };
    tpColumns.forEach(tpNum => {
      if (!newKkm[`TP${tpNum}`]) {
        newKkm[`TP${tpNum}`] = 75;
      }
    });
    setKkm(newKkm);
  }, [tpColumns]);

  const loadKkmFromDatabase = async (mapelId, kelasId) => {
    try {
      const response = await guruApi.getKkmSettings(
        userId,
        mapelId,
        kelasId,
        activeTASemester.id_ta_semester
      );
      
      if (response.success && response.data && Object.keys(response.data).length > 0) {
        setKkm(response.data);
        setMessage('✅ KKM settings berhasil dimuat dari database');
        setMessageType('success');
      }
    } catch (err) {
      console.log('Error loading KKM:', err.message);
    }
  };

  const saveKkmToDatabase = async () => {
    if (!selectedAssignment || !activeTASemester) {
      setMessage('❌ Pilih assignment terlebih dahulu');
      setMessageType('error');
      return;
    }

    const [kelasId, mapelId] = selectedAssignment.split('-').map(Number);
    
    try {
      const response = await guruApi.saveKkmSettings(
        userId,
        mapelId,
        kelasId,
        activeTASemester.id_ta_semester,
        kkm
      );
      
      setMessage(`✅ ${response.message}`);
      setMessageType('success');
    } catch (err) {
      setMessage(`❌ Gagal menyimpan KKM: ${err.message}`);
      setMessageType('error');
    }
  };

  const handleKkmChange = (column, value) => {
    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setKkm(prev => ({
        ...prev,
        [column]: value === '' ? '' : parseFloat(value)
      }));
    }
  };

  const isBelowKkm = (column, value) => {
    if (!value || value === '' || isNaN(parseFloat(value))) return false;
    const gradeValue = parseFloat(value);
    const kkmValue = kkm[column];
    if (kkmValue === '' || kkmValue === undefined || kkmValue === null) return false;
    return gradeValue < kkmValue;
  };

  const isFinalGradeBelowKkm = (studentId) => {
    const finalGrade = calculateFinalGrade(studentId);
    if (finalGrade === '-' || !kkm.FINAL || kkm.FINAL === '') return false;
    return parseFloat(finalGrade) < kkm.FINAL;
  };

  const handleGradeChange = (studentId, column, value) => {
    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setGradesInput(prev => ({
        ...prev,
        [`${studentId}_${column}`]: value
      }));
    }
  };

  const calculateFinalGrade = (studentId) => {
    let tpSum = 0;
    let tpCount = 0;
    
    tpColumns.forEach(tpNum => {
      const tpValue = gradesInput[`${studentId}_TP${tpNum}`];
      if (tpValue !== undefined && tpValue !== null && tpValue !== '' && !isNaN(parseFloat(tpValue))) {
        tpSum += parseFloat(tpValue);
        tpCount++;
      }
    });
    
    const tpAverage = tpCount > 0 ? tpSum / tpCount : 0;
    const uasValue = gradesInput[`${studentId}_UAS`];
    const uas = (uasValue !== undefined && uasValue !== null && uasValue !== '' && !isNaN(parseFloat(uasValue))) 
      ? parseFloat(uasValue) : null;
    
    if (tpCount > 0 && uas !== null) {
      return (tpAverage * 0.7 + uas * 0.3).toFixed(2);
    }
    
    return '-';
  };

  const handleSubmitGrades = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    if (!selectedAssignment || !activeTASemester || studentsInClass.length === 0) {
      setMessage('Harap pilih kelas/mapel dan pastikan ada siswa.');
      setMessageType('error');
      return;
    }

    const [kelasId, mapelId] = selectedAssignment.split('-').map(Number);
    let successCount = 0;
    let failCount = 0;

    const gradePromises = [];
    
    studentsInClass.forEach(student => {
      tpColumns.forEach(tpNum => {
        const gradeValue = gradesInput[`${student.id_siswa}_TP${tpNum}`];
        if (gradeValue !== undefined && gradeValue !== null && gradeValue !== '') {
          gradePromises.push(
            guruApi.addOrUpdateNewGrade({
              id_siswa: student.id_siswa,
              id_guru: userId,
              id_mapel: mapelId,
              id_kelas: kelasId,
              id_ta_semester: activeTASemester.id_ta_semester,
              jenis_nilai: 'TP',
              urutan_tp: tpNum,
              nilai: parseFloat(gradeValue),
              keterangan: `TP ${tpNum}`
            })
            .then(() => { successCount++; })
            .catch(err => {
              console.error(`Gagal menyimpan TP${tpNum} untuk ${student.nama_siswa}:`, err);
              failCount++;
            })
          );
        }
      });

      const uasValue = gradesInput[`${student.id_siswa}_UAS`];
      if (uasValue !== undefined && uasValue !== null && uasValue !== '') {
        gradePromises.push(
          guruApi.addOrUpdateNewGrade({
            id_siswa: student.id_siswa,
            id_guru: userId,
            id_mapel: mapelId,
            id_kelas: kelasId,
            id_ta_semester: activeTASemester.id_ta_semester,
            jenis_nilai: 'UAS',
            urutan_tp: null,
            nilai: parseFloat(uasValue),
            keterangan: 'UAS'
          })
          .then(() => { successCount++; })
          .catch(err => {
            console.error(`Gagal menyimpan UAS untuk ${student.nama_siswa}:`, err);
            failCount++;
          })
        );
      }
    });

    try {
      await Promise.all(gradePromises);
      if (successCount > 0) {
        setMessage(`Berhasil menyimpan ${successCount} nilai. ${failCount} gagal.`);
        setMessageType('success');
      } else if (failCount > 0) {
        setMessage(`Gagal menyimpan ${failCount} nilai. Periksa konsol untuk detail.`);
        setMessageType('error');
      } else {
        setMessage('Tidak ada nilai yang diinput atau diubah.');
        setMessageType('info');
      }
    } catch (err) {
      setMessage(`Terjadi kesalahan umum saat menyimpan nilai: ${err.message}`);
      setMessageType('error');
    }
  };

  const handleExportTemplate = async () => {
    if (!selectedAssignment || !activeTASemester) {
      setMessage('Pilih assignment dan pastikan TA/Semester aktif');
      setMessageType('error');
      return;
    }

    const [kelasId, mapelId] = selectedAssignment.split('-').map(Number);
    
    setIsExporting(true);
    setMessage('Mengunduh template Excel...');
    setMessageType('info');

    try {
      await guruApi.exportGradeTemplate(
        userId,
        mapelId,
        kelasId,
        activeTASemester.id_ta_semester
      );
      
      setMessage('✅ Template Excel berhasil diunduh!');
      setMessageType('success');
    } catch (err) {
      setMessage(`❌ Gagal mengunduh template: ${err.message}`);
      setMessageType('error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedAssignment || !activeTASemester) {
      setMessage('Pilih assignment dan pastikan TA/Semester aktif');
      setMessageType('error');
      return;
    }

    const [kelasId, mapelId] = selectedAssignment.split('-').map(Number);
    
    setIsImporting(true);
    setMessage('Mengupload dan memproses file Excel...');
    setMessageType('info');

    try {
      const result = await guruApi.importGradesFromExcel(
        file,
        userId,
        mapelId,
        kelasId,
        activeTASemester.id_ta_semester
      );

      if (result.errors && result.errors.length > 0) {
        setMessage(`⚠️ Import selesai dengan error: ${result.message}\n${result.errors.slice(0, 5).join(', ')}`);
        setMessageType('warning');
      } else {
        setMessage(`✅ ${result.message}`);
        setMessageType('success');
      }

      await loadExistingGrades(kelasId, mapelId);
    } catch (err) {
      setMessage(`❌ Gagal import nilai: ${err.message}`);
      setMessageType('error');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleExportFinalGrades = async () => {
    if (!selectedAssignment || !activeTASemester) {
      setMessage('Pilih assignment terlebih dahulu');
      setMessageType('error');
      return;
    }

    const [kelasId, mapelId] = selectedAssignment.split('-').map(Number);
    
    setIsExporting(true);
    setMessage('Sedang membuat file Excel nilai final...');
    setMessageType('info');

    try {
      await guruApi.exportFinalGrades(userId, mapelId, kelasId, activeTASemester.id_ta_semester);
      setMessage('✅ Nilai final berhasil diexport! File akan segera terunduh.');
      setMessageType('success');
    } catch (err) {
      setMessage(`❌ Gagal export nilai final: ${err.message}`);
      setMessageType('error');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Memuat data guru..." />;
  if (error) return <StatusMessage type="error" message={error} />;

  const currentAssignment = assignments.find(
    assign => `${assign.id_kelas}-${assign.id_mapel}` === selectedAssignment
  );

  return (
    <ModuleContainer>
      <PageHeader
        icon="edit"
        title="Input Nilai Siswa"
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
            <>
              <FormSection title="Manajemen Kolom TP">
                {isLoadingTp && <StatusMessage type="info" message="⏳ Memuat TP dari ATP..." />}
                
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    <i className="fas fa-file-excel mr-2"></i>
                    Tools Import/Export Excel
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      variant="success"
                      icon="download"
                      onClick={handleExportTemplate}
                      disabled={isExporting || !selectedAssignment}
                      loading={isExporting}
                      fullWidth
                    >
                      Download Template
                    </Button>
                    
                    <Button
                      variant="primary"
                      icon="upload"
                      disabled={isImporting || !selectedAssignment}
                      loading={isImporting}
                      fullWidth
                      onClick={() => document.getElementById('excel-upload').click()}
                    >
                      Upload & Import Nilai
                    </Button>
                    <input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx"
                      onChange={handleImportFromExcel}
                      disabled={isImporting || !selectedAssignment}
                      style={{ display: 'none' }}
                    />
                    
                    <Button
                      variant="secondary"
                      icon="file-export"
                      onClick={handleExportFinalGrades}
                      disabled={isExporting || !selectedAssignment}
                      loading={isExporting}
                      fullWidth
                    >
                      Export Nilai Final
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    <i className="fas fa-lightbulb mr-1"></i>
                    <strong>Tip:</strong> Download template Excel untuk input nilai secara offline, lalu upload kembali setelah diisi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      icon="plus"
                      size="sm"
                      onClick={addTpColumn}
                    >
                      Tambah TP (Manual)
                    </Button>
                    <Button
                      variant="outline"
                      icon="cog"
                      size="sm"
                      onClick={() => setShowKkmSettings(!showKkmSettings)}
                    >
                      {showKkmSettings ? 'Sembunyikan' : 'Atur'} KKM
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tpColumns.map(tpNum => (
                      <div
                        key={tpNum}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-300"
                        title={tpDescriptions[tpNum] || 'Tidak ada deskripsi'}
                      >
                        <span className="font-medium">TP {tpNum}</span>
                        {tpDescriptions[tpNum] && (
                          <span className="text-xs text-gray-600 max-w-xs truncate">
                            {tpDescriptions[tpNum].substring(0, 50)}...
                          </span>
                        )}
                        {tpNum !== 1 && (
                          <button
                            onClick={() => removeTpColumn(tpNum)}
                            className="ml-2 text-red-600 hover:text-red-800 font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {showKkmSettings && (
                    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <h5 className="font-semibold text-gray-900 mb-3">
                        <i className="fas fa-graduation-cap mr-2"></i>
                        Pengaturan Kriteria Ketuntasan Minimal (KKM)
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {tpColumns.map(tpNum => (
                          <div key={`kkm-TP${tpNum}`}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              KKM TP {tpNum}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={kkm[`TP${tpNum}`] || ''}
                              onChange={(e) => handleKkmChange(`TP${tpNum}`, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                              placeholder="75"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            KKM UAS
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={kkm.UAS || ''}
                            onChange={(e) => handleKkmChange('UAS', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="75"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            KKM Nilai Akhir
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={kkm.FINAL || ''}
                            onChange={(e) => handleKkmChange('FINAL', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="75"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        <i className="fas fa-info-circle mr-1"></i>
                        Nilai di bawah KKM akan ditampilkan dengan latar belakang merah.
                      </p>
                      <Button
                        variant="primary"
                        icon="save"
                        size="sm"
                        onClick={saveKkmToDatabase}
                      >
                        Simpan KKM ke Database
                      </Button>
                    </div>
                  )}
                </div>
              </FormSection>

              {studentsInClass.length > 0 ? (
                <FormSection title={`Input Nilai untuk ${currentAssignment.nama_mapel} di Kelas ${currentAssignment.nama_kelas}`}>
                  <form onSubmit={handleSubmitGrades} className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                              Nama Siswa
                            </th>
                            {tpColumns.map(tpNum => (
                              <th
                                key={`TP${tpNum}`}
                                className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                                title={tpDescriptions[tpNum] || `Tujuan Pembelajaran ${tpNum}`}
                              >
                                <div className="flex flex-col">
                                  <strong>TP {tpNum}</strong>
                                  {tpDescriptions[tpNum] && (
                                    <span className="text-[10px] font-normal text-gray-500 mt-1 max-w-[120px] truncate">
                                      {tpDescriptions[tpNum].substring(0, 60)}...
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                              UAS
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Nilai Akhir
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentsInClass.map(student => (
                            <tr key={student.id_siswa} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                {student.nama_siswa}
                              </td>
                              {tpColumns.map(tpNum => (
                                <td key={`${student.id_siswa}-TP${tpNum}`} className="px-4 py-3 whitespace-nowrap text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={gradesInput[`${student.id_siswa}_TP${tpNum}`] || ''}
                                    onChange={(e) => handleGradeChange(student.id_siswa, `TP${tpNum}`, e.target.value)}
                                    className={`w-20 px-2 py-1 border rounded text-center text-sm ${
                                      isBelowKkm(`TP${tpNum}`, gradesInput[`${student.id_siswa}_TP${tpNum}`])
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                                    }`}
                                    placeholder="0-100"
                                  />
                                </td>
                              ))}
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={gradesInput[`${student.id_siswa}_UAS`] || ''}
                                  onChange={(e) => handleGradeChange(student.id_siswa, 'UAS', e.target.value)}
                                  className={`w-20 px-2 py-1 border rounded text-center text-sm ${
                                    isBelowKkm('UAS', gradesInput[`${student.id_siswa}_UAS`])
                                      ? 'border-red-500 bg-red-50'
                                      : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                                  }`}
                                  placeholder="0-100"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center justify-center w-20 px-3 py-1 rounded-full font-bold text-sm ${
                                  isFinalGradeBelowKkm(student.id_siswa)
                                    ? 'bg-red-500 text-white'
                                    : calculateFinalGrade(student.id_siswa) !== '-'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {calculateFinalGrade(student.id_siswa)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <p className="text-sm text-gray-600">
                        <i className="fas fa-calculator mr-1"></i>
                        <strong>Keterangan:</strong> Nilai Akhir = 70% rata-rata TP + 30% UAS
                      </p>
                      <Button
                        type="submit"
                        variant="success"
                        icon="save"
                        size="lg"
                      >
                        Simpan Semua Nilai
                      </Button>
                    </div>
                  </form>
                </FormSection>
              ) : (
                <EmptyState
                  icon="users"
                  title="Tidak Ada Siswa"
                  message="Tidak ada siswa di kelas ini."
                />
              )}
            </>
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

export default InputNilai;
