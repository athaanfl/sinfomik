// frontend/src/api/auth.js
// Fungsi untuk melakukan panggilan API ke backend

// Pastikan untuk mengganti ini dengan URL backend Node.js Anda
// Jika Anda menjalankan backend secara lokal, ini mungkin 'http://localhost:5000'
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const loginUser = async (username, password, userType) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, user_type: userType }),
    });

    const data = await response.json();

    if (response.ok) { // Status kode 2xx
      return { success: true, message: data.message, user: data.user };
    } else { // Status kode 4xx atau 5xx
      return { success: false, message: data.message || 'Login gagal.' };
    }
  } catch (error) {
    console.error('Error during login API call:', error);
    return { success: false, message: 'Tidak dapat terhubung ke server.' };
  }
};

// Anda bisa menambahkan fungsi API lain di sini, misalnya untuk register, fetch data siswa, dll.
