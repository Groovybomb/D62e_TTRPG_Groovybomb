import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function parseRequest(row) {
  return {
    ...row,
    dcDiceResults: row.dcDiceResults ? JSON.parse(row.dcDiceResults) : null,
  };
}

function parseResponse(row) {
  return {
    ...row,
    diceRolled: JSON.parse(row.diceRolled || '[]'),
    wildDie: row.wildDie ? JSON.parse(row.wildDie) : null,
    removedDie: row.removedDie ? JSON.parse(row.removedDie) : null,
    complication: !!row.complication,
    doubled: !!row.doubled,
    neededExplosion: !!row.neededExplosion,
    declined: !!row.declined,
  };
}

// POST / - GM creates a roll request
router.post('/', async (req, res) => {
  const { gmUserId, skill, skillLabel, attribute, attributeLabel, label, dcType, dcValue, dcDiceCount, dcDiceResults } = req.body;

  if (!gmUserId || !label || !dcType || dcValue == null) {
    return res.status(400).json({ error: 'gmUserId, label, dcType, and dcValue required' });
  }

  const request = {
    id: generateId(),
    gmUserId,
    skill: skill || null,
    skillLabel: skillLabel || null,
    attribute: attribute || null,
    attributeLabel: attributeLabel || null,
    label,
    dcType,
    dcValue,
    dcDiceCount: dcDiceCount || null,
    dcDiceResults: dcDiceResults || null,
    status: 'active',
    createdAt: new Date().toISOString(),
    closedAt: null,
  };

  await db.execute({
    sql: `INSERT INTO gm_roll_requests (id, gmUserId, skill, skillLabel, attribute, attributeLabel, label, dcType, dcValue, dcDiceCount, dcDiceResults, status, createdAt, closedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      request.id, request.gmUserId, request.skill, request.skillLabel,
      request.attribute, request.attributeLabel, request.label, request.dcType,
      request.dcValue, request.dcDiceCount,
      request.dcDiceResults ? JSON.stringify(request.dcDiceResults) : null,
      request.status, request.createdAt, request.closedAt,
    ],
  });

  res.status(201).json(request);
});

// GET /active - Players poll for pending requests they haven't responded to
router.get('/active', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  const activeResult = await db.execute({
    sql: "SELECT * FROM gm_roll_requests WHERE status = 'active'",
    args: [],
  });

  const pending = [];
  for (const request of activeResult.rows) {
    const responded = await db.execute({
      sql: 'SELECT id FROM gm_roll_responses WHERE requestId = ? AND userId = ?',
      args: [request.id, userId],
    });
    if (responded.rows.length === 0) {
      pending.push(parseRequest(request));
    }
  }

  res.json(pending);
});

// POST /:id/respond - Player submits their roll response
router.post('/:id/respond', async (req, res) => {
  const reqResult = await db.execute({ sql: 'SELECT * FROM gm_roll_requests WHERE id = ?', args: [req.params.id] });
  if (reqResult.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
  const request = parseRequest(reqResult.rows[0]);

  const {
    characterId, characterName, userId,
    diceCount, diceRolled, wildDie, total, complication, removedDie,
    doubled, extraDice, extraPips, rollFlag, linkedResponseId,
    outcome, outcomeChoice, heroPointDelta, neededExplosion,
  } = req.body;

  if (!characterId || !userId) {
    return res.status(400).json({ error: 'characterId and userId required' });
  }

  const now = new Date().toISOString();

  const response = {
    id: generateId(),
    requestId: request.id,
    characterId,
    characterName: characterName || 'Unknown',
    userId,
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
    linkedResponseId: linkedResponseId || null,
    outcome: outcome || null,
    outcomeChoice: outcomeChoice || null,
    heroPointDelta: heroPointDelta || 0,
    neededExplosion: neededExplosion || false,
    createdAt: now,
  };

  await db.execute({
    sql: `INSERT INTO gm_roll_responses (id, requestId, characterId, characterName, userId, diceCount, diceRolled, wildDie, total, complication, removedDie, doubled, extraDice, extraPips, rollFlag, linkedResponseId, outcome, outcomeChoice, heroPointDelta, neededExplosion, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      response.id, response.requestId, response.characterId, response.characterName, response.userId,
      response.diceCount, JSON.stringify(response.diceRolled),
      response.wildDie ? JSON.stringify(response.wildDie) : null,
      response.total, response.complication ? 1 : 0,
      response.removedDie ? JSON.stringify(response.removedDie) : null,
      response.doubled ? 1 : 0, response.extraDice, response.extraPips, response.rollFlag, response.linkedResponseId,
      response.outcome, response.outcomeChoice, response.heroPointDelta,
      response.neededExplosion ? 1 : 0, response.createdAt,
    ],
  });

  // Also save to rolls table as GM_ROLL for the roll log
  const rollId = generateId();
  await db.execute({
    sql: `INSERT INTO rolls (id, rollType, characterId, requestId, skill, attribute, diceCount, diceRolled, wildDie, total, complication, removedDie, doubled, extraDice, extraPips, rollFlag, dcValue, outcome, outcomeChoice, heroPointDelta, neededExplosion, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      rollId, 'GM_ROLL', characterId, request.id,
      request.skillLabel || request.attributeLabel || request.label,
      request.attributeLabel || '',
      diceCount || 0, JSON.stringify(diceRolled || []),
      wildDie ? JSON.stringify(wildDie) : null,
      total || 0, complication ? 1 : 0,
      removedDie ? JSON.stringify(removedDie) : null,
      doubled ? 1 : 0, extraDice || 0, extraPips || 0, rollFlag || null,
      request.dcValue, outcome || null, outcomeChoice || null,
      heroPointDelta || 0, neededExplosion ? 1 : 0, now,
    ],
  });

  // Auto-update character hero points
  if (heroPointDelta && heroPointDelta !== 0) {
    await db.execute({
      sql: 'UPDATE characters SET heroPoints = heroPoints + ? WHERE id = ?',
      args: [heroPointDelta, characterId],
    });
  }

  res.status(201).json(response);
});

// POST /:id/decline - Player declines the roll request
router.post('/:id/decline', async (req, res) => {
  const reqResult = await db.execute({ sql: 'SELECT * FROM gm_roll_requests WHERE id = ?', args: [req.params.id] });
  if (reqResult.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
  const request = parseRequest(reqResult.rows[0]);

  const { characterId, characterName, userId } = req.body;
  if (!characterId || !userId) {
    return res.status(400).json({ error: 'characterId and userId required' });
  }

  const now = new Date().toISOString();
  const responseId = generateId();

  await db.execute({
    sql: `INSERT INTO gm_roll_responses (id, requestId, characterId, characterName, userId, declined, createdAt)
          VALUES (?, ?, ?, ?, ?, 1, ?)`,
    args: [responseId, request.id, characterId, characterName || 'Unknown', userId, now],
  });

  const rollId = generateId();
  await db.execute({
    sql: `INSERT INTO rolls (id, rollType, characterId, requestId, skill, attribute, dcValue, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      rollId, 'GM_ROLL_DECLINED', characterId, request.id,
      request.skillLabel || request.attributeLabel || request.label,
      request.attributeLabel || '',
      request.dcValue, now,
    ],
  });

  const response = {
    id: responseId, requestId: request.id, characterId,
    characterName: characterName || 'Unknown', userId, declined: true, createdAt: now,
  };

  res.status(201).json(response);
});

// PATCH /:id/respond/:responseId - Update response (outcome choice)
router.patch('/:id/respond/:responseId', async (req, res) => {
  const respResult = await db.execute({
    sql: 'SELECT * FROM gm_roll_responses WHERE id = ? AND requestId = ?',
    args: [req.params.responseId, req.params.id],
  });
  if (respResult.rows.length === 0) {
    return res.status(404).json({ error: 'Response not found' });
  }

  const response = parseResponse(respResult.rows[0]);
  const { outcomeChoice, outcome, heroPointDelta } = req.body;

  const oldDelta = response.heroPointDelta || 0;
  const newDelta = heroPointDelta != null ? heroPointDelta : oldDelta;
  const hpAdjustment = newDelta - oldDelta;

  if (outcomeChoice != null) response.outcomeChoice = outcomeChoice;
  if (outcome != null) response.outcome = outcome;
  if (heroPointDelta != null) response.heroPointDelta = newDelta;

  await db.execute({
    sql: 'UPDATE gm_roll_responses SET outcomeChoice = ?, outcome = ?, heroPointDelta = ? WHERE id = ?',
    args: [response.outcomeChoice, response.outcome, response.heroPointDelta, response.id],
  });

  // Update the corresponding roll entry too
  const updateParts = [];
  const updateArgs = [];
  if (outcomeChoice != null) { updateParts.push('outcomeChoice = ?'); updateArgs.push(outcomeChoice); }
  if (outcome != null) { updateParts.push('outcome = ?'); updateArgs.push(outcome); }
  if (heroPointDelta != null) { updateParts.push('heroPointDelta = ?'); updateArgs.push(newDelta); }

  if (updateParts.length > 0) {
    await db.execute({
      sql: `UPDATE rolls SET ${updateParts.join(', ')} WHERE rollType = 'GM_ROLL' AND requestId = ? AND characterId = ?`,
      args: [...updateArgs, req.params.id, response.characterId],
    });
  }

  // Adjust character HP
  if (hpAdjustment !== 0) {
    await db.execute({
      sql: 'UPDATE characters SET heroPoints = heroPoints + ? WHERE id = ?',
      args: [hpAdjustment, response.characterId],
    });
  }

  res.json(response);
});

// GET /:id/responses - GM polls for responses to a request
router.get('/:id/responses', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM gm_roll_responses WHERE requestId = ? ORDER BY createdAt ASC',
    args: [req.params.id],
  });
  res.json(result.rows.map(parseResponse));
});

// PATCH /:id - Close or cancel a request
router.patch('/:id', async (req, res) => {
  const reqResult = await db.execute({ sql: 'SELECT * FROM gm_roll_requests WHERE id = ?', args: [req.params.id] });
  if (reqResult.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

  const request = parseRequest(reqResult.rows[0]);
  const { status } = req.body;

  if (status && ['closed', 'cancelled'].includes(status)) {
    const closedAt = new Date().toISOString();
    await db.execute({
      sql: 'UPDATE gm_roll_requests SET status = ?, closedAt = ? WHERE id = ?',
      args: [status, closedAt, request.id],
    });
    request.status = status;
    request.closedAt = closedAt;
  }

  res.json(request);
});

// GET / - Get recent GM roll requests (for history)
router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM gm_roll_requests ORDER BY createdAt DESC LIMIT 50');
  res.json(result.rows.map(parseRequest));
});

export default router;
