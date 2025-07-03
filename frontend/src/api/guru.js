import { getTipeNilai } from './admin';
// frontend/src/api/guru.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// --- Fungsi Umum untuk Panggilan API ---
const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Terjadi kesalahan pada server.');
    }
    return data;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
};

// --- API untuk Penugasan Guru (Kelas & Mapel yang Diajar) ---
export const getGuruAssignments = async (id_guru, id_ta_semester) => {
  if (!id_guru || !id_ta_semester) {
    throw new Error("ID Guru dan ID TA/Semester diperlukan untuk mengambil penugasan.");
  }
  return fetchData(`${API_BASE_URL}/api/guru/assignments/${id_guru}/${id_ta_semester}`);
};

// --- API untuk Siswa di Kelas Tertentu ---
export const getStudentsInClass = async (id_kelas, id_ta_semester) => {
  if (!id_kelas || !id_ta_semester) {
    throw new Error("ID Kelas dan ID TA/Semester diperlukan untuk mengambil siswa.");
  }
  return fetchData(`${API_BASE_URL}/api/guru/students-in-class/${id_kelas}/${id_ta_semester}`);
};

// --- API untuk Mendapatkan Tipe Nilai (dari Admin API, karena guru juga butuh) ---
// Ini bisa diimpor dari admin.js jika Anda ingin menghindari duplikasi,
// tapi untuk kemudahan, kita bisa buat ulang di sini atau impor langsung.
// Untuk saat ini, kita akan impor dari admin.js

export { getTipeNilai };


// --- API untuk Menambah/Memperbarui Nilai ---
export const addOrUpdateGrade = async (gradeData) => {
  return fetchData(`${API_BASE_URL}/api/guru/grades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gradeData),
  });
};

// --- API untuk Rekap Nilai ---
export const getRekapNilai = async (id_guru, id_mapel, id_kelas, id_ta_semester) => {
  if (!id_guru || !id_mapel || !id_kelas || !id_ta_semester) {
    throw new Error("Semua ID diperlukan untuk mengambil rekap nilai.");
  }
  return fetchData(`${API_BASE_URL}/api/guru/grades/rekap/${id_guru}/${id_mapel}/${id_kelas}/${id_ta_semester}`);
};
