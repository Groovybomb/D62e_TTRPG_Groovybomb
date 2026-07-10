import express from 'express';
import { generateId } from '../utils.js';
import db from '../db.js';

const router = express.Router();

const JSON_FIELDS = ['attributes', 'advancedSkills', 'weapons', 'talents', 'flaws', 'perks', 'cybernetics', 'items'];

function parseRow(row) {
  const parsed = { ...row };
  for (const f of JSON_FIELDS) {
    parsed[f] = JSON.parse(row[f] || (f === 'attributes' || f === 'advancedSkills' ? '{}' : '[]'));
  }
  parsed.isNPC = !!row.isNPC;
  parsed.isProne = !!row.isProne;
  return parsed;
}

function defaultAttributes() {
  return {
    agility: { dice: 2, skills: { acrobatics: 0, shooting: 0, melee: 0, slightOfHand: 0 } },
    brawn: { dice: 2, skills: { athletics: 0, intimidation: 0, stamina: 0, throwing: 0 } },
    knowledge: { dice: 2, skills: { languages: 0, medicine: 0, scholar: 0, sciences: 0 } },
    perception: { dice: 2, skills: { driving: 0, investigation: 0, stealth: 0, survival: 0, gunnery: 0, streetwise: 0 } },
    charm: { dice: 2, skills: { command: 0, deceive: 0, persuasion: 0, willpower: 0 } },
    mechanical: { dice: 2, skills: { communication: 0, navigation: 0, piloting: 0, useRepairMech: 0 } },
    technical: { dice: 2, skills: { computers: 0, demolition: 0, upgrade: 0, useRepairTech: 0 } },
  };
}

function defaultAdvancedSkills() {
  return { jupiterDrive: 0, surgery: 0, perform: 0, cryptography: 0 };
}

// POST /api/characters - Create new character
router.post('/', async (req, res) => {
  const { userId, name, isNPC } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name required' });
  }

  const character = {
    id: generateId(),
    userId,
    name,
    heroPoints: isNPC ? 0 : 1,
    armor: 0,
    attributes: defaultAttributes(),
    advancedSkills: defaultAdvancedSkills(),
    woundLevel: 'healthy',
    stunState: 'none',
    isProne: false,
    weapons: [],
    talents: [],
    flaws: [],
    perks: [],
    cybernetics: [],
    items: [],
    notes: '',
    isNPC: isNPC || false,
    createdAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `INSERT INTO characters (id, userId, name, heroPoints, armor, attributes, advancedSkills, woundLevel, stunState, isProne, weapons, talents, flaws, perks, cybernetics, items, notes, isNPC, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      character.id, character.userId, character.name, character.heroPoints, character.armor,
      JSON.stringify(character.attributes), JSON.stringify(character.advancedSkills),
      character.woundLevel, character.stunState, character.isProne ? 1 : 0,
      JSON.stringify(character.weapons), JSON.stringify(character.talents),
      JSON.stringify(character.flaws), JSON.stringify(character.perks),
      JSON.stringify(character.cybernetics), JSON.stringify(character.items),
      character.notes, character.isNPC ? 1 : 0, character.createdAt,
    ],
  });

  res.status(201).json(character);
});

// GET /api/characters - Get all characters (optionally filter by ?userId= and ?isNPC=)
router.get('/', async (req, res) => {
  const { userId, isNPC } = req.query;
  let sql = 'SELECT * FROM characters';
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

// GET /api/characters/:characterId - Get character details
router.get('/:characterId', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM characters WHERE id = ?', args: [req.params.characterId] });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Character not found' });
  }

  res.json(parseRow(result.rows[0]));
});

// PATCH /api/characters/:characterId - Update character
router.patch('/:characterId', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM characters WHERE id = ?', args: [req.params.characterId] });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Character not found' });
  }

  const character = parseRow(result.rows[0]);
  const allowed = ['name', 'heroPoints', 'armor', 'dodgePips', 'parryPips', 'attributes', 'advancedSkills', 'woundLevel', 'stunState', 'isProne', 'weapons', 'talents', 'flaws', 'perks', 'cybernetics', 'items', 'notes', 'isNPC'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      character[key] = req.body[key];
    }
  }

  character.updatedAt = new Date().toISOString();

  await db.execute({
    sql: `UPDATE characters SET name=?, heroPoints=?, armor=?, dodgePips=?, parryPips=?, attributes=?, advancedSkills=?, woundLevel=?, stunState=?, isProne=?, weapons=?, talents=?, flaws=?, perks=?, cybernetics=?, items=?, notes=?, isNPC=?, updatedAt=? WHERE id=?`,
    args: [
      character.name, character.heroPoints, character.armor,
      character.dodgePips || 0, character.parryPips || 0,
      JSON.stringify(character.attributes), JSON.stringify(character.advancedSkills),
      character.woundLevel, character.stunState, character.isProne ? 1 : 0,
      JSON.stringify(character.weapons), JSON.stringify(character.talents),
      JSON.stringify(character.flaws), JSON.stringify(character.perks),
      JSON.stringify(character.cybernetics), JSON.stringify(character.items),
      character.notes, character.isNPC ? 1 : 0, character.updatedAt, character.id,
    ],
  });

  res.json(character);
});

// DELETE /api/characters/:characterId - Delete character
router.delete('/:characterId', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM characters WHERE id = ?', args: [req.params.characterId] });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Character not found' });
  }

  await db.execute({ sql: 'DELETE FROM characters WHERE id = ?', args: [req.params.characterId] });
  res.json({ message: 'Character deleted', character: parseRow(result.rows[0]) });
});

export default router;
