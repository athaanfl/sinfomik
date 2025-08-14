// Frontend component untuk Sistem Prediksi Nilai
import React, { useState, useEffect } from 'react';
import './PredictionDashboard.css';

const PredictionDashboard = () => {
    const [students, setStudents] = useState([]);
    const [mapel, setMapel] = useState([]);
    const [tipeNilai, setTipeNilai] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedMapel, setSelectedMapel] = useState('');
    const [selectedTipeNilai, setSelectedTipeNilai] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [classTrends, setClassTrends] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('individual');

    // Fetch initial data
    useEffect(() => {
        fetchStudents();
        fetchMapel();
        fetchTipeNilai();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/admin/siswa');
            const data = await response.json();
            if (data.success) {
                setStudents(data.data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchMapel = async () => {
        try {
            const response = await fetch('/api/admin/mata-pelajaran');
            const data = await response.json();
            if (data.success) {
                setMapel(data.data);
            }
        } catch (error) {
            console.error('Error fetching mapel:', error);
        }
    };

    const fetchTipeNilai = async () => {
        try {
            const response = await fetch('/api/admin/tipe-nilai');
            const data = await response.json();
            if (data.success) {
                setTipeNilai(data.data);
            }
        } catch (error) {
            console.error('Error fetching tipe nilai:', error);
        }
    };

    const predictIndividual = async () => {
        if (!selectedStudent || !selectedMapel) {
            alert('Pilih siswa dan mata pelajaran terlebih dahulu');
            return;
        }

        setLoading(true);
        try {
            const tipeParam = selectedTipeNilai ? `?tipeNilaiId=${selectedTipeNilai}` : '';
            const response = await fetch(`/api/prediction/student/${selectedStudent}/mapel/${selectedMapel}${tipeParam}`);
            const data = await response.json();
            
            if (data.success) {
                setPrediction(data.data);
            } else {
                alert(data.message);
                setPrediction(null);
            }
        } catch (error) {
            console.error('Error predicting:', error);
            alert('Error dalam prediksi');
        } finally {
            setLoading(false);
        }
    };

    const predictClass = async () => {
        if (!selectedMapel) {
            alert('Pilih mata pelajaran terlebih dahulu');
            return;
        }

        setLoading(true);
        try {
            const tipeParam = selectedTipeNilai ? `?tipeNilaiId=${selectedTipeNilai}` : '';
            const response = await fetch(`/api/prediction/trends/mapel/${selectedMapel}${tipeParam}`);
            const data = await response.json();
            
            if (data.success) {
                setClassTrends(data.data);
            } else {
                alert(data.message);
                setClassTrends(null);
            }
        } catch (error) {
            console.error('Error predicting class:', error);
            alert('Error dalam prediksi kelas');
        } finally {
            setLoading(false);
        }
    };

    const getTrendColor = (trend) => {
        switch (trend) {
            case 'Meningkat': return '#4CAF50';
            case 'Menurun': return '#f44336';
            case 'Stabil': return '#FF9800';
            default: return '#9E9E9E';
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 80) return '#4CAF50';
        if (confidence >= 60) return '#FF9800';
        return '#f44336';
    };

    return (
        <div className="prediction-dashboard">
            <h2>🔮 Sistem Prediksi Nilai Siswa</h2>
            
            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button 
                    className={activeTab === 'individual' ? 'active' : ''}
                    onClick={() => setActiveTab('individual')}
                >
                    Prediksi Individual
                </button>
                <button 
                    className={activeTab === 'class' ? 'active' : ''}
                    onClick={() => setActiveTab('class')}
                >
                    Analisis Kelas
                </button>
            </div>

            {/* Selection Panel */}
            <div className="selection-panel">
                {activeTab === 'individual' && (
                    <div className="form-group">
                        <label>Pilih Siswa:</label>
                        <select 
                            value={selectedStudent} 
                            onChange={(e) => setSelectedStudent(e.target.value)}
                        >
                            <option value="">-- Pilih Siswa --</option>
                            {students.map(student => (
                                <option key={student.id_siswa} value={student.id_siswa}>
                                    {student.nama_siswa}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label>Pilih Mata Pelajaran:</label>
                    <select 
                        value={selectedMapel} 
                        onChange={(e) => setSelectedMapel(e.target.value)}
                    >
                        <option value="">-- Pilih Mata Pelajaran --</option>
                        {mapel.map(mp => (
                            <option key={mp.id_mapel} value={mp.id_mapel}>
                                {mp.nama_mapel}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Tipe Nilai (Opsional):</label>
                    <select 
                        value={selectedTipeNilai} 
                        onChange={(e) => setSelectedTipeNilai(e.target.value)}
                    >
                        <option value="">-- Semua Tipe --</option>
                        {tipeNilai.map(tn => (
                            <option key={tn.id_tipe_nilai} value={tn.id_tipe_nilai}>
                                {tn.nama_tipe}
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={activeTab === 'individual' ? predictIndividual : predictClass}
                    disabled={loading || !selectedMapel}
                    className="predict-button"
                >
                    {loading ? 'Memproses...' : activeTab === 'individual' ? 'Prediksi Individual' : 'Analisis Kelas'}
                </button>
            </div>

            {/* Individual Prediction Results */}
            {activeTab === 'individual' && prediction && (
                <div className="prediction-results">
                    <div className="student-info">
                        <h3>📊 Hasil Prediksi untuk {prediction.studentInfo.nama}</h3>
                        <p><strong>Mata Pelajaran:</strong> {prediction.studentInfo.mapel}</p>
                        <p><strong>Tipe Nilai:</strong> {prediction.studentInfo.tipeNilai}</p>
                    </div>

                    <div className="prediction-cards">
                        <div className="prediction-card main-prediction">
                            <h4>🎯 Prediksi Nilai Berikutnya</h4>
                            <div className="prediction-value">{prediction.prediction.nilaiPrediksi}</div>
                            <div className="trend" style={{ color: getTrendColor(prediction.prediction.trend) }}>
                                Trend: {prediction.prediction.trend}
                            </div>
                            <div className="confidence" style={{ color: getConfidenceColor(prediction.prediction.confidence) }}>
                                Akurasi: {prediction.prediction.akurasi}
                            </div>
                        </div>

                        <div className="prediction-card analysis">
                            <h4>📈 Analisis Data</h4>
                            <div className="analysis-item">
                                <span>Jumlah Data:</span>
                                <span>{prediction.analysis.jumlahData}</span>
                            </div>
                            <div className="analysis-item">
                                <span>Nilai Terakhir:</span>
                                <span>{prediction.analysis.nilaiTerakhir}</span>
                            </div>
                            <div className="analysis-item">
                                <span>Rata-rata:</span>
                                <span>{prediction.analysis.rataRata}</span>
                            </div>
                            <div className="analysis-item">
                                <span>Tertinggi:</span>
                                <span>{prediction.analysis.nilaiTertinggi}</span>
                            </div>
                            <div className="analysis-item">
                                <span>Terendah:</span>
                                <span>{prediction.analysis.nilaiTerendah}</span>
                            </div>
                        </div>
                    </div>

                    <div className="historical-data">
                        <h4>📋 Data Historis</h4>
                        <div className="history-list">
                            {prediction.historicalData.map((data, index) => (
                                <div key={index} className="history-item">
                                    <span className="date">{data.tanggal_input}</span>
                                    <span className="type">{data.nama_tipe}</span>
                                    <span className="value">{data.nilai}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Class Trends Results */}
            {activeTab === 'class' && classTrends && (
                <div className="class-trends-results">
                    <div className="class-info">
                        <h3>📊 Analisis Tren Kelas - {classTrends.mapelInfo}</h3>
                        <p><strong>Total Siswa:</strong> {classTrends.totalStudents}</p>
                    </div>

                    <div className="class-summary">
                        <div className="summary-card">
                            <h4>📈 Rata-rata Prediksi</h4>
                            <div className="summary-value">{classTrends.classAverage.prediksiRataRata}</div>
                            <div className="summary-detail">Akurasi: {classTrends.classAverage.akurasiRataRata}%</div>
                        </div>

                        <div className="summary-card">
                            <h4>🎯 Trend Dominan</h4>
                            <div className="summary-value" style={{ color: getTrendColor(classTrends.classAverage.trendDominan) }}>
                                {classTrends.classAverage.trendDominan}
                            </div>
                        </div>

                        <div className="trend-distribution">
                            <h4>📊 Distribusi Trend</h4>
                            <div className="trend-item">
                                <span>📈 Meningkat:</span>
                                <span>{classTrends.classTrends.meningkat} siswa</span>
                            </div>
                            <div className="trend-item">
                                <span>📉 Menurun:</span>
                                <span>{classTrends.classTrends.menurun} siswa</span>
                            </div>
                            <div className="trend-item">
                                <span>➡️ Stabil:</span>
                                <span>{classTrends.classTrends.stabil} siswa</span>
                            </div>
                        </div>
                    </div>

                    <div className="student-predictions">
                        <h4>👥 Prediksi Per Siswa</h4>
                        <div className="predictions-list">
                            {classTrends.predictions.map((pred, index) => (
                                <div key={index} className="student-prediction-item">
                                    <div className="student-name">{pred.studentInfo.nama}</div>
                                    <div className="prediction-details">
                                        <span className="predicted-value">{pred.prediction.nilaiPrediksi}</span>
                                        <span 
                                            className="trend-indicator"
                                            style={{ color: getTrendColor(pred.prediction.trend) }}
                                        >
                                            {pred.prediction.trend}
                                        </span>
                                        <span 
                                            className="confidence-indicator"
                                            style={{ color: getConfidenceColor(pred.prediction.confidence) }}
                                        >
                                            {pred.prediction.confidence}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionDashboard;
