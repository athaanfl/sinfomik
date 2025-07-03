// frontend/src/api/admin.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// --- Fungsi Umum untuk Panggilan API ---
const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      // Jika respons bukan 2xx, lempar error dengan pesan dari backend
      throw new Error(data.message || 'Terjadi kesalahan pada server.');
    }
    return data;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error; // Lempar error agar bisa ditangkap di komponen
  }
};

// --- API untuk Tahun Ajaran & Semester ---
export const getTASemester = async () => {
  return fetchData(`${API_BASE_URL}/api/admin/ta-semester`);
};

export const addTASemester = async (tahunAjaran, semester) => {
  return fetchData(`${API_BASE_URL}/api/admin/ta-semester`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tahun_ajaran: tahunAjaran, semester: semester }),
  });
};

export const setActiveTASemester = async (id_ta_semester) => {
  return fetchData(`${API_BASE_URL}/api/admin/ta-semester/set-active/${id_ta_semester}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
};

// --- API untuk Siswa ---
export const getStudents = async () => {
  return fetchData(`${API_BASE_URL}/api/admin/students`);
};

export const addStudent = async (studentData) => {
  return fetchData(`${API_BASE_URL}/api/admin/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
};

export const updateStudent = async (id_siswa, studentData) => { // Fungsi baru
  return fetchData(`${API_BASE_URL}/api/admin/students/${id_siswa}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  });
};

export const deleteStudent = async (id_siswa) => { // Fungsi baru
  return fetchData(`${API_BASE_URL}/api/admin/students/${id_siswa}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
};

// --- API untuk Guru ---
export const getTeachers = async () => {
  return fetchData(`${API_BASE_URL}/api/admin/teachers`); // Endpoint sudah disesuaikan
};

export const addTeacher = async (teacherData) => {
  return fetchData(`${API_BASE_URL}/api/admin/teachers`, { // Endpoint sudah disesuaikan
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacherData),
  });
};

export const updateTeacher = async (id_guru, teacherData) => { // Fungsi baru
  return fetchData(`${API_BASE_URL}/api/admin/teachers/${id_guru}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacherData),
  });
};

export const deleteTeacher = async (id_guru) => { // Fungsi baru
  return fetchData(`${API_BASE_URL}/api/admin/teachers/${id_guru}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
};

// --- API untuk Kelas ---
export const getKelas = async (id_ta_semester = '') => {
  const url = id_ta_semester ? `${API_BASE_URL}/api/admin/kelas?id_ta_semester=${id_ta_semester}` : `${API_BASE_URL}/api/admin/kelas`;
  return fetchData(url);
};

export const addKelas = async (kelasData) => {
  return fetchData(`${API_BASE_URL}/api/admin/kelas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kelasData),
  });
};

// --- API untuk Mata Pelajaran ---
export const getMataPelajaran = async () => {
  return fetchData(`${API_BASE_URL}/api/admin/mapel`);
};

export const addMataPelajaran = async (nama_mapel) => {
  return fetchData(`${API_BASE_URL}/api/admin/mapel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama_mapel }),
  });
};

// --- API untuk Tipe Nilai ---
export const getTipeNilai = async () => {
  return fetchData(`${API_BASE_URL}/api/admin/tipe-nilai`);
};

export const addTipeNilai = async (tipeNilaiData) => {
  return fetchData(`${API_BASE_URL}/api/admin/tipe-nilai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tipeNilaiData),
  });
};

// --- API untuk Penugasan Siswa ke Kelas ---
export const assignSiswaToKelas = async (assignmentData) => {
  return fetchData(`${API_BASE_URL}/api/admin/siswa-kelas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignmentData),
  });
};

export const getSiswaInKelas = async (id_kelas, id_ta_semester) => {
  return fetchData(`${API_BASE_URL}/api/admin/siswa-in-kelas/${id_kelas}/${id_ta_semester}`);
};

// --- API untuk Penugasan Guru ke Mapel & Kelas ---
export const assignGuruToMapelKelas = async (assignmentData) => {
  return fetchData(`${API_BASE_URL}/api/admin/guru-mapel-kelas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignmentData),
  });
};

export const getGuruMapelKelasAssignments = async (id_ta_semester) => {
  return fetchData(`${API_BASE_URL}/api/admin/guru-mapel-kelas/${id_ta_semester}`);
};

// --- API untuk Kenaikan Kelas ---
export const promoteStudents = async (student_ids, target_kelas_id, target_ta_semester_id) => {
  return fetchData(`${API_BASE_URL}/api/admin/promote-students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_ids, target_kelas_id, target_ta_semester_id }),
  });
};
