const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Load appropriate .env before anything uses process.env
(() => {
  const env = process.env.NODE_ENV;
  const envFile = env === 'production' ? '.env.production' : '.env.development';
  const candidates = [
    path.join(__dirname, envFile),      // server/.env.production | .env.development
    path.join(__dirname, '.env'),       // server/.env
    path.join(__dirname, '..', '.env'), // project root .env
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
})();

const cors = require('cors');
const pool = require('./database');

const app = express();
const port = process.env.PORT || 8080;

// allow frontend requests access to backend
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
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

const manager = require('./routes/manager');
app.use('/api/manager', manager);


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
