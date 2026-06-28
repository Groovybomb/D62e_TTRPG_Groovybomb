import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.js';
import characterRoutes from './routes/characters.js';
import rollRoutes from './routes/rolls.js';
import vehicleRoutes from './routes/vehicles.js';
import messageRoutes from './routes/messages.js';
import gmRollRoutes from './routes/gmRolls.js';
import settingsRoutes from './routes/settings.js';
import initiativeRoutes from './routes/initiative.js';
import opposedRollRoutes from './routes/opposedRolls.js';
import { initDb } from './db.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/rolls', rollRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gm-rolls', gmRollRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/initiative', initiativeRoutes);
app.use('/api/opposed-rolls', opposedRollRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🎲 D62e Backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
