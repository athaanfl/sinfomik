import React, { useState, useEffect } from 'react';
import './DashboardPage.css'; // Impor CSS yang baru

// Import semua komponen fitur
import TASemester from '../features/admin/TASemester';
import Student from '../features/admin/student';
import Teacher from '../features/admin/teacher';
import ClassManagement from '../features/admin/classManagement';
import Course from '../features/admin/course';
import GradeType from '../features/admin/grade';
import StudentClassEnroll from '../features/admin/studentClassEnroll';
import TeacherClassEnroll from '../features/admin/teacherClassEnroll';
import ClassPromote from '../features/admin/classPromote';
import CapaianPembelajaranManagement from '../features/admin/capaianPembelajaranManagement';
import InputNilai from '../features/guru/inputNilai';
import RekapNilai from '../features/guru/rekapNilai';
import PenilaianCapaianPembelajaran from '../features/guru/cp';
import WaliKelasGradeView from '../features/guru/WaliKelasGradeView';

import * as adminApi from '../api/admin';

function DashboardPage({ userRole, username, userId, onLogout }) {
    const [activeMenuItem, setActiveMenuItem] = useState('');
    const [activeTASemester, setActiveTASemester] = useState(null);
    const [loadingTAS, setLoadingTAS] = useState(true);
    const [errorTAS, setErrorTAS] = useState(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false); // State untuk toggle sidebar

    useEffect(() => {
        const fetchActiveTASemester = async () => {
            setLoadingTAS(true);
            try {
                const data = await adminApi.getTASemester();
                const active = data.find(ta => ta.is_aktif);
                setActiveTASemester(active || null);
            } catch (error) {
                console.error("Error fetching active TA/Semester:", error);
                setErrorTAS(error.message);
            } finally {
                setLoadingTAS(false);
            }
        };
        fetchActiveTASemester();
    }, []);

    // Tambahkan ikon ke item menu
    const adminMenuItems = [
        { name: "Tahun Ajaran & Semester", key: "ta-semester", component: TASemester, icon: "fas fa-calendar" },
        { name: "Manajemen Siswa", key: "manajemen-siswa", component: Student, icon: "fas fa-users" },
        { name: "Manajemen Guru", key: "manajemen-guru", component: Teacher, icon: "fas fa-chalkboard-teacher" },
        { name: "Manajemen Kelas", key: "manajemen-kelas", component: ClassManagement, icon: "fas fa-door-open" },
        { name: "Manajemen Mata Pelajaran", key: "manajemen-mapel", component: Course, icon: "fas fa-book" },
        { name: "Manajemen Tipe Nilai", key: "manajemen-tipe-nilai", component: GradeType, icon: "fas fa-star" },
        { name: "Manajemen Capaian Pembelajaran", key: "manajemen-cp", component: CapaianPembelajaranManagement, icon: "fas fa-bullseye" },
        { name: "Penugasan Siswa ke Kelas", key: "penugasan-siswa-kelas", component: StudentClassEnroll, icon: "fas fa-user-graduate" },
        { name: "Penugasan Guru ke Mapel & Kelas", key: "penugasan-guru-mapel-kelas", component: TeacherClassEnroll, icon: "fas fa-tasks" },
        { name: "Kenaikan Kelas", key: "kenaian-kelas", component: ClassPromote, icon: "fas fa-level-up-alt" },
    ];

    const guruMenuItems = [
        { name: "Input Nilai", key: "input-nilai", component: InputNilai, icon: "fas fa-edit" },
        { name: "Rekap Nilai", key: "rekap-nilai", component: RekapNilai, icon: "fas fa-chart-bar" },
        { name: "Penilaian CP", key: "penilaian-cp", component: PenilaianCapaianPembelajaran, icon: "fas fa-check-circle" },
        { name: "Nilai Kelas Wali", key: "nilai-kelas-wali", component: WaliKelasGradeView, icon: "fas fa-eye" },
    ];

    const siswaMenuItems = [
        { name: "Lihat Nilai", key: "lihat-nilai", component: () => <p>Fitur Lihat Nilai untuk Siswa akan segera hadir.</p>, icon: "fas fa-poll" },
    ];

    useEffect(() => {
        let initialKey = '';
        if (userRole === 'admin') initialKey = adminMenuItems[0]?.key;
        else if (userRole === 'guru') initialKey = guruMenuItems[0]?.key;
        else if (userRole === 'siswa') initialKey = siswaMenuItems[0]?.key;
        setActiveMenuItem(initialKey);
    }, [userRole]);

    const handleMenuClick = (key) => {
        setActiveMenuItem(key);
        setSidebarOpen(false); // Tutup sidebar setelah menu dipilih
    };

    const renderContentComponent = () => {
        const allItems = [...adminMenuItems, ...guruMenuItems, ...siswaMenuItems];
        const selectedItem = allItems.find(item => item.key === activeMenuItem);
        const ActiveComponent = selectedItem ? selectedItem.component : null;

        if (!ActiveComponent) {
            return <p>Pilih menu di sidebar.</p>;
        }

        let componentProps = { userId };
        if (activeTASemester) {
            componentProps.activeTASemester = activeTASemester;
        }

        return <ActiveComponent {...componentProps} />;
    };

    const menuItems = userRole === 'admin' ? adminMenuItems : userRole === 'guru' ? guruMenuItems : siswaMenuItems;

    return (
        <div className="dashboard-container">
            <button 
                id="mobileMenuBtn" 
                className={`mobile-menu-btn ${isSidebarOpen ? 'active' : ''}`} 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
                <i className="fas fa-bars"></i>
            </button>

            {/* Overlay untuk menutup sidebar */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
            )}

            <div className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className="fas fa-graduation-cap"></i>
                        <span>Bhinekas Academic System Information</span>
                    </h2>
                </div>

                <div className="user-info">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium truncate">{username}</span>
                        <span className="role-badge">
                            {userRole}
                        </span>
                    </div>
                </div>

                <div className="active-ta">
                    {loadingTAS ? (
                        <div className="flex items-center">
                            <span className="loading-spinner"></span> 
                            <span className="ml-2">Memuat...</span>
                        </div>
                    ) : errorTAS ? (
                        <div className="flex items-center">
                            <i className="fas fa-exclamation-triangle mr-2 text-red-400"></i> 
                            <span>Error</span>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <i className="fas fa-calendar-alt mr-2"></i>
                            <span>{activeTASemester ? `${activeTASemester.tahun_ajaran} ${activeTASemester.semester}` : 'TA Belum Aktif'}</span>
                        </div>
                    )}
                </div>

                <nav className="mt-4 flex-grow">
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            className={`app-nav-button ${activeMenuItem === item.key ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item.key)}
                        >
                            <i className={item.icon}></i>
                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>

                <button onClick={onLogout} className="logout-btn">
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </div>

            {/* PERBARUI: Main content area tanpa collapsed state */}
            <div className="main-content-area">
                {/* ... (Isi konten utama tidak berubah) ... */}
                <div className="dashboard-header">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Dashboard {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium hidden sm:block">{username}</span>
                    </div>
                </div>

                <div className="dashboard-feature-content">
                    {renderContentComponent()}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
