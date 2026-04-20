require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serves your HTML/JS

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/securelogin')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// --- 1. REGISTER ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- 2. LOGIN ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Update stats
        user.loginCount += 1;
        user.loginHistory.push({ ip: req.ip || 'Unknown' });
        await user.save();

        // Create JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1h' });
        
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- 3. FORGOT PASSWORD ---
app.post('/api/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // In a real app, send an email here. For now, we mock it:
        console.log(`Password reset link: http://localhost:3000/reset-password.html?token=${resetToken}`);
        
        res.json({ message: "Password reset link generated (Check console)" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- 4. RESET PASSWORD ---
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ 
            resetPasswordToken: token, 
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- 5. DASHBOARD DATA (Protected Route) ---
app.get('/api/user-data', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
        
        const user = await User.findById(decoded.id).select('-password'); // Don't send password back!
        res.json({ success: true, user });
    } catch (error) {
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
});

// Export the Express API for Vercel
module.exports = app;
// Triggering Vercel deployment