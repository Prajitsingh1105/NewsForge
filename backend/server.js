require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');

const app = express();

// ======================
// 🔥 Ensure uploads folder exists
// ======================
const uploadPath = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('📁 uploads folder created');
}

// ======================
// Middleware
// ======================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// Static files (images)
// ======================
app.use('/uploads', express.static(uploadPath));

// ======================
// Routes
// ======================
app.use('/api/admin', authRoutes);
app.use('/api/blogs', blogRoutes);

// ======================
// Health check
// ======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'NewsForge API running',
    timestamp: new Date()
  });
});

// ======================
// MongoDB Connection
// ======================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newsforge')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`🚀 NewsForge API running on port ${PORT}`);
});