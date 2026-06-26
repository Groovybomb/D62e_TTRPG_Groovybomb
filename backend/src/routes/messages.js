import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

// GET /api/messages - Get all messages (newest first)
router.get('/', async (req, res) => {
  const messages = [...db.data.messages].reverse().slice(0, 100);
  res.json(messages);
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

  db.data.messages.push(message);
  await db.write();

  res.status(201).json(message);
});

// DELETE /api/messages - Clear all messages
router.delete('/', async (req, res) => {
  db.data.messages = [];
  await db.write();
  res.json({ message: 'All messages cleared' });
});

export default router;
