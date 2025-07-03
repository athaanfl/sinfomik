    // frontend/src/pages/LoginPage.js
    import React, { useState } from 'react';
    import { loginUser } from '../api/auth'; // Import fungsi login dari API

    function LoginPage({ onLogin }) {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [userType, setUserType] = useState('admin'); // Default ke admin
      const [message, setMessage] = useState('');
      const [messageType, setMessageType] = useState(''); // 'success' atau 'error'

      const handleSubmit = async (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        setMessage(''); // Reset pesan
        setMessageType('');

        try {
          const response = await loginUser(username, password, userType);
          if (response.success) {
            setMessage(response.message);
            setMessageType('success');
            // Panggil fungsi onLogin dari App.js untuk memperbarui state login
            // PASTIKAN respons.user.id DIKIRIMKAN KE onLogin
            onLogin(response.user.type, response.user.username, response.user.id);
            // Navigasi akan ditangani oleh App.js melalui Navigate component
          } else {
            setMessage(response.message);
            setMessageType('error');
          }
        } catch (error) {
          console.error('Login error:', error);
          setMessage('Tidak dapat terhubung ke server.');
          setMessageType('error');
        }
      };

      return (
        <div className="form-container">
          <h2>Login Sistem Akademik</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Login sebagai:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="admin"
                    checked={userType === 'admin'}
                    onChange={(e) => setUserType(e.target.value)}
                  />
                  Admin
                </label>
                <label>
                  <input
                    type="radio"
                    value="guru"
                    checked={userType === 'guru'}
                    onChange={(e) => setUserType(e.target.value)}
                  />
                  Guru
                </label>
                <label>
                  <input
                    type="radio"
                    value="siswa"
                    checked={userType === 'siswa'}
                    onChange={(e) => setUserType(e.target.value)}
                  />
                  Siswa
                </label>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-button">Login</button>
          </form>
          {message && <div className={`message ${messageType}`}>{message}</div>}
        </div>
      );
    }

    export default LoginPage;
    