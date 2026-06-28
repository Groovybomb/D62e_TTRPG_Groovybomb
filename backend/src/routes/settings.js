import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/settings — get game settings
router.get('/', async (req, res) => {
  const result = await db.execute('SELECT key, value FROM game_settings');
  const settings = {};
  for (const row of result.rows) {
    settings[row.key] = row.value != null ? JSON.parse(row.value) : null;
  }
  res.json(settings);
});

// PATCH /api/settings — update game settings
router.patch('/', async (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    await db.execute({
      sql: 'INSERT INTO game_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      args: [key, JSON.stringify(value), JSON.stringify(value)],
    });
  }

  const result = await db.execute('SELECT key, value FROM game_settings');
  const settings = {};
  for (const row of result.rows) {
    settings[row.key] = row.value != null ? JSON.parse(row.value) : null;
  }
  res.json(settings);
});

export default router;
