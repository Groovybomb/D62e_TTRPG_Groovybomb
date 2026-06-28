import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

// POST /api/users/register - Create new user
router.post('/register', async (req, res) => {
  const { username, password, displayName, isGM } = req.body;

  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Username, password, and display name required' });
  }

  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [username] });
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: 'INSERT INTO users (id, username, displayName, password, isGM, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, username, displayName, password, isGM ? 1 : 0, createdAt],
  });

  res.status(201).json({ id, username, displayName, isGM: isGM || false });
});

// POST /api/users/login - Authenticate user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const result = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
  const user = result.rows[0];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isGM: !!user.isGM,
  });
});

// PATCH /api/users/:userId - Update user (display name, etc.)
router.patch('/:userId', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [req.params.userId] });
  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const displayName = req.body.displayName || user.displayName;
  const updatedAt = new Date().toISOString();

  await db.execute({
    sql: 'UPDATE users SET displayName = ?, updatedAt = ? WHERE id = ?',
    args: [displayName, updatedAt, req.params.userId],
  });

  res.json({ id: user.id, username: user.username, displayName });
});

// GET /api/users/:userId - Get user info
router.get('/:userId', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [req.params.userId] });
  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isGM: !!user.isGM,
    createdAt: user.createdAt,
  });
});

// GET /api/users/:userId/characters - Get user's characters
router.get('/:userId/characters', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM characters WHERE userId = ?', args: [req.params.userId] });
  const characters = result.rows.map(parseCharacterRow);
  res.json(characters);
});

function parseCharacterRow(row) {
  return {
    ...row,
    attributes: JSON.parse(row.attributes || '{}'),
    advancedSkills: JSON.parse(row.advancedSkills || '{}'),
    weapons: JSON.parse(row.weapons || '[]'),
    talents: JSON.parse(row.talents || '[]'),
    flaws: JSON.parse(row.flaws || '[]'),
    perks: JSON.parse(row.perks || '[]'),
    cybernetics: JSON.parse(row.cybernetics || '[]'),
    items: JSON.parse(row.items || '[]'),
    isNPC: !!row.isNPC,
  };
}

export default router;
