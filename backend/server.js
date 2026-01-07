require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');               // Import HTTP
const { Server } = require("socket.io");    // Import Socket.io

// Import Routes
const uploadRoutes = require('./routes/upload');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const evidenceRoutes = require('./routes/evidence'); 

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. Create the HTTP Server ---
// We wrap Express so we can attach the Socket engine to it
const server = http.createServer(app);

// --- 2. Initialize Socket.io ---
const io = new Server(server, {
  cors: {
    // Allow both your Vite (5173) and React default (3000) ports
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// --- 3. Socket Event Listeners ---
io.on('connection', (socket) => {
  console.log(`⚡ Neural Uplink Established: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log('❌ Uplink Severed');
  });
});

// --- 4. Make 'io' Accessible to Routes ---
// This lets you use req.app.get('io').emit(...) inside your upload route
app.set('io', io);

// --- Middleware ---
app.use(helmet());
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/evidence', evidenceRoutes); // <--- ADD THIS

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// --- DB Connection ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- 5. IMPORTANT: Listen on 'server', not 'app' ---
server.listen(PORT, () => {
    console.log(`🚀 Gateway & Neural Stream Active on Port ${PORT}`);
});