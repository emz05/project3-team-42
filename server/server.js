const dotenv = require('dotenv');
const express = require('express');
const path = require('path');

// Load env files FIRST, before requiring database
// Load env files with absolute paths so running from repo root works.
if (process.env.NODE_ENV !== 'production') {
    const devEnvPath = path.join(__dirname, '.env.development');
    dotenv.config({ path: devEnvPath });
} else {
    // In production, try loading server/.env.production only if variables aren't already provided
    if (!process.env.PSQL_HOST) {
        const prodEnvPath = path.join(__dirname, '.env.production');
        dotenv.config({ path: prodEnvPath });
    }
}

// NOW require database after env vars are loaded
const cors = require('cors');
const pool = require('./database');
const pendingOrdersRoutes = require('./routes/pendingOrders');
const { webhookHandler } = require('./routes/payments');

const app = express();
const port = process.env.PORT || 8080;

// allow frontend requests access to backend
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL 
        : true, // Allow all origins in development
    credentials: true
};
app.use(cors(corsOptions));

app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    webhookHandler
);

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

const inventoryRoutes = require('./routes/inventory');
app.use('/api/inventory', inventoryRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

const employeeRoutes = require('./routes/employee');
app.use('/api/employees', employeeRoutes);

const manager = require('./routes/manager');
app.use('/api/manager', manager);

const translation = require('./routes/translation');
app.use('/api/translate', translation);

app.use('/api/pending-orders', pendingOrdersRoutes);


// Add process hook to shutdown pool
if(process.env.NODE_ENV === 'production'){
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
}

app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 as ok');
    res.json({
      status: 'ok',
      db: rows[0].ok === 1,
      env: process.env.NODE_ENV
    });
  } catch (e) {
    res.status(500).json({ status: 'db_error', error: e.message });
  }
});


app.listen(port, () =>{
    console.log(`Server running in ${process.env.NODE_ENV} mode at http://localhost:${port}`);
});

module.exports = app;
