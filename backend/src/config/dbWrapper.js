// backend/src/config/dbWrapper.js
// Smart wrapper that makes SQLite callbacks work with MySQL promises
require('dotenv').config();
const { queryAll, queryOne, queryRun } = require('./dbAdapter');
const { getDb } = require('./db');

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

/**
 * Smart getDb() that returns a wrapper object with both callback and promise methods
 * This allows existing SQLite code to work without modification
 */
function getDbWrapper() {
    if (DB_TYPE === 'mysql') {
        // Return a MySQL-compatible wrapper that mimics SQLite's callback API
        return {
            all: (sql, params, callback) => {
                queryAll(sql, params)
                    .then(rows => callback(null, rows))
                    .catch(err => callback(err));
            },
            get: (sql, params, callback) => {
                queryOne(sql, params)
                    .then(row => callback(null, row))
                    .catch(err => callback(err));
            },
            run: function(sql, params, callback) {
                queryRun(sql, params)
                    .then(result => {
                        // Mimic SQLite's 'this' context
                        const context = {
                            lastID: result.insertId,
                            changes: result.changes
                        };
                        if (callback) callback.call(context, null);
                    })
                    .catch(err => {
                        if (callback) callback(err);
                    });
            }
        };
    } else {
        // Return actual SQLite db
        return getDb();
    }
}

module.exports = {
    getDb: getDbWrapper
};
