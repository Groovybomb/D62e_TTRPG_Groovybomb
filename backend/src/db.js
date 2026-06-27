import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../data/db.json');

// Default data structure
const defaultData = {
  users: [],
  characters: [],
  vehicles: [],
  rolls: [],
  messages: [],
  gmRollRequests: [],
  gmRollResponses: [],
  opposedRolls: [],
  gameSessions: [],
  gameSettings: { maxDice: null },
};

// Create and initialize database
const db = new Low(new JSONFile(dbPath), defaultData);

// Load data from file
await db.read();

// Ensure all properties exist
db.data ||= defaultData;
Object.keys(defaultData).forEach(key => {
  if (db.data[key] === undefined) {
    db.data[key] = defaultData[key];
  }
});

await db.write();

export default db;
