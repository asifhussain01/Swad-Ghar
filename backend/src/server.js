require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB Atlas
connectDB();

// Initialize Socket.IO
initSocket(server);

// Security & Utility Middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*', // Allows mobile devices (Expo) & web dashboards
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global API Rate Limiter
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'SwadGhar Shared API Gateway',
    timestamp: new Date().toISOString(),
    database: 'MongoDB Atlas',
    paymentMethod: 'COD Only',
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found on SwadGhar API.`,
  });
});

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SwadGhar Shared Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO Real-Time Alerts active`);
  console.log(`🛡️  Cash on Delivery (COD) mode strictly enforced`);
  console.log(`======================================================\n`);
});

module.exports = { app, server };
