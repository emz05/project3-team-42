const dotenv = require('dotenv');
const express = require('express');

// load .env.development for locally runs, skip dotenv when Render runs
if(process.env.NODE_ENV !== 'production'){ dotenv.config({path: '.env.development' }); }

const cors = require('cors');
const pool = require('./database');

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
    console.log('\nReceived SIGINT, shutting down gracefully...');
    try {
        await pool.end();
        console.log('Database pool closed');
    } catch (err) {
        console.error('Error closing pool:', err);
    }
    process.exit(0);
});

app.listen(port, () =>{
    console.log(`Server running in ${process.env.NODE_ENV} mode at http://localhost:${port}`);
});

module.exports = app;
