import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function parseRow(row) {
  return {
    ...row,
    initiatorDiceRolled: row.initiatorDiceRolled ? JSON.parse(row.initiatorDiceRolled) : null,
    initiatorWildDie: row.initiatorWildDie ? JSON.parse(row.initiatorWildDie) : null,
    initiatorComplication: !!row.initiatorComplication,
    initiatorIsNPC: !!row.initiatorIsNPC,
    defenderDiceRolled: row.defenderDiceRolled ? JSON.parse(row.defenderDiceRolled) : null,
    defenderWildDie: row.defenderWildDie ? JSON.parse(row.defenderWildDie) : null,
    defenderComplication: !!row.defenderComplication,
    defenderIsNPC: !!row.defenderIsNPC,
    defenderIsStatic: !!row.defenderIsStatic,
  };
}

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

  await db.execute({
    sql: `INSERT INTO opposed_rolls (id, type, initiatorUserId, initiatorCharacterId, initiatorCharacterName, initiatorIsNPC, initiatorVehicleId, initiatorVehicleName, preset, initiatorSkillLabel, initiatorDiceCount, initiatorDiceRolled, initiatorWildDie, initiatorTotal, initiatorComplication, defenderUserId, defenderCharacterId, defenderCharacterName, defenderIsNPC, defenderVehicleId, defenderVehicleName, defenderSkillLabel, defenderIsStatic, defenderTotal, defenderBaseDice, defenderFlatBonus, defenderDiceCount, defenderDiceRolled, defenderWildDie, defenderComplication, winner, margin, status, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      record.id, record.type, record.initiatorUserId, record.initiatorCharacterId,
      record.initiatorCharacterName, record.initiatorIsNPC ? 1 : 0,
      record.initiatorVehicleId, record.initiatorVehicleName,
      record.preset, record.initiatorSkillLabel, record.initiatorDiceCount,
      record.initiatorDiceRolled ? JSON.stringify(record.initiatorDiceRolled) : null,
      record.initiatorWildDie ? JSON.stringify(record.initiatorWildDie) : null,
      record.initiatorTotal, record.initiatorComplication ? 1 : 0,
      record.defenderUserId, record.defenderCharacterId, record.defenderCharacterName,
      record.defenderIsNPC ? 1 : 0, record.defenderVehicleId, record.defenderVehicleName,
      record.defenderSkillLabel, record.defenderIsStatic ? 1 : 0,
      record.defenderTotal, record.defenderBaseDice, record.defenderFlatBonus,
      record.defenderDiceCount, record.defenderDiceRolled,
      record.defenderWildDie, record.defenderComplication ? 1 : 0,
      record.winner, record.margin, record.status, record.createdAt,
    ],
  });

  res.status(201).json(record);
});

// GET /api/opposed-rolls/active?userId=X&isGM=true — Poll for pending opposed rolls
router.get('/active', async (req, res) => {
  const { userId, isGM } = req.query;
  if (!userId) return res.json([]);

  let result;
  if (isGM === 'true') {
    result = await db.execute({
      sql: "SELECT * FROM opposed_rolls WHERE status = 'pending_defender' AND (defenderUserId = ? OR defenderIsNPC = 1)",
      args: [userId],
    });
  } else {
    result = await db.execute({
      sql: "SELECT * FROM opposed_rolls WHERE status = 'pending_defender' AND defenderUserId = ?",
      args: [userId],
    });
  }

  res.json(result.rows.map(parseRow));
});

// POST /api/opposed-rolls/:id/respond — Defender submits their roll
router.post('/:id/respond', async (req, res) => {
  const rollResult = await db.execute({ sql: 'SELECT * FROM opposed_rolls WHERE id = ?', args: [req.params.id] });
  if (rollResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const roll = parseRow(rollResult.rows[0]);
  if (roll.status !== 'pending_defender') return res.status(400).json({ error: 'Already resolved' });

  const { diceCount, diceRolled, wildDie, total, complication, winner, margin } = req.body;

  await db.execute({
    sql: `UPDATE opposed_rolls SET defenderDiceCount=?, defenderDiceRolled=?, defenderWildDie=?, defenderTotal=?, defenderComplication=?, winner=?, margin=?, status='complete' WHERE id=?`,
    args: [
      diceCount,
      diceRolled ? JSON.stringify(diceRolled) : null,
      wildDie ? JSON.stringify(wildDie) : null,
      total, complication ? 1 : 0,
      winner, margin, req.params.id,
    ],
  });

  roll.defenderDiceCount = diceCount;
  roll.defenderDiceRolled = diceRolled;
  roll.defenderWildDie = wildDie;
  roll.defenderTotal = total;
  roll.defenderComplication = complication || false;
  roll.winner = winner;
  roll.margin = margin;
  roll.status = 'complete';

  res.json(roll);
});

// GET /api/opposed-rolls — Get recent opposed rolls (for roll log)
router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM opposed_rolls ORDER BY createdAt DESC LIMIT 50');
  res.json(result.rows.map(parseRow));
});

// DELETE /api/opposed-rolls — Clear all
router.delete('/', async (req, res) => {
  await db.execute('DELETE FROM opposed_rolls');
  res.json({ success: true });
});

export default router;
