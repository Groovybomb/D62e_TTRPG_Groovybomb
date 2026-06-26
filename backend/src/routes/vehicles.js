import express from 'express';
import { generateId, findById, findIndexById } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function defaultVehicle(userId, name) {
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

// POST /api/vehicles - Create new vehicle
router.post('/', async (req, res) => {
  const { userId, name } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name required' });
  }

  const vehicle = defaultVehicle(userId, name);
  db.data.vehicles.push(vehicle);
  await db.write();

  res.status(201).json(vehicle);
});

// GET /api/vehicles - Get all vehicles (optionally filter by ?userId=)
router.get('/', async (req, res) => {
  const { userId } = req.query;
  const results = userId
    ? db.data.vehicles.filter(v => v.userId === userId)
    : db.data.vehicles;
  res.json(results);
});

// GET /api/vehicles/:id - Get vehicle details
router.get('/:id', async (req, res) => {
  const vehicle = findById(db.data.vehicles, req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

// PATCH /api/vehicles/:id - Update vehicle
router.patch('/:id', async (req, res) => {
  const index = findIndexById(db.data.vehicles, req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Vehicle not found' });

  const vehicle = db.data.vehicles[index];
  const allowed = ['name', 'stats', 'weapons', 'crew', 'notes'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      vehicle[key] = req.body[key];
    }
  }

  vehicle.updatedAt = new Date().toISOString();
  db.data.vehicles[index] = vehicle;
  await db.write();

  res.json(vehicle);
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', async (req, res) => {
  const index = findIndexById(db.data.vehicles, req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Vehicle not found' });

  const deleted = db.data.vehicles.splice(index, 1);
  await db.write();

  res.json({ message: 'Vehicle deleted', vehicle: deleted[0] });
});

export default router;
