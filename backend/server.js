require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', require('./src/routes/student'));
app.use('/api/student/classrooms', require('./src/routes/student-classrooms'));
app.use('/api/teacher', require('./src/routes/teacher'));

// Teacher Portal Routes
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/materials', require('./src/routes/materials'));
app.use('/api/assignments', require('./src/routes/assignments'));
app.use('/api/classrooms', require('./src/routes/classrooms'));
app.use('/api/submissions', require('./src/routes/submissions'));
app.use('/api/ai-assistant', require('./src/routes/ai-assistant'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/doubts', require('./src/routes/doubts'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});