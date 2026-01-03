require('dotenv').config();
const uploadRoutes = require('./routes/upload');
const reportRoutes = require('./routes/reports');
const cookieParser = require('cookie-parser'); 
const authRoutes = require('./routes/auth');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000'], 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// DB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});