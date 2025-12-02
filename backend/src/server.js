// backend/src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv'); // Import dotenv untuk membaca .env
const path = require('path');
const { connectDb } = require('./config/db'); // SQLite connector
const { connectMySQLDb } = require('./config/mysql'); // MySQL connector
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
// In production, if frontend is served from same domain, allow same origin
// In development, allow localhost:3000
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [FRONTEND_URL, 'https://*.railway.app'] // Allow Railway domains
        : ['http://localhost:3000', 'http://localhost:3001'], // Development
    credentials: true,
    exposedHeaders: ['Content-Disposition']
};

app.use(cors(corsOptions));

// 3. Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // Limit each IP to 500 requests per windowMs (development)
    message: {
        error: 'Too many requests',
        message: 'Anda telah mencapai batas request. Silakan tunggu beberapa saat sebelum mencoba lagi.',
        retryAfter: '15 menit'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'Anda telah mencapai batas request. Silakan tunggu beberapa saat sebelum mencoba lagi.',
            retryAfter: '15 menit'
        });
    }
});

// Apply rate limiting only to API routes (avoid counting static asset reloads)
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 100, // 100 untuk development, 10 untuk production
    message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
    skipSuccessfulRequests: true, // Don't count successful requests
});

// 4. Body parser with size limits
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Koneksi ke database saat aplikasi dimulai
if ((process.env.DB_TYPE || 'sqlite').toLowerCase() === 'mysql') {
    connectMySQLDb().catch(err => {
        console.error('Failed to connect MySQL:', err);
        process.exit(1);
    });
} else {
    connectDb();
}

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

// Health check endpoint (before static files)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes check
app.get('/api', (req, res) => {
    res.json({ 
        message: 'API Sistem Manajemen Akademik Berjalan!',
        version: '1.0.0',
        security: 'hardened',
        status: 'healthy'
    });
});

// ===============================
// SERVE FRONTEND IN PRODUCTION
// ===============================
if (process.env.NODE_ENV === 'production') {
    // Serve static files from React build
    const frontendBuildPath = path.join(__dirname, '../../frontend/build');
    app.use(express.static(frontendBuildPath));
    
    // Handle React routing - return index.html for all non-API routes
    app.get('*', (req, res) => {
        // Skip if it's an API route
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
} else {
    // Development mode - just return API info
    app.get('/', (req, res) => {
        res.json({ 
            message: 'API Sistem Manajemen Akademik Berjalan!',
            version: '1.0.0',
            security: 'hardened',
            status: 'healthy',
            mode: 'development'
        });
    });
    
    // 404 handler for development
    app.use((req, res) => {
        res.status(404).json({ message: 'Endpoint not found' });
    });
}

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({ 
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server with graceful EADDRINUSE fallback
function startServer(port, attempt = 0) {
    const srv = app.listen(port, () => {
        console.log(`\n🚀 Server berjalan di http://localhost:${port}`);
        console.log(`🔒 Security: ENABLED (Helmet, Rate Limit, CORS)`);
        console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
    srv.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const nextPort = port + 1;
            if (attempt < 5) {
                console.warn(`⚠️  Port ${port} in use. Mencoba port alternatif: ${nextPort}`);
                startServer(nextPort, attempt + 1);
            } else {
                console.error('❌ Gagal menemukan port kosong setelah beberapa percobaan.');
                process.exit(1);
            }
        } else {
            console.error('❌ Server error:', err);
            process.exit(1);
        }
    });
}

startServer(Number(PORT));
