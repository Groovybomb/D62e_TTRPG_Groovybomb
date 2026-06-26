import express from 'express';
import { generateId, findById } from '../utils.js';
import db from '../db.js';

const router = express.Router();

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

  db.data.gmRollRequests.push(request);
  await db.write();

  res.status(201).json(request);
});

// GET /active - Players poll for pending requests they haven't responded to
router.get('/active', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  const activeRequests = db.data.gmRollRequests.filter(r => r.status === 'active');

  const pending = activeRequests.filter(request => {
    const hasResponded = db.data.gmRollResponses.some(
      resp => resp.requestId === request.id && resp.userId === userId
    );
    return !hasResponded;
  });

  res.json(pending);
});

// POST /:id/respond - Player submits their roll response
router.post('/:id/respond', async (req, res) => {
  const request = findById(db.data.gmRollRequests, req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const {
    characterId, characterName, userId,
    diceCount, diceRolled, wildDie, total, complication, removedDie,
    doubled, extraDice, rollFlag, linkedResponseId,
    outcome, outcomeChoice, heroPointDelta, neededExplosion,
  } = req.body;

  if (!characterId || !userId) {
    return res.status(400).json({ error: 'characterId and userId required' });
  }

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
    rollFlag: rollFlag || null,
    linkedResponseId: linkedResponseId || null,
    outcome: outcome || null,
    outcomeChoice: outcomeChoice || null,
    heroPointDelta: heroPointDelta || 0,
    neededExplosion: neededExplosion || false,
    createdAt: new Date().toISOString(),
  };

  db.data.gmRollResponses.push(response);

  // Also save to rolls collection as GM_ROLL for the roll log
  const rollEntry = {
    id: generateId(),
    rollType: 'GM_ROLL',
    characterId,
    requestId: request.id,
    skill: request.skillLabel || request.attributeLabel || request.label,
    attribute: request.attributeLabel || '',
    diceCount: diceCount || 0,
    diceRolled: diceRolled || [],
    wildDie: wildDie || null,
    total: total || 0,
    complication: complication || false,
    removedDie: removedDie || null,
    doubled: doubled || false,
    extraDice: extraDice || 0,
    rollFlag: rollFlag || null,
    dcValue: request.dcValue,
    outcome: outcome || null,
    outcomeChoice: outcomeChoice || null,
    heroPointDelta: heroPointDelta || 0,
    neededExplosion: neededExplosion || false,
    createdAt: response.createdAt,
  };
  db.data.rolls.push(rollEntry);

  // Auto-update character hero points
  if (heroPointDelta && heroPointDelta !== 0) {
    const character = findById(db.data.characters, characterId);
    if (character) {
      character.heroPoints = (character.heroPoints || 0) + heroPointDelta;
    }
  }

  await db.write();

  res.status(201).json(response);
});

// POST /:id/decline - Player declines the roll request
router.post('/:id/decline', async (req, res) => {
  const request = findById(db.data.gmRollRequests, req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const { characterId, characterName, userId } = req.body;
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
    declined: true,
    createdAt: now,
  };

  db.data.gmRollResponses.push(response);

  const rollEntry = {
    id: generateId(),
    rollType: 'GM_ROLL_DECLINED',
    characterId,
    requestId: request.id,
    skill: request.skillLabel || request.attributeLabel || request.label,
    attribute: request.attributeLabel || '',
    dcValue: request.dcValue,
    createdAt: now,
  };
  db.data.rolls.push(rollEntry);

  await db.write();

  res.status(201).json(response);
});

// PATCH /:id/respond/:responseId - Update response (outcome choice)
router.patch('/:id/respond/:responseId', async (req, res) => {
  const response = findById(db.data.gmRollResponses, req.params.responseId);
  if (!response || response.requestId !== req.params.id) {
    return res.status(404).json({ error: 'Response not found' });
  }

  const { outcomeChoice, outcome, heroPointDelta } = req.body;

  // Adjust HP: undo old delta, apply new delta
  const oldDelta = response.heroPointDelta || 0;
  const newDelta = heroPointDelta != null ? heroPointDelta : oldDelta;
  const hpAdjustment = newDelta - oldDelta;

  if (outcomeChoice != null) response.outcomeChoice = outcomeChoice;
  if (outcome != null) response.outcome = outcome;
  if (heroPointDelta != null) response.heroPointDelta = newDelta;

  // Update the corresponding roll entry too
  const rollEntry = db.data.rolls.find(
    r => r.rollType === 'GM_ROLL' && r.requestId === req.params.id && r.characterId === response.characterId
  );
  if (rollEntry) {
    if (outcomeChoice != null) rollEntry.outcomeChoice = outcomeChoice;
    if (outcome != null) rollEntry.outcome = outcome;
    if (heroPointDelta != null) rollEntry.heroPointDelta = newDelta;
  }

  // Adjust character HP
  if (hpAdjustment !== 0) {
    const character = findById(db.data.characters, response.characterId);
    if (character) {
      character.heroPoints = (character.heroPoints || 0) + hpAdjustment;
    }
  }

  await db.write();

  res.json(response);
});

// GET /:id/responses - GM polls for responses to a request
router.get('/:id/responses', async (req, res) => {
  const responses = db.data.gmRollResponses
    .filter(r => r.requestId === req.params.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(responses);
});

// PATCH /:id - Close or cancel a request
router.patch('/:id', async (req, res) => {
  const request = findById(db.data.gmRollRequests, req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const { status } = req.body;
  if (status && ['closed', 'cancelled'].includes(status)) {
    request.status = status;
    request.closedAt = new Date().toISOString();
    await db.write();
  }

  res.json(request);
});

// GET / - Get recent GM roll requests (for history)
router.get('/', async (req, res) => {
  const requests = [...db.data.gmRollRequests].reverse().slice(0, 50);
  res.json(requests);
});

export default router;
