require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Import Routes
const uploadRoute = require('./routes/upload');
const historyRoute = require('./routes/history');
const authRoute = require('./routes/auth');
const rewriteRoute = require('./routes/rewrite');
const plagiarismRoute = require('./routes/plagiarism');
const humanizeRoute = require('./routes/humanize');

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// API Routes
app.use('/api/auth', authRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/history', historyRoute);
app.use('/api/rewrite', rewriteRoute);
app.use('/api/plagiarism', plagiarismRoute);
app.use('/api/humanize', humanizeRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
