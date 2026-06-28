import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

// POST /api/opposed-rolls — Create an opposed roll (initiator has already rolled)
router.post('/', async (req, res) => {
  const {
    type,
    initiatorUserId, initiatorCharacterId, initiatorCharacterName, initiatorIsNPC,
    initiatorVehicleId, initiatorVehicleName,
    preset,
    initiatorSkillLabel, initiatorDiceCount, initiatorDiceRolled, initiatorWildDie,
    initiatorTotal, initiatorComplication,
    defenderUserId, defenderCharacterId, defenderCharacterName, defenderIsNPC,
    defenderVehicleId, defenderVehicleName,
    defenderSkillLabel,
    defenderIsStatic, defenderTotal,
    defenderBaseDice, defenderFlatBonus,
    winner, margin,
  } = req.body;

  const record = {
    id: generateId(),
    type: type || 'character',
    initiatorUserId, initiatorCharacterId, initiatorCharacterName,
    initiatorIsNPC: initiatorIsNPC || false,
    initiatorVehicleId: initiatorVehicleId || null,
    initiatorVehicleName: initiatorVehicleName || null,
    preset: preset || 'custom',
    initiatorSkillLabel, initiatorDiceCount, initiatorDiceRolled, initiatorWildDie,
    initiatorTotal, initiatorComplication: initiatorComplication || false,
    defenderUserId, defenderCharacterId, defenderCharacterName,
    defenderIsNPC: defenderIsNPC || false,
    defenderVehicleId: defenderVehicleId || null,
    defenderVehicleName: defenderVehicleName || null,
    defenderSkillLabel,
    defenderIsStatic: defenderIsStatic || false,
    defenderTotal: defenderTotal ?? null,
    defenderBaseDice: defenderBaseDice ?? null,
    defenderFlatBonus: defenderFlatBonus ?? null,
    defenderDiceCount: null,
    defenderDiceRolled: null,
    defenderWildDie: null,
    defenderComplication: false,
    winner: winner || null,
    margin: margin ?? null,
    status: defenderIsStatic ? 'complete' : 'pending_defender',
    createdAt: new Date().toISOString(),
  };

  db.data.opposedRolls.push(record);
  await db.write();
  res.status(201).json(record);
});

// GET /api/opposed-rolls/active?userId=X&isGM=true — Poll for pending opposed rolls targeting this user's characters
router.get('/active', async (req, res) => {
  const { userId, isGM } = req.query;
  if (!userId) return res.json([]);

  const pending = db.data.opposedRolls.filter(r => {
    if (r.status !== 'pending_defender') return false;
    if (r.defenderUserId === userId) return true;
    if (isGM === 'true' && r.defenderIsNPC) return true;
    return false;
  });
  res.json(pending);
});

// POST /api/opposed-rolls/:id/respond — Defender submits their roll
router.post('/:id/respond', async (req, res) => {
  const roll = db.data.opposedRolls.find(r => r.id === req.params.id);
  if (!roll) return res.status(404).json({ error: 'Not found' });
  if (roll.status !== 'pending_defender') return res.status(400).json({ error: 'Already resolved' });

  const { diceCount, diceRolled, wildDie, total, complication, winner, margin } = req.body;

  roll.defenderDiceCount = diceCount;
  roll.defenderDiceRolled = diceRolled;
  roll.defenderWildDie = wildDie;
  roll.defenderTotal = total;
  roll.defenderComplication = complication || false;
  roll.winner = winner;
  roll.margin = margin;
  roll.status = 'complete';

  await db.write();
  res.json(roll);
});

// GET /api/opposed-rolls — Get recent opposed rolls (for roll log)
router.get('/', async (req, res) => {
  const sorted = [...db.data.opposedRolls]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);
  res.json(sorted);
});

// DELETE /api/opposed-rolls — Clear all
router.delete('/', async (req, res) => {
  db.data.opposedRolls = [];
  await db.write();
  res.json({ success: true });
});

export default router;
