// Individual Student Prediction Component for Guru
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import './StudentPredictionView.css';

const StudentPredictionView = ({ activeTASemester, userId }) => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [predictionData, setPredictionData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch students and subjects
  useEffect(() => {
    fetchStudentsAndSubjects();
  }, []);

  const fetchStudentsAndSubjects = async () => {
    try {
      const [studentsRes, subjectsRes] = await Promise.all([
        fetch('/api/admin/siswa'),
        fetch('/api/admin/mata-pelajaran')
      ]);
      
      const studentsData = await studentsRes.json();
      const subjectsData = await subjectsRes.json();
      
      if (studentsData.success) setStudents(studentsData.data);
      if (subjectsData.success) setSubjects(subjectsData.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading students and subjects');
    }
  };

  const fetchPrediction = async () => {
    if (!selectedStudent || !selectedSubject) {
      alert('Pilih siswa dan mata pelajaran terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch prediction
      const predictionRes = await fetch(`/api/prediction/student/${selectedStudent}/mapel/${selectedSubject}`);
      const predictionData = await predictionRes.json();
      
      if (predictionData.success) {
        setPredictionData(predictionData.data);
        
        // Format historical data for chart
        const formattedHistory = predictionData.data.historicalData.map((item, index) => ({
          ...item,
          sequence: index + 1,
          tanggal: new Date(item.tanggal_input).toLocaleDateString('id-ID')
        }));
        setHistoricalData(formattedHistory);
      } else {
        setError(predictionData.message);
        setPredictionData(null);
        setHistoricalData([]);
      }
    } catch (err) {
      setError('Error fetching prediction: ' + err.message);
      setPredictionData(null);
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'Meningkat': return '#28a745';
      case 'Menurun': return '#dc3545';
      case 'Stabil': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 80) return { level: 'Tinggi', color: '#28a745' };
    if (confidence >= 60) return { level: 'Sedang', color: '#ffc107' };
    return { level: 'Rendah', color: '#dc3545' };
  };

  const selectedStudentName = students.find(s => s.id_siswa == selectedStudent)?.nama_siswa || '';
  const selectedSubjectName = subjects.find(s => s.id_mapel == selectedSubject)?.nama_mapel || '';

  return (
    <div className="feature-content">
      <h2>🔮 Prediksi Nilai Individual Siswa</h2>
      <p className="message info">
        Analisis prediksi nilai siswa berdasarkan data historis menggunakan regresi linear.
      </p>

      {/* Selection Form */}
      <div className="prediction-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="studentSelect">Pilih Siswa:</label>
            <select
              id="studentSelect"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="form-select"
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map(student => (
                <option key={student.id_siswa} value={student.id_siswa}>
                  {student.nama_siswa}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subjectSelect">Pilih Mata Pelajaran:</label>
            <select
              id="subjectSelect"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="form-select"
            >
              <option value="">-- Pilih Mata Pelajaran --</option>
              {subjects.map(subject => (
                <option key={subject.id_mapel} value={subject.id_mapel}>
                  {subject.nama_mapel}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <button
              onClick={fetchPrediction}
              disabled={loading || !selectedStudent || !selectedSubject}
              className="predict-btn"
            >
              {loading ? '⏳ Memproses...' : '🔮 Prediksi Nilai'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="message error">
          ❌ {error}
        </div>
      )}

      {/* Prediction Results */}
      {predictionData && (
        <div className="prediction-results">
          {/* Student Info Header */}
          <div className="student-info-header">
            <h3>📊 Hasil Prediksi: {selectedStudentName}</h3>
            <p><strong>Mata Pelajaran:</strong> {selectedSubjectName}</p>
          </div>

          {/* Main Prediction Card */}
          <div className="main-prediction-card">
            <div className="prediction-highlight">
              <div className="prediction-value">
                {predictionData.prediction.nilaiPrediksi}
              </div>
              <div className="prediction-label">Prediksi Nilai Berikutnya</div>
            </div>
            
            <div className="prediction-details">
              <div className="detail-item">
                <span className="detail-label">Trend:</span>
                <span 
                  className="detail-value trend"
                  style={{ color: getTrendColor(predictionData.prediction.trend) }}
                >
                  {predictionData.prediction.trend === 'Meningkat' ? '📈' : 
                   predictionData.prediction.trend === 'Menurun' ? '📉' : '➡️'} 
                  {predictionData.prediction.trend}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Tingkat Akurasi:</span>
                <span 
                  className="detail-value confidence"
                  style={{ color: getConfidenceLevel(predictionData.prediction.confidence).color }}
                >
                  {predictionData.prediction.confidence}% 
                  ({getConfidenceLevel(predictionData.prediction.confidence).level})
                </span>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="analysis-summary">
            <h4>📈 Analisis Data Historis</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-value">{predictionData.analysis.jumlahData}</div>
                <div className="summary-label">Jumlah Data</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{predictionData.analysis.nilaiTerakhir}</div>
                <div className="summary-label">Nilai Terakhir</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{predictionData.analysis.rataRata}</div>
                <div className="summary-label">Rata-rata</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{predictionData.analysis.nilaiTertinggi}</div>
                <div className="summary-label">Nilai Tertinggi</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{predictionData.analysis.nilaiTerendah}</div>
                <div className="summary-label">Nilai Terendah</div>
              </div>
            </div>
          </div>

          {/* Historical Trend Chart */}
          {historicalData.length > 0 && (
            <div className="chart-section">
              <h4>📊 Grafik Trend Nilai Historis</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="tanggal" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(label) => `Tanggal: ${label}`}
                      formatter={(value, name) => [value, 'Nilai']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nilai" 
                      stroke="#007bff" 
                      strokeWidth={3}
                      dot={{ fill: '#007bff', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#007bff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Historical Data Table */}
          <div className="historical-data-section">
            <h4>📋 Data Historis Detail</h4>
            <div className="historical-table-wrapper">
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Tipe Nilai</th>
                    <th>Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionData.historicalData.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{new Date(item.tanggal_input).toLocaleDateString('id-ID')}</td>
                      <td>{item.nama_tipe}</td>
                      <td className="nilai-cell">{item.nilai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations">
            <h4>💡 Rekomendasi</h4>
            <div className="recommendation-content">
              {predictionData.prediction.trend === 'Meningkat' ? (
                <div className="recommendation positive">
                  <span className="icon">✅</span>
                  <span>Siswa menunjukkan tren positif. Pertahankan metode pembelajaran yang ada dan berikan apresiasi untuk memotivasi.</span>
                </div>
              ) : predictionData.prediction.trend === 'Menurun' ? (
                <div className="recommendation negative">
                  <span className="icon">⚠️</span>
                  <span>Siswa menunjukkan tren menurun. Perlu perhatian khusus, bimbingan tambahan, atau evaluasi metode pembelajaran.</span>
                </div>
              ) : (
                <div className="recommendation neutral">
                  <span className="icon">ℹ️</span>
                  <span>Nilai siswa relatif stabil. Variasikan metode pembelajaran untuk meningkatkan engagement dan hasil belajar.</span>
                </div>
              )}
              
              {predictionData.prediction.confidence < 60 && (
                <div className="recommendation warning">
                  <span className="icon">📊</span>
                  <span>Akurasi prediksi rendah karena data terbatas atau tidak konsisten. Perlukan lebih banyak data untuk prediksi yang akurat.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPredictionView;
