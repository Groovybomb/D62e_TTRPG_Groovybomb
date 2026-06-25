import express from 'express';
import { generateId, findById, findIndexById } from '../utils.js';
import db from '../db.js';

const router = express.Router();

// POST /api/users/register - Create new user
router.post('/register', async (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Username, password, and display name required' });
  }

  if (db.data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: generateId(),
    username,
    displayName,
    password, // TODO: Hash passwords with bcrypt
    createdAt: new Date().toISOString(),
  };

  db.data.users.push(newUser);
  await db.write();

  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    displayName: newUser.displayName,
  });
});

// POST /api/users/login - Authenticate user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = db.data.users.find(u => u.username === username);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  });
});

// PATCH /api/users/:userId - Update user (display name, etc.)
router.patch('/:userId', async (req, res) => {
  const index = findIndexById(db.data.users, req.params.userId);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.data.users[index];

  if (req.body.displayName) user.displayName = req.body.displayName;

  user.updatedAt = new Date().toISOString();
  db.data.users[index] = user;
  await db.write();

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  });
});

// GET /api/users/:userId - Get user info
router.get('/:userId', async (req, res) => {
  const user = findById(db.data.users, req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
  });
});

// GET /api/users/:userId/characters - Get user's characters
router.get('/:userId/characters', async (req, res) => {
  const userCharacters = db.data.characters.filter(
    c => c.userId === req.params.userId
  );

  res.json(userCharacters);
});

export default router;
