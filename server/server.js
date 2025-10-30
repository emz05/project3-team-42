const express = require('express');
const cors = require('cors');
const pool = require('./database');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const envFileName = `.env.development.${env}`;

require('dotenv').config({
    path: path.resolve(__dirname, envFileName)
});

const app = express();
const port = process.env.PORT || 8080;

// allow frontend requests access to backend
const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());

// logging calls middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});


/*const entry = require('./routes/entry');
app.use('/', entry);*/

const cashier = require('./routes/cashier');
app.use('/api/cashier', cashier);


// Add process hook to shutdown pool
process.on('SIGINT', async() => {
    await pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});

app.listen(port, () =>{
    console.log(`Server running in ${process.env.NODE_ENV} mode at http://localhost:${port}`);
});

module.exports = app;
