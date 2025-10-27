const express = require('express');
const pool = require('./database');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(express.json());
const port = process.env.PORT;


// Add process hook to shutdown pool
process.on('SIGINT', async() => {
    await pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});

app.get('/', (req, res) => {
    const data = {name: 'Mario'};
    res.json(data);
});

app.listen(port, () =>{
    console.log(`Server running at http://localhost:${port}`)
});
