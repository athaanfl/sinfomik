// backend/src/config/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Tentukan path absolut ke file database
// Support untuk Azure persistent storage
const DB_FILE = process.env.DB_PATH || path.resolve(__dirname, '../../academic_dashboard.db');

// Pastikan direktori database ada
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db;
let isInitialized = false;

function connectDb() {
    const isNewDb = !fs.existsSync(DB_FILE);
    
    // Gunakan sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE untuk membaca/menulis dan membuat jika tidak ada
    db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error('Error connecting to database:', err.message);
        } else {
            console.log('Connected to the SQLite database at:', DB_FILE);
            // Aktifkan foreign key support
            db.run("PRAGMA foreign_keys = ON", (err) => {
                if (err) {
                    console.error("Error enabling foreign keys:", err.message);
                } else {
                    console.log("Foreign keys enabled.");
                    
                    // Auto-initialize database if it's new or empty
                    if (isNewDb && !isInitialized) {
                        console.log('🔧 New database detected. Running initialization...');
                        isInitialized = true;
                        const initDb = require('../init_db');
                        // init_db.js exports a function that initializes the database
                        if (typeof initDb === 'function') {
                            initDb();
                        }
                    }
                }
            });
        }
    });
    return db;
}

function getDb() {
    if (!db) {
        connectDb();
    }
    return db;
}

module.exports = {
    connectDb,
    getDb
};
