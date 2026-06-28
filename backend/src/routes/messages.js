import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

// GET /api/messages - Get all messages (newest first)
router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM messages ORDER BY createdAt DESC LIMIT 100');
  res.json(result.rows);
});

// POST /api/messages - Send a chat message
router.post('/', async (req, res) => {
  const { userId, author, text } = req.body;

  if (!userId || !text?.trim()) {
    return res.status(400).json({ error: 'userId and text required' });
  }

  const message = {
    id: generateId(),
    userId,
    author: author || 'Anonymous',
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  await db.execute({
    sql: 'INSERT INTO messages (id, userId, author, text, createdAt) VALUES (?, ?, ?, ?, ?)',
    args: [message.id, message.userId, message.author, message.text, message.createdAt],
  });

  res.status(201).json(message);
});

// DELETE /api/messages - Clear all messages
router.delete('/', async (req, res) => {
  await db.execute('DELETE FROM messages');
  res.json({ message: 'All messages cleared' });
});

export default router;
