import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

const CHARACTER_WOUND_ORDER = ['healthy', 'wounded', 'incapacitated', 'mortallyWounded', 'dead'];
const CHARACTER_STUN_ORDER = ['none', 'staggered', 'stunned'];
const VEHICLE_WOUND_ORDER = ['undamaged', 'light', 'heavy', 'severe', 'destroyed'];
const WOUND_LABELS = { healthy: 'Healthy', wounded: 'Wounded', incapacitated: 'Incapacitated', mortallyWounded: 'Mortally Wounded', dead: 'Dead' };
const STUN_LABELS = { none: 'Clear', staggered: 'Staggered', stunned: 'Stunned', prone: 'Prone' };
const VEHICLE_WOUND_LABELS = { undamaged: 'Undamaged', light: 'Light', heavy: 'Heavy', severe: 'Severe', destroyed: 'Destroyed' };

function calculateVehicleDamageEffect(margin, currentWoundLevel) {
  if (margin <= 0) return null;
  const curIdx = VEHICLE_WOUND_ORDER.indexOf(currentWoundLevel || 'undamaged');
  let steps;
  if (margin <= 3) steps = 1;
  else if (margin <= 8) steps = 1;
  else if (margin <= 12) steps = 2;
  else steps = VEHICLE_WOUND_ORDER.length - 1 - curIdx;
  const newIdx = Math.min(curIdx + steps, VEHICLE_WOUND_ORDER.length - 1);
  if (newIdx <= curIdx) return null;
  return {
    entityType: 'vehicle',
    woundLevel: { old: VEHICLE_WOUND_ORDER[curIdx], new: VEHICLE_WOUND_ORDER[newIdx] },
  };
}

function calculateCharacterDamageEffect(damageTotal, brawnTotal, currentWoundLevel, currentStunState, brawnHadComplication) {
  const woundIdx = CHARACTER_WOUND_ORDER.indexOf(currentWoundLevel || 'healthy');
  const stunIdx = CHARACTER_STUN_ORDER.indexOf(currentStunState || 'none');
  let newWoundIdx = woundIdx;
  let newStunIdx = stunIdx;

  if (brawnTotal < damageTotal / 2) {
    return {
      entityType: 'character',
      killingBlow: true,
      isProne: true,
      woundLevel: { old: CHARACTER_WOUND_ORDER[woundIdx], new: 'dead' },
    };
  }

  if (brawnTotal <= damageTotal) {
    if (brawnHadComplication) {
      newWoundIdx = Math.max(CHARACTER_WOUND_ORDER.indexOf('mortallyWounded'), woundIdx + 1);
    } else {
      newWoundIdx = Math.min(woundIdx + 1, CHARACTER_WOUND_ORDER.length - 1);
      if (newWoundIdx < CHARACTER_WOUND_ORDER.indexOf('wounded')) {
        newWoundIdx = CHARACTER_WOUND_ORDER.indexOf('wounded');
      }
    }
  } else {
    newStunIdx = Math.min(stunIdx + 1, CHARACTER_STUN_ORDER.length - 1);
  }

  if (newWoundIdx === woundIdx && newStunIdx === stunIdx) return null;

  const result = { entityType: 'character' };
  if (newWoundIdx !== woundIdx) {
    result.woundLevel = { old: CHARACTER_WOUND_ORDER[woundIdx], new: CHARACTER_WOUND_ORDER[newWoundIdx] };
    result.isProne = true;
  }
  if (newStunIdx !== stunIdx) {
    result.stunState = { old: CHARACTER_STUN_ORDER[stunIdx], new: CHARACTER_STUN_ORDER[newStunIdx] };
  }
  return result;
}

function formatDamageMessage(defenderName, effect, isVehicle, damageTotal, brawnTotal) {
  if (isVehicle) {
    const margin = damageTotal - brawnTotal;
    const parts = [`${defenderName} takes damage (margin: ${margin})!`];
    parts.push(`Hull: ${VEHICLE_WOUND_LABELS[effect.woundLevel.old]} → ${VEHICLE_WOUND_LABELS[effect.woundLevel.new]}`);
    return parts.join(' ');
  }

  if (effect.killingBlow) {
    return `${defenderName} — KILLING BLOW! (Brawn ${brawnTotal} < half of Damage ${damageTotal}) → Dead`;
  }
  const parts = [`${defenderName} hit! (Damage ${damageTotal} vs Brawn ${brawnTotal})`];
  if (effect.woundLevel) {
    parts.push(`Wounds: ${WOUND_LABELS[effect.woundLevel.old]} → ${WOUND_LABELS[effect.woundLevel.new]}`);
  }
  if (effect.stunState) {
    parts.push(`Stun: ${STUN_LABELS[effect.stunState.old]} → ${STUN_LABELS[effect.stunState.new]}`);
  }
  if (effect.isProne) {
    parts.push('Falls prone!');
  }
  return parts.join(' ');
}

async function applyDamage(opposedRoll) {
  const isDamagePreset = opposedRoll.preset === 'damage_vs_resist';
  const isVehicleDamage = opposedRoll.preset === 'vehicle_damage_resist';
  if (!isDamagePreset && !isVehicleDamage) return null;

  const damageTotal = opposedRoll.initiatorTotal || 0;
  const brawnTotal = opposedRoll.defenderTotal || 0;

  if (isVehicleDamage && opposedRoll.defenderVehicleId) {
    if (opposedRoll.winner !== 'initiator') return null;
    const margin = Math.abs(damageTotal - brawnTotal);
    if (margin <= 0) return null;

    const vResult = await db.execute({ sql: 'SELECT * FROM vehicles WHERE id = ?', args: [opposedRoll.defenderVehicleId] });
    if (vResult.rows.length === 0) return null;
    const vehicle = vResult.rows[0];
    const effect = calculateVehicleDamageEffect(margin, vehicle.woundLevel);
    if (!effect) return null;

    await db.execute({ sql: 'UPDATE vehicles SET woundLevel=?, updatedAt=? WHERE id=?', args: [effect.woundLevel.new, new Date().toISOString(), opposedRoll.defenderVehicleId] });

    const msg = formatDamageMessage(opposedRoll.defenderVehicleName || vehicle.name, effect, true, damageTotal, brawnTotal);
    await db.execute({
      sql: 'INSERT INTO messages (id, userId, author, text, createdAt) VALUES (?, ?, ?, ?, ?)',
      args: [generateId(), 'system', 'System', msg, new Date().toISOString()],
    });
    return { ...effect, message: msg };
  }

  if (isDamagePreset && opposedRoll.defenderCharacterId) {
    const cResult = await db.execute({ sql: 'SELECT * FROM characters WHERE id = ?', args: [opposedRoll.defenderCharacterId] });
    if (cResult.rows.length === 0) return null;
    const character = cResult.rows[0];
    const brawnHadComplication = !!opposedRoll.defenderComplication;
    const effect = calculateCharacterDamageEffect(damageTotal, brawnTotal, character.woundLevel, character.stunState, brawnHadComplication);
    if (!effect) return null;

    const updates = {};
    if (effect.woundLevel) updates.woundLevel = effect.woundLevel.new;
    if (effect.stunState) updates.stunState = effect.stunState.new;
    if (effect.isProne) updates.isProne = 1;

    const setClauses = [];
    const args = [];
    if (updates.woundLevel) { setClauses.push('woundLevel=?'); args.push(updates.woundLevel); }
    if (updates.stunState) { setClauses.push('stunState=?'); args.push(updates.stunState); }
    if (updates.isProne) { setClauses.push('isProne=?'); args.push(updates.isProne); }
    setClauses.push('updatedAt=?');
    args.push(new Date().toISOString());
    args.push(opposedRoll.defenderCharacterId);

    await db.execute({ sql: `UPDATE characters SET ${setClauses.join(', ')} WHERE id=?`, args });

    const defName = opposedRoll.defenderCharacterName || character.name;
    const msg = formatDamageMessage(defName, effect, false, damageTotal, brawnTotal);
    await db.execute({
      sql: 'INSERT INTO messages (id, userId, author, text, createdAt) VALUES (?, ?, ?, ?, ?)',
      args: [generateId(), 'system', 'System', msg, new Date().toISOString()],
    });
    return { ...effect, message: msg };
  }

  return null;
}

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
    damageApplied: row.damageApplied ? JSON.parse(row.damageApplied) : null,
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
    damageApplied: null,
    createdAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `INSERT INTO opposed_rolls (id, type, initiatorUserId, initiatorCharacterId, initiatorCharacterName, initiatorIsNPC, initiatorVehicleId, initiatorVehicleName, preset, initiatorSkillLabel, initiatorDiceCount, initiatorDiceRolled, initiatorWildDie, initiatorTotal, initiatorComplication, defenderUserId, defenderCharacterId, defenderCharacterName, defenderIsNPC, defenderVehicleId, defenderVehicleName, defenderSkillLabel, defenderIsStatic, defenderTotal, defenderBaseDice, defenderFlatBonus, defenderDiceCount, defenderDiceRolled, defenderWildDie, defenderComplication, winner, margin, status, damageApplied, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      record.winner, record.margin, record.status, record.damageApplied, record.createdAt,
    ],
  });

  // Auto-apply damage for static defense damage rolls
  if (record.status === 'complete') {
    const damageResult = await applyDamage(record);
    if (damageResult) {
      record.damageApplied = damageResult;
      await db.execute({
        sql: 'UPDATE opposed_rolls SET damageApplied=? WHERE id=?',
        args: [JSON.stringify(damageResult), record.id],
      });
    }
  }

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

  // Auto-apply damage
  const damageResult = await applyDamage(roll);
  if (damageResult) {
    roll.damageApplied = damageResult;
    await db.execute({
      sql: 'UPDATE opposed_rolls SET damageApplied=? WHERE id=?',
      args: [JSON.stringify(damageResult), req.params.id],
    });
  }

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
