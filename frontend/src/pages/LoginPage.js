import React, { useState } from 'react';
import { loginUser } from '../api/auth'; // Sesuaikan dengan path file API Anda
import './LoginPage.css'; // Atau path ke file CSS Anda, misal: '../App.css'
import SchoolLogo from '../assets/Bhinekas.png'; // Pastikan path ke gambar ini benar

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('admin');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setIsLoading(true);

    try {
      const response = await loginUser(username, password, userType);
      if (response.success) {
        setMessage(response.message);
        setMessageType('success');
        onLogin(response.user.type, response.user.username, response.user.id);
      } else {
        setMessage(response.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Tidak dapat terhubung ke server.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getRadioOptionClass = (type) => {
    let baseClass = "p-3 border-2 rounded-lg flex flex-col items-center";
    if (userType === type) {
      return `${baseClass} border-indigo-500 bg-indigo-50`;
    }
    return `${baseClass} border-gray-200`;
  };

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              {/* GAMBAR LOGO DITAMPILKAN DI SINI */}
              <img src={SchoolLogo} alt="Logo Sekolah Bhinekas" className="w-20 h-20 object-contain mx-auto mb-4 rounded-md" />
              
              <h1 className="text-3xl font-bold text-gray-800">Sistem Akademik</h1>
              <p className="text-gray-600 mt-2">Silakan masuk untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Login sebagai:</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="radio-option cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="admin"
                        className="hidden"
                        checked={userType === 'admin'}
                        onChange={(e) => setUserType(e.target.value)}
                      />
                      <div className={getRadioOptionClass('admin')}>
                        <i className="fas fa-user-shield text-2xl text-indigo-600 mb-2"></i>
                        <span className="text-sm font-medium">Admin</span>
                      </div>
                    </label>
                    <label className="radio-option cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="guru"
                        className="hidden"
                        checked={userType === 'guru'}
                        onChange={(e) => setUserType(e.target.value)}
                      />
                      <div className={getRadioOptionClass('guru')}>
                        <i className="fas fa-chalkboard-teacher text-2xl text-indigo-600 mb-2"></i>
                        <span className="text-sm font-medium">Guru</span>
                      </div>
                    </label>
                    <label className="radio-option cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="siswa"
                        className="hidden"
                        checked={userType === 'siswa'}
                        onChange={(e) => setUserType(e.target.value)}
                      />
                      <div className={getRadioOptionClass('siswa')}>
                        <i className="fas fa-user-graduate text-2xl text-indigo-600 mb-2"></i>
                        <span className="text-sm font-medium">Siswa</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fas fa-user text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-3 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Masukkan username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fas fa-lock text-gray-400"></i>
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-3 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Masukkan password"
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div>
                  <div className={`p-3 rounded-md text-sm ${messageType === 'success' ? 'bg-green-100 text-green-800 message-success' : 'bg-red-100 text-red-800 message-error'}`}>
                    {message}
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i> Memproses...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i> Login
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">© 2025 Sistem Akademik. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;