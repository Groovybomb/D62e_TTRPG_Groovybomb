import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function parseRow(row) {
  return {
    ...row,
    diceResults: JSON.parse(row.diceResults || '[]'),
    isNPC: !!row.isNPC,
    isVehicle: !!row.isVehicle,
  };
}

// POST /api/initiative - Add initiative entry
router.post('/', async (req, res) => {
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

  await db.execute({
    sql: 'INSERT INTO initiative (id, characterId, characterName, total, diceResults, isNPC, isVehicle, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [entry.id, entry.characterId, entry.characterName, entry.total, JSON.stringify(entry.diceResults), entry.isNPC ? 1 : 0, entry.isVehicle ? 1 : 0, entry.createdAt],
  });

  res.status(201).json(entry);
});

// GET /api/initiative - Get all entries sorted by total desc
router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM initiative ORDER BY total DESC');
  res.json(result.rows.map(parseRow));
});

// DELETE /api/initiative - Clear all
router.delete('/', async (req, res) => {
  await db.execute('DELETE FROM initiative');
  res.json({ message: 'Initiative cleared' });
});

// DELETE /api/initiative/:id - Remove one entry
router.delete('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT id FROM initiative WHERE id = ?', args: [req.params.id] });
  if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });

  await db.execute({ sql: 'DELETE FROM initiative WHERE id = ?', args: [req.params.id] });
  res.json({ message: 'Entry removed' });
});

export default router;
