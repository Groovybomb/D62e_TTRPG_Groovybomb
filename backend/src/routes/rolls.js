import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

// POST /api/rolls/skill - Store a skill roll result
router.post('/skill', async (req, res) => {
  const {
    characterId, skill, attribute, diceCount,
    diceRolled, wildDie, total, complication, removedDie,
    doubled, extraDice, rollFlag, linkedRollId,
  } = req.body;

  if (!characterId || !skill) {
    return res.status(400).json({ error: 'characterId and skill required' });
  }

  const roll = {
    id: generateId(),
    characterId,
    rollType: 'SKILL',
    skill,
    attribute: attribute || '',
    diceCount: diceCount || 0,
    diceRolled: diceRolled || [],
    wildDie: wildDie || null,
    total: total || 0,
    complication: complication || false,
    removedDie: removedDie || null,
    doubled: doubled || false,
    extraDice: extraDice || 0,
    rollFlag: rollFlag || null,
    linkedRollId: linkedRollId || null,
    createdAt: new Date().toISOString(),
  };

  db.data.rolls.push(roll);
  await db.write();

  res.status(201).json(roll);
});

// POST /api/rolls/attack - Store an attack roll
router.post('/attack', async (req, res) => {
  const { attackerId, defenderId, skill, attackerRoll, defenderRoll } = req.body;

  if (!attackerId || !defenderId) {
    return res.status(400).json({ error: 'attackerId and defenderId required' });
  }

  const roll = {
    id: generateId(),
    rollType: 'ATTACK',
    attackerId,
    defenderId,
    skill: skill || '',
    attackerRoll: attackerRoll || {},
    defenderRoll: defenderRoll || {},
    attackHits: (attackerRoll?.total || 0) >= (defenderRoll?.total || 0),
    createdAt: new Date().toISOString(),
  };

  db.data.rolls.push(roll);
  await db.write();

  res.status(201).json(roll);
});

// POST /api/rolls/damage - Store a damage roll
router.post('/damage', async (req, res) => {
  const { characterId, weaponName, diceRolled, wildDie, total, complication } = req.body;

  if (!characterId || !weaponName) {
    return res.status(400).json({ error: 'characterId and weaponName required' });
  }

  const roll = {
    id: generateId(),
    rollType: 'DAMAGE',
    characterId,
    weaponName,
    diceRolled: diceRolled || [],
    wildDie: wildDie || null,
    total: total || 0,
    complication: complication || false,
    createdAt: new Date().toISOString(),
  };

  db.data.rolls.push(roll);
  await db.write();

  res.status(201).json(roll);
});

// GET /api/rolls - Get all rolls (newest first)
router.get('/', async (req, res) => {
  const rolls = [...db.data.rolls].reverse();
  res.json(rolls);
});

// GET /api/rolls/character/:characterId - Get rolls for a character
router.get('/character/:characterId', async (req, res) => {
  const rolls = db.data.rolls.filter(r => r.characterId === req.params.characterId).reverse();
  res.json(rolls);
});

export default router;
