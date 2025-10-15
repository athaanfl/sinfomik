// frontend/src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { loginUser } from '../api/auth'; // Import fungsi login dari API
import feather from 'feather-icons';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('admin'); // Default ke admin
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' atau 'error'
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Initialize feather icons
    feather.replace();
  }, []);

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

  const handleRoleChange = (role) => {
    setUserType(role);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Re-initialize feather icons after DOM change
    setTimeout(() => feather.replace(), 0);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="hidden md:block rounded-2xl overflow-hidden shadow-xl relative">
              <img src="\bglogin.jpg" alt="EduSpark Academy" className="w-full h-96 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#4F46E5]/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h2 className="text-2xl font-bold">Sekolah Bhinekas</h2>
                <p className="mt-2">Membangun Generasi Cerdas dan Berkarakter</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl login-card">
              <div className="text-center mb-8">
                <img src="\logo-binekas.png" alt="School Logo" className="w-20 h-20 mx-auto rounded-full object-cover border-4 border-[#4F46E5]" />
                <h1 className="text-3xl font-bold text-gray-800 mt-4">Login Portal</h1>
                <p className="text-gray-600 mt-2">Sistem Informasi Akademik Sekolah Dasar</p>
              </div>

              <div className="flex justify-center space-x-4 mb-8">
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`role-btn px-4 py-2 rounded-lg font-medium flex items-center ${
                    userType === 'admin'
                      ? 'bg-[#4F46E5] text-white active'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <i data-feather="shield" className="mr-2 w-4 h-4"></i> Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('guru')}
                  className={`role-btn px-4 py-2 rounded-lg font-medium flex items-center ${
                    userType === 'guru'
                      ? 'bg-[#4F46E5] text-white active'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <i data-feather="user" className="mr-2 w-4 h-4"></i> Guru
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('siswa')}
                  className={`role-btn px-4 py-2 rounded-lg font-medium flex items-center ${
                    userType === 'siswa'
                      ? 'bg-[#4F46E5] text-white active'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <i data-feather="book" className="mr-2 w-4 h-4"></i> Siswa
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <i
                        data-feather={showPassword ? 'eye-off' : 'eye'}
                        className="text-gray-500 hover:text-primary"
                      ></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Ingat saya</label>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] font-medium"
                  >
                    Masuk <i data-feather="log-in" className="ml-2 w-4 h-4"></i>
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-4 p-3 rounded-lg text-center ${
                  messageType === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>© 2025 Sekolah Bhinekas. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;    