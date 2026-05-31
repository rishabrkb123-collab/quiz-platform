require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const questionsRoutes = require('./routes/questionsRoutes');
const answersRoutes = require('./routes/answersRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const debugRoutes = require('./routes/debugRoutes');
const { addDebugLog, debugRequestMiddleware } = require('./debugLogger');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(debugRequestMiddleware);

app.get('/health', (_req, res) => {
  addDebugLog('controller', 'healthController.check()');
  res.json({ status: 'ok', service: 'quiz-platform-backend' });
});

app.use('/auth', authRoutes);
app.use('/questions', questionsRoutes);
app.use('/answers', answersRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/debug', debugRoutes);

app.use((req, res) => {
  addDebugLog('error', `404 route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'route not found' });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = status === 500 ? 'internal server error' : error.message;

  addDebugLog('error', `${status} ${message}`);
  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ error: message });
});

module.exports = app;
