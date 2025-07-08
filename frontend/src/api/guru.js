// Import ini harus di bagian paling atas file
import { getTipeNilai, getMataPelajaran } from './admin'; // getMataPelajaran juga dibutuhkan
export { getTipeNilai, getMataPelajaran }; // Ekspor ulang agar bisa digunakan oleh modul lain

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

// --- API Capaian Pembelajaran untuk Guru ---
export const getCapaianPembelajaranByMapel = async (id_mapel) => {
  if (!id_mapel) {
    throw new Error("ID Mata Pelajaran diperlukan untuk mengambil Capaian Pembelajaran.");
  }
  return fetchData(`${API_BASE_URL}/api/guru/cp/mapel/${id_mapel}`);
};

export const getSiswaCapaianPembelajaran = async (id_guru, id_mapel, id_kelas, id_ta_semester) => {
  if (!id_guru || !id_mapel || !id_kelas || !id_ta_semester) {
    throw new Error("Semua ID diperlukan untuk mengambil Siswa Capaian Pembelajaran.");
  }
  return fetchData(`${API_BASE_URL}/api/guru/siswa-cp/${id_guru}/${id_mapel}/${id_kelas}/${id_ta_semester}`);
};

export const addOrUpdateSiswaCapaianPembelajaran = async (siswaCpData) => {
  return fetchData(`${API_BASE_URL}/api/guru/siswa-cp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siswaCpData),
  });
};

// --- New: Get Wali Kelas Grades ---
export const getWaliKelasGrades = async (id_guru, id_ta_semester) => {
  if (!id_guru || !id_ta_semester) {
    throw new Error("ID Guru dan ID TA/Semester diperlukan untuk mengambil nilai kelas wali.");
  }
  return fetchData(`${API_BASE_URL}/api/guru/wali-kelas-grades/${id_guru}/${id_ta_semester}`);
};
