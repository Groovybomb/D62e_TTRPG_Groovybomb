import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/settings — get game settings
router.get('/', async (req, res) => {
  res.json(db.data.gameSettings || { maxDice: null });
});

// PATCH /api/settings — update game settings
router.patch('/', async (req, res) => {
  db.data.gameSettings = { ...db.data.gameSettings, ...req.body };
  await db.write();
  res.json(db.data.gameSettings);
});

export default router;
