// backend/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv'); // Import dotenv untuk membaca .env
const { connectDb } = require('./config/db'); // Import fungsi koneksi DB
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const guruRoutes = require('./routes/guruRoutes');

// Muat variabel lingkungan dari file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Gunakan port dari .env atau default 5000

// Middleware
app.use(cors()); // Mengizinkan permintaan lintas asal dari frontend
app.use(express.json()); // Mengizinkan Express membaca body permintaan JSON

// Koneksi ke database saat aplikasi dimulai
connectDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guru', guruRoutes);

// Route dasar untuk menguji server
app.get('/', (req, res) => {
    res.send('API Sistem Manajemen Akademik Berjalan!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
