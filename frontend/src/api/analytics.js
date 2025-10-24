// frontend/src/api/analytics.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Fetch school-wide analytics
 * @param {Object} params - { id_mapel?, id_ta_semester? }
 * @returns {Promise<Object>} School analytics data
 */
export const fetchSchoolAnalytics = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/analytics/school${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch school analytics');
    }
    return response.json();
};

/**
 * Fetch angkatan analytics
 * @param {string} tahunAjaranMasuk - Tahun ajaran masuk (e.g., "2023/2024")
 * @param {Object} params - { id_mapel? }
 * @returns {Promise<Object>} Angkatan analytics data
 */
export const fetchAngkatanAnalytics = async (tahunAjaranMasuk, params = {}) => {
    // URL encode the tahun ajaran to handle the slash character
    const encodedTahunAjaran = encodeURIComponent(tahunAjaranMasuk);
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/analytics/angkatan/${encodedTahunAjaran}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch angkatan analytics');
    }
    return response.json();
};

/**
 * Fetch list of available angkatan
 * @returns {Promise<Array>} List of angkatan
 */
export const fetchAngkatanList = async () => {
    const url = `${API_BASE_URL}/analytics/angkatan-list`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch angkatan list');
    }
    return response.json();
};

/**
 * Fetch student individual analytics (kenang-kenangan)
 * @param {number} idSiswa - Student ID
 * @param {Object} params - { id_mapel? }
 * @returns {Promise<Object>} Student analytics data
 */
export const fetchStudentAnalytics = async (idSiswa, params = {}) => {
    // Remove empty params
    const cleanParams = {};
    if (params.id_mapel && params.id_mapel !== '') {
        cleanParams.id_mapel = params.id_mapel;
    }
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = `${API_BASE_URL}/analytics/student/${idSiswa}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch student analytics');
    }
    return response.json();
};

/**
 * Fetch guru subject analytics
 * @param {number} idGuru - Guru ID
 * @param {Object} params - { id_mapel?, id_kelas?, id_ta_semester? }
 * @returns {Promise<Object>} Guru analytics data
 */
export const fetchGuruAnalytics = async (idGuru, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/analytics/guru/${idGuru}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch guru analytics');
    }
    return response.json();
};

/**
 * Compare multiple students
 * @param {Array<number>} idSiswaList - Array of student IDs
 * @param {Object} params - { id_mapel? }
 * @returns {Promise<Object>} Comparison data
 */
export const compareStudents = async (idSiswaList, params = {}) => {
    const allParams = {
        ...params,
        id_siswa_list: idSiswaList.join(',')
    };
    const queryString = new URLSearchParams(allParams).toString();
    const url = `${API_BASE_URL}/analytics/compare-students?${queryString}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to compare students');
    }
    return response.json();
};
