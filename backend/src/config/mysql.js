// backend/src/config/mysql.js
const mysql = require('mysql2/promise');
// Ensure environment variables are loaded even if server loads dotenv later
try { require('dotenv').config(); } catch {}

// MySQL Connection Pool Configuration
const poolConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'sinfomik_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

let pool;

async function connectMySQLDb() {
    try {
        pool = mysql.createPool(poolConfig);
        
        // Test connection
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database successfully!');
        console.log('Database:', poolConfig.database);
        console.log('User:', poolConfig.user);
        connection.release();
        
        return pool;
    } catch (err) {
        console.error('Error connecting to MySQL database:', err.message);
        console.error('Effective MySQL config (host, port, user, hasPassword):', {
            host: poolConfig.host,
            port: poolConfig.port,
            user: poolConfig.user,
            hasPassword: !!poolConfig.password
        });
        throw err;
    }
}

function getMySQLPool() {
    if (!pool) {
        throw new Error('MySQL pool not initialized. Call connectMySQLDb() first.');
    }
    return pool;
}

async function closeMySQLDb() {
    if (pool) {
        await pool.end();
        console.log('MySQL connection pool closed.');
    }
}

module.exports = {
    connectMySQLDb,
    getMySQLPool,
    closeMySQLDb
};
