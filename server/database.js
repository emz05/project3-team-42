/*
database connection
 */
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: parseInt(process.env.PSQL_PORT, 10) || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('Connected to database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;
