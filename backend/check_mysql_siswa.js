// Check MySQL Siswa table schema
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: process.env.MYSQL_PASSWORD || 'my-Admin',
        database: 'sinfomik_db'
    });

    console.log('=== Siswa Table Schema ===');
    const [columns] = await connection.execute('DESCRIBE Siswa');
    console.table(columns);

    console.log('\n=== Sample Data ===');
    const [rows] = await connection.execute('SELECT * FROM Siswa LIMIT 2');
    console.table(rows);

    await connection.end();
}

checkSchema().catch(console.error);
