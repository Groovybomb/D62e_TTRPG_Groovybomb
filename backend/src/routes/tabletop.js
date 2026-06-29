import express from 'express';
import db from '../db.js';

const router = express.Router();

const GRID_SIZE = 30;
const emptyGrid = () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

router.get('/', async (req, res) => {
  const result = await db.execute("SELECT * FROM tabletop WHERE id = 'shared'");
  if (result.rows.length === 0) {
    return res.json({ grid: emptyGrid(), tokens: [], updatedAt: null });
  }
  const row = result.rows[0];
  res.json({
    grid: JSON.parse(row.grid || '[]'),
    tokens: JSON.parse(row.tokens || '[]'),
    updatedAt: row.updatedAt,
  });
});

router.put('/', async (req, res) => {
  const { grid, tokens } = req.body;
  const updatedAt = new Date().toISOString();
  const gridJson = JSON.stringify(grid);
  const tokensJson = JSON.stringify(tokens);

  const existing = await db.execute("SELECT id FROM tabletop WHERE id = 'shared'");
  if (existing.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO tabletop (id, grid, tokens, updatedAt) VALUES (?, ?, ?, ?)',
      args: ['shared', gridJson, tokensJson, updatedAt],
    });
  } else {
    await db.execute({
      sql: 'UPDATE tabletop SET grid = ?, tokens = ?, updatedAt = ? WHERE id = ?',
      args: [gridJson, tokensJson, updatedAt, 'shared'],
    });
  }

  res.json({ updatedAt });
});

export default router;
