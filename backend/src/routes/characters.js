import express from 'express';
import { generateId, findById, findIndexById } from '../utils.js';
import db from '../db.js';

const router = express.Router();

function defaultCharacter(userId, name) {
  return {
    id: generateId(),
    userId,
    name,
    heroPoints: 1,
    armor: 0,
    attributes: {
      agility: { dice: 2, skills: { acrobatics: 0, shooting: 0, melee: 0, slightOfHand: 0 } },
      brawn: { dice: 2, skills: { athletics: 0, intimidation: 0, stamina: 0, throwing: 0 } },
      knowledge: { dice: 2, skills: { languages: 0, medicine: 0, scholar: 0, sciences: 0 } },
      perception: { dice: 2, skills: { driving: 0, investigation: 0, stealth: 0, survival: 0, gunnery: 0, streetwise: 0 } },
      charm: { dice: 2, skills: { command: 0, deceive: 0, persuasion: 0, willpower: 0 } },
      mechanical: { dice: 2, skills: { communication: 0, navigation: 0, piloting: 0, useRepairMech: 0 } },
      technical: { dice: 2, skills: { computers: 0, demolition: 0, upgrade: 0, useRepairTech: 0 } },
    },
    weapons: [],
    talents: [],
    flaws: [],
    perks: [],
    items: [],
    notes: '',
    createdAt: new Date().toISOString(),
  };
}

// POST /api/characters - Create new character
router.post('/', async (req, res) => {
  const { userId, name } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name required' });
  }

  const newCharacter = defaultCharacter(userId, name);
  db.data.characters.push(newCharacter);
  await db.write();

  res.status(201).json(newCharacter);
});

// GET /api/characters - Get all characters (optionally filter by ?userId=)
router.get('/', async (req, res) => {
  const { userId } = req.query;
  const results = userId
    ? db.data.characters.filter(c => c.userId === userId)
    : db.data.characters;
  res.json(results);
});

// GET /api/characters/:characterId - Get character details
router.get('/:characterId', async (req, res) => {
  const character = findById(db.data.characters, req.params.characterId);

  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }

  res.json(character);
});

// PATCH /api/characters/:characterId - Update character
router.patch('/:characterId', async (req, res) => {
  const index = findIndexById(db.data.characters, req.params.characterId);

  if (index === -1) {
    return res.status(404).json({ error: 'Character not found' });
  }

  const character = db.data.characters[index];
  const allowed = ['name', 'heroPoints', 'armor', 'attributes', 'weapons', 'talents', 'flaws', 'perks', 'items', 'notes'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      character[key] = req.body[key];
    }
  }

  character.updatedAt = new Date().toISOString();
  db.data.characters[index] = character;
  await db.write();

  res.json(character);
});

// DELETE /api/characters/:characterId - Delete character
router.delete('/:characterId', async (req, res) => {
  const index = findIndexById(db.data.characters, req.params.characterId);

  if (index === -1) {
    return res.status(404).json({ error: 'Character not found' });
  }

  const deleted = db.data.characters.splice(index, 1);
  await db.write();

  res.json({ message: 'Character deleted', character: deleted[0] });
});

export default router;
