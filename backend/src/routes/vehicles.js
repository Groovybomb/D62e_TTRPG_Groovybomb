import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function parseRow(row) {
  return {
    ...row,
    stats: JSON.parse(row.stats || '{}'),
    weapons: JSON.parse(row.weapons || '[]'),
    crew: JSON.parse(row.crew || '{}'),
    isNPC: !!row.isNPC,
  };
}

function defaultStats() {
  return { navicomp: 1, maneuverability: 1, engines: 1, hull: 1, shield: 0 };
}

function defaultCrew() {
  return { captain: '', helm: '', tactical: '', operations: '', engineer: '' };
}

// POST /api/vehicles - Create new vehicle
router.post('/', async (req, res) => {
  const { userId, name, isNPC, crew } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name required' });
  }

  const vehicle = {
    id: generateId(),
    userId,
    name,
    stats: defaultStats(),
    weapons: [],
    crew: crew || defaultCrew(),
    woundLevel: 'undamaged',
    notes: '',
    isNPC: isNPC || false,
    createdAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `INSERT INTO vehicles (id, userId, name, stats, weapons, crew, woundLevel, notes, isNPC, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      vehicle.id, vehicle.userId, vehicle.name,
      JSON.stringify(vehicle.stats), JSON.stringify(vehicle.weapons), JSON.stringify(vehicle.crew),
      vehicle.woundLevel, vehicle.notes, vehicle.isNPC ? 1 : 0, vehicle.createdAt,
    ],
  });

  res.status(201).json(vehicle);
});

// GET /api/vehicles - Get all vehicles (optionally filter by ?userId= and ?isNPC=)
router.get('/', async (req, res) => {
  const { userId, isNPC } = req.query;
  let sql = 'SELECT * FROM vehicles';
  const conditions = [];
  const args = [];

  if (userId) {
    conditions.push('userId = ?');
    args.push(userId);
  }
  if (isNPC === 'true') {
    conditions.push('isNPC = 1');
  } else if (isNPC === 'false') {
    conditions.push('isNPC = 0');
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await db.execute({ sql, args });
  res.json(result.rows.map(parseRow));
});

// GET /api/vehicles/:id - Get vehicle details
router.get('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM vehicles WHERE id = ?', args: [req.params.id] });
  if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(parseRow(result.rows[0]));
});

// PATCH /api/vehicles/:id - Update vehicle
router.patch('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM vehicles WHERE id = ?', args: [req.params.id] });
  if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

  const vehicle = parseRow(result.rows[0]);
  const allowed = ['name', 'stats', 'weapons', 'crew', 'woundLevel', 'notes', 'isNPC'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      vehicle[key] = req.body[key];
    }
  }

  vehicle.updatedAt = new Date().toISOString();

  await db.execute({
    sql: `UPDATE vehicles SET name=?, stats=?, weapons=?, crew=?, woundLevel=?, notes=?, isNPC=?, updatedAt=? WHERE id=?`,
    args: [
      vehicle.name, JSON.stringify(vehicle.stats), JSON.stringify(vehicle.weapons),
      JSON.stringify(vehicle.crew), vehicle.woundLevel, vehicle.notes,
      vehicle.isNPC ? 1 : 0, vehicle.updatedAt, vehicle.id,
    ],
  });

  res.json(vehicle);
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM vehicles WHERE id = ?', args: [req.params.id] });
  if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

  await db.execute({ sql: 'DELETE FROM vehicles WHERE id = ?', args: [req.params.id] });
  res.json({ message: 'Vehicle deleted', vehicle: parseRow(result.rows[0]) });
});

export default router;
