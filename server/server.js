const express = require('express');
const cors = require('cors');
const pool = require('./database');
require('dotenv').config({ path: '../.env' });


const app = express();
const port = 8081;

// allow frontend requests access to backend
const corsOptions = { origin: "http://localhost:5173", };
app.use(cors(corsOptions));

app.use(express.json());

// error middleware
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
    console.log(`Server running at http://localhost:${port}`)
});

module.exports = app;
