import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env.TURSO_DATABASE_URL || `file:${join(__dirname, '../data/local.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const db = createClient({ url: dbUrl, authToken });

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    displayName TEXT NOT NULL,
    password TEXT NOT NULL,
    isGM INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    heroPoints INTEGER DEFAULT 1,
    armor INTEGER DEFAULT 0,
    attributes TEXT DEFAULT '{}',
    advancedSkills TEXT DEFAULT '{}',
    woundLevel TEXT DEFAULT 'healthy',
    stunState TEXT DEFAULT 'none',
    isProne INTEGER DEFAULT 0,
    weapons TEXT DEFAULT '[]',
    talents TEXT DEFAULT '[]',
    flaws TEXT DEFAULT '[]',
    perks TEXT DEFAULT '[]',
    cybernetics TEXT DEFAULT '[]',
    items TEXT DEFAULT '[]',
    notes TEXT DEFAULT '',
    isNPC INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    stats TEXT DEFAULT '{}',
    weapons TEXT DEFAULT '[]',
    crew TEXT DEFAULT '{}',
    woundLevel TEXT DEFAULT 'undamaged',
    notes TEXT DEFAULT '',
    isNPC INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS rolls (
    id TEXT PRIMARY KEY,
    rollType TEXT NOT NULL,
    characterId TEXT,
    characterName TEXT,
    isNPC INTEGER DEFAULT 0,
    skill TEXT,
    attribute TEXT,
    diceCount INTEGER DEFAULT 0,
    diceRolled TEXT DEFAULT '[]',
    wildDie TEXT,
    total INTEGER DEFAULT 0,
    complication INTEGER DEFAULT 0,
    removedDie TEXT,
    doubled INTEGER DEFAULT 0,
    extraDice INTEGER DEFAULT 0,
    rollFlag TEXT,
    linkedRollId TEXT,
    weaponName TEXT,
    damageFormula TEXT,
    attackerId TEXT,
    defenderId TEXT,
    attackerRoll TEXT,
    defenderRoll TEXT,
    attackHits INTEGER,
    requestId TEXT,
    dcValue INTEGER,
    outcome TEXT,
    outcomeChoice TEXT,
    heroPointDelta INTEGER DEFAULT 0,
    neededExplosion INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    author TEXT DEFAULT 'Anonymous',
    text TEXT NOT NULL,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS gm_roll_requests (
    id TEXT PRIMARY KEY,
    gmUserId TEXT NOT NULL,
    skill TEXT,
    skillLabel TEXT,
    attribute TEXT,
    attributeLabel TEXT,
    label TEXT NOT NULL,
    dcType TEXT NOT NULL,
    dcValue INTEGER,
    dcDiceCount INTEGER,
    dcDiceResults TEXT,
    status TEXT DEFAULT 'active',
    createdAt TEXT,
    closedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS gm_roll_responses (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    characterId TEXT NOT NULL,
    characterName TEXT DEFAULT 'Unknown',
    userId TEXT NOT NULL,
    diceCount INTEGER DEFAULT 0,
    diceRolled TEXT DEFAULT '[]',
    wildDie TEXT,
    total INTEGER DEFAULT 0,
    complication INTEGER DEFAULT 0,
    removedDie TEXT,
    doubled INTEGER DEFAULT 0,
    extraDice INTEGER DEFAULT 0,
    rollFlag TEXT,
    linkedResponseId TEXT,
    outcome TEXT,
    outcomeChoice TEXT,
    heroPointDelta INTEGER DEFAULT 0,
    neededExplosion INTEGER DEFAULT 0,
    declined INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS opposed_rolls (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'character',
    initiatorUserId TEXT,
    initiatorCharacterId TEXT,
    initiatorCharacterName TEXT,
    initiatorIsNPC INTEGER DEFAULT 0,
    initiatorVehicleId TEXT,
    initiatorVehicleName TEXT,
    preset TEXT DEFAULT 'custom',
    initiatorSkillLabel TEXT,
    initiatorDiceCount INTEGER,
    initiatorDiceRolled TEXT,
    initiatorWildDie TEXT,
    initiatorTotal INTEGER,
    initiatorComplication INTEGER DEFAULT 0,
    defenderUserId TEXT,
    defenderCharacterId TEXT,
    defenderCharacterName TEXT,
    defenderIsNPC INTEGER DEFAULT 0,
    defenderVehicleId TEXT,
    defenderVehicleName TEXT,
    defenderSkillLabel TEXT,
    defenderIsStatic INTEGER DEFAULT 0,
    defenderTotal INTEGER,
    defenderBaseDice INTEGER,
    defenderFlatBonus INTEGER,
    defenderDiceCount INTEGER,
    defenderDiceRolled TEXT,
    defenderWildDie TEXT,
    defenderComplication INTEGER DEFAULT 0,
    winner TEXT,
    margin INTEGER,
    status TEXT DEFAULT 'pending_defender',
    damageApplied TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS game_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS tabletop (
    id TEXT PRIMARY KEY DEFAULT 'shared',
    grid TEXT DEFAULT '[]',
    tokens TEXT DEFAULT '[]',
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS initiative (
    id TEXT PRIMARY KEY,
    characterId TEXT,
    characterName TEXT NOT NULL,
    total INTEGER DEFAULT 0,
    diceResults TEXT DEFAULT '[]',
    isNPC INTEGER DEFAULT 0,
    isVehicle INTEGER DEFAULT 0,
    createdAt TEXT
  );
`;

export async function initDb() {
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const sql of statements) {
    await db.execute(sql);
  }

  // Add damageApplied column if missing (migration for existing databases)
  try {
    await db.execute('ALTER TABLE opposed_rolls ADD COLUMN damageApplied TEXT');
  } catch { /* column already exists */ }

  // Add isProne column if missing (prone is separate from stun track)
  try {
    await db.execute('ALTER TABLE characters ADD COLUMN isProne INTEGER DEFAULT 0');
  } catch { /* column already exists */ }

  // Migrate existing prone stunState to isProne flag
  try {
    await db.execute("UPDATE characters SET isProne = 1, stunState = 'none' WHERE stunState = 'prone'");
  } catch { /* ignore */ }

  // Add extraPips column if missing
  try {
    await db.execute('ALTER TABLE rolls ADD COLUMN extraPips INTEGER DEFAULT 0');
  } catch { /* column already exists */ }
  try {
    await db.execute('ALTER TABLE gm_roll_responses ADD COLUMN extraPips INTEGER DEFAULT 0');
  } catch { /* column already exists */ }

  const settings = await db.execute('SELECT key FROM game_settings WHERE key = ?', ['maxDice']);
  if (settings.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO game_settings (key, value) VALUES (?, ?)',
      args: ['maxDice', null],
    });
  }
}

export default db;
