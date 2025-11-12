// backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sinfomik_super_secret_key_2025_change_in_production_please';

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
    // Get token from header
    const token = req.headers['authorization']?.split(' ')[1]; // Expected format: "Bearer <token>"
    
    if (!token) {
        return res.status(401).json({ 
            message: 'Access denied. No token provided.',
            requiresAuth: true 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Add user info to request
        req.user = {
            id: decoded.id,
            user_type: decoded.user_type,
            nama: decoded.nama
        };
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token has expired. Please login again.',
                requiresAuth: true,
                tokenExpired: true
            });
        }
        
        return res.status(403).json({ 
            message: 'Invalid token.',
            requiresAuth: true
        });
    }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.user_type === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            message: 'Access denied. Admin privileges required.' 
        });
    }
};

// Middleware to check if user is guru
exports.isGuru = (req, res, next) => {
    if (req.user && req.user.user_type === 'guru') {
        next();
    } else {
        return res.status(403).json({ 
            message: 'Access denied. Guru privileges required.' 
        });
    }
};

// Middleware to check if user is admin or guru
exports.isAdminOrGuru = (req, res, next) => {
    if (req.user && (req.user.user_type === 'admin' || req.user.user_type === 'guru')) {
        next();
    } else {
        return res.status(403).json({ 
            message: 'Access denied. Admin or Guru privileges required.' 
        });
    }
};
