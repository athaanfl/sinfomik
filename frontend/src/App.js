    // frontend/src/App.js
    import React, { useState, useEffect } from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import LoginPage from './pages/LoginPage';
    import DashboardPage from './pages/DashboardPage';

    function App() {
      // State untuk melacak status login pengguna
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [userRole, setUserRole] = useState(null); // 'admin', 'guru', 'siswa'
      const [username, setUsername] = useState(null); // Nama pengguna yang login
      const [userId, setUserId] = useState(null); // ID pengguna yang login

      // Efek untuk memeriksa status login dari localStorage (jika ada)
      useEffect(() => {
        const storedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const storedUserRole = localStorage.getItem('userRole');
        const storedUsername = localStorage.getItem('username');
        const storedUserId = localStorage.getItem('userId'); // Ambil userId dari localStorage

        if (storedLoggedIn && storedUserRole && storedUsername && storedUserId) {
          setIsLoggedIn(storedLoggedIn);
          setUserRole(storedUserRole);
          setUsername(storedUsername);
          setUserId(storedUserId); // Set userId
        }
      }, []);

      // Fungsi untuk menangani login
      // Tambahkan parameter 'id' untuk userId
      const handleLogin = (role, name, id) => {
        setIsLoggedIn(true);
        setUserRole(role);
        setUsername(name);
        setUserId(id); // Set userId di state
        // Simpan status login di localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('username', name);
        localStorage.setItem('userId', id); // Simpan userId di localStorage
      };

      // Fungsi untuk menangani logout
      const handleLogout = () => {
        setIsLoggedIn(false);
        setUserRole(null);
        setUsername(null);
        setUserId(null);
        // Hapus status login dari localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('userId'); // Hapus userId dari localStorage
      };

      return (
        <Router>
          <Routes>
            {/* Route untuk halaman login */}
            <Route path="/login" element={
              isLoggedIn ? (
                // Jika sudah login, redirect ke dashboard yang sesuai
                <Navigate to={`/${userRole}-dashboard`} replace />
              ) : (
                // Jika belum login, tampilkan halaman login
                <LoginPage onLogin={handleLogin} />
              )
            } />

            {/* Route untuk dashboard Admin */}
            <Route path="/admin-dashboard" element={
              isLoggedIn && userRole === 'admin' ? (
                <DashboardPage userRole={userRole} username={username} userId={userId} onLogout={handleLogout} />
              ) : (
                // Jika tidak login atau bukan admin, redirect ke login
                <Navigate to="/login" replace />
              )
            } />

            {/* Route untuk dashboard Guru */}
            <Route path="/guru-dashboard" element={
              isLoggedIn && userRole === 'guru' ? (
                <DashboardPage userRole={userRole} username={username} userId={userId} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } />

            {/* Route untuk dashboard Siswa */}
            <Route path="/siswa-dashboard" element={
              isLoggedIn && userRole === 'siswa' ? (
                <DashboardPage userRole={userRole} username={username} userId={userId} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } />

            {/* Default route: redirect ke login jika tidak ada path yang cocok */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      );
    }

    export default App;
    