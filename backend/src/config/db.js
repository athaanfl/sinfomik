// backend/src/config/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Tentukan path absolut ke file database
// Ini penting agar database ditemukan dengan benar terlepas dari direktori kerja
const DB_FILE = path.resolve(__dirname, '../../academic_dashboard.db');

let db;

function connectDb() {
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
