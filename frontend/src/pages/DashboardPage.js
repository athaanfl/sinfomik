// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
// Import semua komponen fitur admin
import TASemester from '../features/admin/TASemester';
import Student from '../features/admin/student';
import Teacher from '../features/admin/teacher';
import ClassManagement from '../features/admin/classManagement';
import Course from '../features/admin/course';
import GradeType from '../features/admin/grade';
import StudentClassEnroll from '../features/admin/studentClassEnroll';
import TeacherClassEnroll from '../features/admin/teacherClassEnroll';
import ClassPromote from '../features/admin/classPromote'; // Corrected import name to match the file
import CapaianPembelajaranManagement from '../features/admin/capaianPembelajaranManagement';

// Import komponen fitur guru
import InputNilai from '../features/guru/inputNilai';
import RekapNilai from '../features/guru/rekapNilai';
import PenilaianCapaianPembelajaran from '../features/guru/cp'; // Import komponen CP Guru baru
import WaliKelasGradeView from '../features/guru/WaliKelasGradeView'; // Import komponen baru

import * as adminApi from '../api/admin'; // Untuk fetch activeTASemester di sidebar utama

// Terima userId sebagai prop
function DashboardPage({ userRole, username, userId, onLogout }) {
  const [activeMenuItem, setActiveMenuItem] = useState(''); // State untuk menu aktif di sidebar
  const [activeTASemester, setActiveTASemester] = useState(null);
  const [loadingTAS, setLoadingTAS] = useState(true);
  const [errorTAS, setErrorTAS] = useState(null);

  // Fetch active TA/Semester saat komponen dimuat (untuk ditampilkan di sidebar)
  useEffect(() => {
    const fetchActiveTASemester = async () => {
      setLoadingTAS(true);
      setErrorTAS(null);
      try {
        const data = await adminApi.getTASemester();
        const active = data.find(ta => ta.is_aktif);
        setActiveTASemester(active || null);
      } catch (error) {
        console.error("Error fetching active TA/Semester:", error);
        setErrorTAS(error.message);
        setActiveTASemester(null);
      } finally {
        setLoadingTAS(false);
      }
    };
    fetchActiveTASemester();
  }, []);

  // Definisikan item menu untuk setiap peran
  const adminMenuItems = [
    { name: "Tahun Ajaran & Semester", key: "ta-semester", component: TASemester },
    { name: "Manajemen Siswa", key: "manajemen-siswa", component: Student },
    { name: "Manajemen Guru", key: "manajemen-guru", component: Teacher },
    { name: "Manajemen Kelas", key: "manajemen-kelas", component: ClassManagement },
    { name: "Manajemen Mata Pelajaran", key: "manajemen-mapel", component: Course },
    { name: "Manajemen Tipe Nilai", key: "manajemen-tipe-nilai", component: GradeType },
    { name: "Manajemen Capaian Pembelajaran", key: "manajemen-cp", component: CapaianPembelajaranManagement },
    { name: "Penugasan Siswa ke Kelas", key: "penugasan-siswa-kelas", component: StudentClassEnroll },
    { name: "Penugasan Guru ke Mapel & Kelas", key: "penugasan-guru-mapel-kelas", component: TeacherClassEnroll },
    { name: "Kenaikan Kelas", key: "kenaian-kelas", component: ClassPromote },
  ];

  const guruMenuItems = [
    { name: "Input Nilai", key: "input-nilai", component: InputNilai },
    { name: "Rekap Nilai", key: "rekap-nilai", component: RekapNilai },
    { name: "Penilaian CP", key: "penilaian-cp", component: PenilaianCapaianPembelajaran },
    { name: "Nilai Kelas Wali", key: "nilai-kelas-wali", component: WaliKelasGradeView }, // Menu baru
  ];

  const siswaMenuItems = [
    { name: "Lihat Nilai", key: "lihat-nilai", component: null }, // Komponen akan dibuat nanti
  ];

  // Set menu item awal berdasarkan peran
  useEffect(() => {
    let initialKey = '';
    if (userRole === 'admin' && adminMenuItems.length > 0) {
      initialKey = adminMenuItems[0].key;
    } else if (userRole === 'guru' && guruMenuItems.length > 0) {
      initialKey = guruMenuItems[0].key;
    } else if (userRole === 'siswa' && siswaMenuItems.length > 0) {
      initialKey = siswaMenuItems[0].key;
    }
    setActiveMenuItem(initialKey);
  }, [userRole]); // Jalankan sekali saat userRole berubah

  // Tentukan komponen yang akan dirender di area konten utama
  const renderContentComponent = () => {
    let ActiveComponent = null;
    let componentProps = {
      activeTASemester: activeTASemester,
      setActiveTASemester: setActiveTASemester,
    };

    if (userRole === 'admin') {
      const selectedAdminItem = adminMenuItems.find(item => item.key === activeMenuItem);
      ActiveComponent = selectedAdminItem ? selectedAdminItem.component : null;
      // Add adminId prop to GradeManagementAdmin
      if (activeMenuItem === 'manajemen-nilai') { // Assuming 'manajemen-nilai' is the key for GradeManagementAdmin
        componentProps.adminId = userId; // Pass admin's userId
      }
      if (!ActiveComponent) {
        return <p>Pilih menu di sidebar untuk mengelola data Admin.</p>;
      }
    } else if (userRole === 'guru') {
      const selectedGuruItem = guruMenuItems.find(item => item.key === activeMenuItem);
      ActiveComponent = selectedGuruItem ? selectedGuruItem.component : null;
      // Tambahkan props spesifik untuk guru
      componentProps.userId = userId; // Gunakan userId dari prop
      if (!ActiveComponent) {
        return <p>Pilih menu di sidebar untuk mengelola data Guru.</p>;
      }
    } else if (userRole === 'siswa') {
      const selectedSiswaItem = siswaMenuItems.find(item => item.key === activeMenuItem);
      ActiveComponent = selectedSiswaItem ? selectedSiswaItem.component : null;
      // Tambahkan props spesifik untuk siswa
      componentProps.userId = userId; // Gunakan userId dari prop
      if (!ActiveComponent) {
        return <p>Pilih menu di sidebar untuk melihat data Siswa.</p>;
      }
    } else {
      return <p>Selamat datang di dashboard!</p>;
    }

    return ActiveComponent ? <ActiveComponent {...componentProps} /> : null;
  };

  return (
    <div className="dashboard-container">
      <div className="app-sidebar">
        <h3>Menu {userRole === 'admin' ? 'Admin' : userRole === 'guru' ? 'Guru' : 'Siswa'}</h3>
        <p className="sidebar-user-info">Halo, {username}.</p>

        {loadingTAS ? (
          <p className="active-ta-info">Memuat TA Aktif...</p>
        ) : errorTAS ? (
          <p className="message error">Error: {errorTAS}</p>
        ) : (
          <p className="active-ta-info">
            TA Aktif: {activeTASemester ? `${activeTASemester.tahun_ajaran} ${activeTASemester.semester}` : 'Belum diatur'}
          </p>
        )}
        
        <ul className="app-nav-list">
          {userRole === 'admin' && adminMenuItems.map(item => (
            <li key={item.key}>
              <button
                className={`app-nav-button ${activeMenuItem === item.key ? 'active' : ''}`}
                onClick={() => setActiveMenuItem(item.key)}
              >
                {item.name}
              </button>
            </li>
          ))}
          {userRole === 'guru' && guruMenuItems.map(item => (
            <li key={item.key}>
              <button
                className={`app-nav-button ${activeMenuItem === item.key ? 'active' : ''}`}
                onClick={() => setActiveMenuItem(item.key)}
              >
                {item.name}
              </button>
            </li>
          ))}
          {userRole === 'siswa' && siswaMenuItems.map(item => (
            <li key={item.key}>
              <button
                className={`app-nav-button ${activeMenuItem === item.key ? 'active' : ''}`}
                onClick={() => setActiveMenuItem(item.key)}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
        
        <button onClick={onLogout} className="logout-button-sidebar">
          Logout
        </button>
      </div>

      <div className="main-content-area">
        <div className="dashboard-header-main">
          <h1>Dashboard {userRole === 'admin' ? 'Admin' : userRole === 'guru' ? 'Guru' : 'Siswa'}</h1>
        </div>

        <div className="dashboard-feature-content">
          {renderContentComponent()}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
