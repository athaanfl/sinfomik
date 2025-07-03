// backend/src/controllers/authController.js
const { getDb } = require('../config/db');
const { createHash } = require('crypto'); // Untuk hashing SHA256 (sesuai data dummy Python)
// const bcrypt = require('bcryptjs'); // Untuk membandingkan hash password (jika menggunakan bcrypt)
// const jwt = require('jsonwebtoken'); // Akan digunakan untuk JWT
// const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Kunci rahasia JWT

// Helper untuk hashing password (sesuai dengan yang digunakan di Python hashlib.sha256)
function hashPasswordPythonStyle(password) {
    return createHash('sha256').update(password).digest('hex');
}

exports.login = (req, res) => {
    const { username, password, user_type } = req.body;
    const db = getDb();

    let tableName;
    let usernameField;
    let idField;
    let nameField;

    switch (user_type) {
        case 'admin':
            tableName = 'Admin';
            usernameField = 'username';
            idField = 'id_admin';
            nameField = 'nama';
            break;
        case 'guru':
            tableName = 'Guru';
            usernameField = 'username';
            idField = 'id_guru';
            nameField = 'nama_guru';
            break;
        case 'siswa':
            tableName = 'Siswa';
            usernameField = 'nama_siswa'; // Untuk siswa, username adalah nama_siswa
            idField = 'id_siswa';
            nameField = 'nama_siswa';
            break;
        default:
            return res.status(400).json({ message: 'Tipe pengguna tidak valid.' });
    }

    const query = `SELECT ${idField}, ${nameField}, password_hash FROM ${tableName} WHERE ${usernameField} = ?`;

    db.get(query, [username], async (err, user) => {
        if (err) {
            console.error('Database error during login:', err.message);
            return res.status(500).json({ message: 'Terjadi kesalahan server.' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        // Bandingkan password yang diinput dengan hash yang tersimpan
        // Karena data dummy dari Python menggunakan hashlib.sha256, kita akan hash input password
        // dengan cara yang sama untuk perbandingan.
        const isPasswordValid = hashPasswordPythonStyle(password) === user.password_hash;

        // Jika Anda telah mengganti hashing di data dummy dengan bcrypt:
        // const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        // Jika login berhasil
        // Anda bisa membuat JWT di sini untuk otentikasi yang lebih aman
        // const token = jwt.sign(
        //     { id: user[idField], type: user_type, username: user[nameField] },
        //     SECRET_KEY,
        //     { expiresIn: '1h' }
        // );

        res.status(200).json({
            success: true,
            message: 'Login berhasil!',
            user: {
                id: user[idField],
                username: user[nameField],
                type: user_type
            },
            // token: token // Kirim token JWT
        });
    });
};
