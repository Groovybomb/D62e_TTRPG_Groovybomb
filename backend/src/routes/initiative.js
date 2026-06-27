import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function ensureCollection() {
  if (!db.data.initiative) db.data.initiative = [];
}

// POST /api/initiative - Add initiative entry
router.post('/', async (req, res) => {
  ensureCollection();
  const { characterId, characterName, total, diceResults, isNPC, isVehicle } = req.body;

  if (!characterName) {
    return res.status(400).json({ error: 'characterName required' });
  }

  const entry = {
    id: generateId(),
    characterId: characterId || null,
    characterName,
    total: total || 0,
    diceResults: diceResults || [],
    isNPC: isNPC || false,
    isVehicle: isVehicle || false,
    createdAt: new Date().toISOString(),
  };

  db.data.initiative.push(entry);
  db.data.initiative.sort((a, b) => b.total - a.total);
  await db.write();

  res.status(201).json(entry);
});

// GET /api/initiative - Get all entries sorted by total desc
router.get('/', async (req, res) => {
  ensureCollection();
  const sorted = [...db.data.initiative].sort((a, b) => b.total - a.total);
  res.json(sorted);
});

// DELETE /api/initiative - Clear all
router.delete('/', async (req, res) => {
  ensureCollection();
  db.data.initiative = [];
  await db.write();
  res.json({ message: 'Initiative cleared' });
});

// DELETE /api/initiative/:id - Remove one entry
router.delete('/:id', async (req, res) => {
  ensureCollection();
  const index = db.data.initiative.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Entry not found' });

  db.data.initiative.splice(index, 1);
  await db.write();
  res.json({ message: 'Entry removed' });
});

export default router;
