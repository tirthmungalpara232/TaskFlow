require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
require('./config/passport'); // registers Google/GitHub strategies if configured
const path = require('path');
const _dirname = path.resolve();
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');

connectDB();

const app = express();
const http = require('http');
const server = http.createServer(app); // wraps express so Socket.io can share the same port
const io = require('./socket/chat')(server);

// Allow the configured frontend origin(s) to call this API
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' })); // raised from the 100kb default to allow base64 profile pictures
app.use(passport.initialize()); // stateless — no express-session needed since we issue our own JWT

// Makes the socket.io instance available inside controllers as req.io, so
// chatController can emit real-time events after saving a message via REST.
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskFlow API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/chat', chatRoutes);
app.use('/api/tasks', taskRoutes);

const fs = require('fs');
const frontendDistPath = path.join(_dirname, 'frontend', 'dist');

// Serve built frontend if running in production or if frontend/dist exists
if (process.env.NODE_ENV === 'production' || fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(frontendDistPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`TaskFlow API running on port ${PORT}`));

