const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'veritas_secret_key_change_in_prod';

// REGISTER (Create a new investigator)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Check if user exists
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const user = new User({ username, password, role });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN (Issue a Secure Cookie)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 1. Find User
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // 2. Check Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // 3. Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 4. Send as HttpOnly Cookie (Invisible to JavaScript attacks)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in prod
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    res.json({ 
      message: 'Login successful', 
      user: { username: user.username, role: user.role } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// CHECK STATUS (For frontend to know if logged in)
router.get('/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: decoded });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;