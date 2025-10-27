// Establish Database Connection
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: {rejectUnauthorized: false}
});

pool.connect()
    .then(() => console.log('Connected to database'))
    .catch((err) => console.error('Database connection error: ', err));

module.exports = pool;