// backend/src/config/dbAdapter.js
// Universal Database Adapter - supports both SQLite and MySQL
require('dotenv').config();
const { getMySQLPool } = require('./mysql');
const { getDb } = require('./db');

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

/**
 * Execute a SELECT query that returns multiple rows
 * @param {string} sql - SQL query with ? placeholders
 * @param {array} params - Parameters for the query
 * @returns {Promise<array>} - Array of result rows
 */
async function queryAll(sql, params = []) {
    if (DB_TYPE === 'mysql') {
        const pool = getMySQLPool();
        const [rows] = await pool.query(sql, params);
        return rows;
    } else {
        const db = getDb();
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }
}

/**
 * Execute a SELECT query that returns a single row
 * @param {string} sql - SQL query with ? placeholders
 * @param {array} params - Parameters for the query
 * @returns {Promise<object|null>} - Single result row or null
 */
async function queryOne(sql, params = []) {
    if (DB_TYPE === 'mysql') {
        const pool = getMySQLPool();
        const [rows] = await pool.query(sql, params);
        return rows[0] || null;
    } else {
        const db = getDb();
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }
}

/**
 * Execute an INSERT/UPDATE/DELETE query
 * @param {string} sql - SQL query with ? placeholders
 * @param {array} params - Parameters for the query
 * @returns {Promise<object>} - { insertId, affectedRows, changes }
 */
async function queryRun(sql, params = []) {
    if (DB_TYPE === 'mysql') {
        const pool = getMySQLPool();
        const [result] = await pool.query(sql, params);
        return {
            insertId: result.insertId,
            affectedRows: result.affectedRows,
            changes: result.affectedRows
        };
    } else {
        const db = getDb();
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({
                    insertId: this.lastID,
                    affectedRows: this.changes,
                    changes: this.changes
                });
            });
        });
    }
}

/**
 * Get database type
 * @returns {string} - 'mysql' or 'sqlite'
 */
function getDbType() {
    return DB_TYPE;
}

module.exports = {
    queryAll,
    queryOne,
    queryRun,
    getDbType
};
