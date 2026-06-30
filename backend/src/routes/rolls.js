import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function parseRow(row) {
  return {
    ...row,
    diceRolled: JSON.parse(row.diceRolled || '[]'),
    wildDie: row.wildDie ? JSON.parse(row.wildDie) : null,
    removedDie: row.removedDie ? JSON.parse(row.removedDie) : null,
    attackerRoll: row.attackerRoll ? JSON.parse(row.attackerRoll) : undefined,
    defenderRoll: row.defenderRoll ? JSON.parse(row.defenderRoll) : undefined,
    complication: !!row.complication,
    doubled: !!row.doubled,
    isNPC: !!row.isNPC,
    attackHits: row.attackHits != null ? !!row.attackHits : undefined,
    neededExplosion: !!row.neededExplosion,
  };
}

// POST /api/rolls/skill - Store a skill roll result
router.post('/skill', async (req, res) => {
  const {
    characterId, characterName, skill, attribute, diceCount,
    diceRolled, wildDie, total, complication, removedDie,
    doubled, extraDice, extraPips, rollFlag, linkedRollId, isNPC,
  } = req.body;

  if (!characterId || !skill) {
    return res.status(400).json({ error: 'characterId and skill required' });
  }

  const roll = {
    id: generateId(),
    rollType: 'SKILL',
    characterId,
    characterName: characterName || '',
    isNPC: isNPC || false,
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
    extraPips: extraPips || 0,
    rollFlag: rollFlag || null,
    linkedRollId: linkedRollId || null,
    createdAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `INSERT INTO rolls (id, rollType, characterId, characterName, isNPC, skill, attribute, diceCount, diceRolled, wildDie, total, complication, removedDie, doubled, extraDice, extraPips, rollFlag, linkedRollId, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      roll.id, roll.rollType, roll.characterId, roll.characterName, roll.isNPC ? 1 : 0,
      roll.skill, roll.attribute, roll.diceCount,
      JSON.stringify(roll.diceRolled), roll.wildDie ? JSON.stringify(roll.wildDie) : null,
      roll.total, roll.complication ? 1 : 0,
      roll.removedDie ? JSON.stringify(roll.removedDie) : null,
      roll.doubled ? 1 : 0, roll.extraDice, roll.extraPips, roll.rollFlag, roll.linkedRollId, roll.createdAt,
    ],
  });

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

  await db.execute({
    sql: `INSERT INTO rolls (id, rollType, attackerId, defenderId, skill, attackerRoll, defenderRoll, attackHits, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      roll.id, roll.rollType, roll.attackerId, roll.defenderId, roll.skill,
      JSON.stringify(roll.attackerRoll), JSON.stringify(roll.defenderRoll),
      roll.attackHits ? 1 : 0, roll.createdAt,
    ],
  });

  res.status(201).json(roll);
});

// POST /api/rolls/damage - Store a damage roll
router.post('/damage', async (req, res) => {
  const { characterId, characterName, weaponName, damageFormula, diceCount, diceRolled, total, doubled, extraDice, extraPips, rollFlag, isNPC } = req.body;

  if (!characterId || !weaponName) {
    return res.status(400).json({ error: 'characterId and weaponName required' });
  }

  const roll = {
    id: generateId(),
    rollType: 'DAMAGE',
    characterId,
    characterName: characterName || '',
    isNPC: isNPC || false,
    weaponName,
    damageFormula: damageFormula || '',
    diceCount: diceCount || 0,
    diceRolled: diceRolled || [],
    total: total || 0,
    doubled: doubled || false,
    extraDice: extraDice || 0,
    extraPips: extraPips || 0,
    rollFlag: rollFlag || null,
    createdAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `INSERT INTO rolls (id, rollType, characterId, characterName, isNPC, weaponName, damageFormula, diceCount, diceRolled, total, doubled, extraDice, extraPips, rollFlag, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      roll.id, roll.rollType, roll.characterId, roll.characterName, roll.isNPC ? 1 : 0,
      roll.weaponName, roll.damageFormula, roll.diceCount,
      JSON.stringify(roll.diceRolled), roll.total,
      roll.doubled ? 1 : 0, roll.extraDice, roll.extraPips, roll.rollFlag, roll.createdAt,
    ],
  });

  res.status(201).json(roll);
});

// GET /api/rolls - Get all rolls (newest first)
router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM rolls ORDER BY createdAt DESC');
  res.json(result.rows.map(parseRow));
});

// GET /api/rolls/character/:characterId - Get rolls for a character
router.get('/character/:characterId', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM rolls WHERE characterId = ? ORDER BY createdAt DESC',
    args: [req.params.characterId],
  });
  res.json(result.rows.map(parseRow));
});

// DELETE /api/rolls - Clear all rolls
router.delete('/', async (req, res) => {
  await db.execute('DELETE FROM rolls');
  res.json({ message: 'All rolls cleared' });
});

export default router;
