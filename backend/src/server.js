// backend/src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv'); // Import dotenv untuk membaca .env
const { connectDb } = require('./config/db'); // Import fungsi koneksi DB
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const guruRoutes = require('./routes/guruRoutes');
const excelRoutes = require('./routes/excelRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const kkmRoutes = require('./routes/kkmRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Muat variabel lingkungan dari file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Gunakan port dari .env atau default 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ===============================
// SECURITY MIDDLEWARE
// ===============================

// 1. Helmet - Set security HTTP headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable untuk development, enable di production
    crossOriginEmbedderPolicy: false
}));

// 2. CORS - Configure properly untuk specific origin
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

// 3. Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: true, // Don't count successful requests
});

// 4. Body parser with size limits
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Koneksi ke database saat aplikasi dimulai
connectDb();

// ===============================
// ROUTES
// ===============================

// Auth routes with stricter rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Protected routes (will add auth middleware in routes files)
app.use('/api/admin', adminRoutes);
app.use('/api/guru', guruRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/kkm', kkmRoutes);
app.use('/api/analytics', analyticsRoutes);

// Route dasar untuk menguji server
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Sistem Manajemen Akademik Berjalan!',
        version: '1.0.0',
        security: 'hardened',
        status: 'healthy'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({ 
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`🔒 Security: ENABLED (Helmet, Rate Limit, CORS)`);
    console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
