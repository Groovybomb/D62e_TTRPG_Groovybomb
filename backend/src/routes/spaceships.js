import express from 'express';
import { generateId, findById, findIndexById } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function defaultSpaceship(userId, name) {
  return {
    id: generateId(),
    userId,
    name,
    stats: {
      navicomp: 1,
      maneuverability: 1,
      engines: 1,
      hull: 1,
      shield: 0,
    },
    weapons: [],
    crew: {
      captain: '',
      helm: '',
      tactical: '',
      operations: '',
      engineer: '',
    },
    notes: '',
    createdAt: new Date().toISOString(),
  };
}

// POST /api/spaceships - Create new spaceship
router.post('/', async (req, res) => {
  const { userId, name } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name required' });
  }

  const ship = defaultSpaceship(userId, name);
  db.data.spaceships.push(ship);
  await db.write();

  res.status(201).json(ship);
});

// GET /api/spaceships - Get all spaceships
router.get('/', async (req, res) => {
  res.json(db.data.spaceships);
});

// GET /api/spaceships/:id - Get spaceship details
router.get('/:id', async (req, res) => {
  const ship = findById(db.data.spaceships, req.params.id);
  if (!ship) return res.status(404).json({ error: 'Spaceship not found' });
  res.json(ship);
});

// PATCH /api/spaceships/:id - Update spaceship
router.patch('/:id', async (req, res) => {
  const index = findIndexById(db.data.spaceships, req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Spaceship not found' });

  const ship = db.data.spaceships[index];
  const allowed = ['name', 'stats', 'weapons', 'crew', 'notes'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      ship[key] = req.body[key];
    }
  }

  ship.updatedAt = new Date().toISOString();
  db.data.spaceships[index] = ship;
  await db.write();

  res.json(ship);
});

// DELETE /api/spaceships/:id - Delete spaceship
router.delete('/:id', async (req, res) => {
  const index = findIndexById(db.data.spaceships, req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Spaceship not found' });

  const deleted = db.data.spaceships.splice(index, 1);
  await db.write();

  res.json({ message: 'Spaceship deleted', spaceship: deleted[0] });
});

export default router;
