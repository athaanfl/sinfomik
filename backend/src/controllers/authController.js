// backend/src/controllers/authController.js
const { queryOne, queryRun } = require('../config/dbAdapter');
const { createHash } = require('crypto'); // Untuk hashing SHA256 (sesuai data dummy Python)
const bcrypt = require('bcryptjs'); // Untuk membandingkan hash password (jika menggunakan bcrypt)
const jwt = require('jsonwebtoken'); // Untuk JWT authentication
const JWT_SECRET = process.env.JWT_SECRET || 'sinfomik_super_secret_key_2025_change_in_production_please';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper untuk hashing password (sesuai dengan yang digunakan di Python hashlib.sha256)
function hashPasswordPythonStyle(password) {
    return createHash('sha256').update(password).digest('hex');
}

// Helper untuk hashing dengan bcrypt (more secure)
async function hashPasswordBcrypt(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

exports.login = async (req, res) => {
    try {
        const { username, password, user_type } = req.body;

        let tableName;
        let usernameField;
        let idField;
        let nameField;

        if (user_type === 'siswa') {
            return res.status(400).json({ message: 'Role siswa tidak memiliki akses login.' });
        }

        switch (user_type) {
            case 'admin':
                tableName = 'Admin';
                usernameField = 'username';
                idField = 'id_admin';
                nameField = 'nama_admin';
                break;
            case 'guru':
                tableName = 'Guru';
                usernameField = 'username';
                idField = 'id_guru';
                nameField = 'nama_guru';
                break;
            default:
                return res.status(400).json({ message: 'Tipe pengguna tidak valid.' });
        }

        const query = `SELECT ${idField}, ${nameField}, password FROM ${tableName} WHERE ${usernameField} = ?`;
        const user = await queryOne(query, [username]);

        if (!user) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        // Bandingkan password - support both SHA256 (legacy) and bcrypt
        let isPasswordValid = false;
        const storedPassword = user.password || user.password_hash;
        
        // Try bcrypt first (if password was hashed with bcrypt)
        if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
            isPasswordValid = await bcrypt.compare(password, storedPassword);
        } else {
            // Fallback to SHA256 for legacy passwords
            isPasswordValid = hashPasswordPythonStyle(password) === storedPassword;
            
            // If SHA256 worked, upgrade to bcrypt for better security
            if (isPasswordValid) {
                const newHash = await hashPasswordBcrypt(password);
                const updateQuery = `UPDATE ${tableName} SET password = ? WHERE ${idField} = ?`;
                await queryRun(updateQuery, [newHash, user[idField]]);
                console.log(`✅ Password upgraded to bcrypt for ${user_type}: ${user[nameField]}`);
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user[idField], 
                user_type: user_type, 
                nama: user[nameField] 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            success: true,
            message: 'Login berhasil!',
            user: {
                id: user[idField],
                username: user[nameField],
                type: user_type
            },
            token: token // JWT token untuk authentication
        });
    } catch (err) {
        console.error('Database error during login:', err.message);
        return res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};
