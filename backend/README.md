# D62e Backend

A lightweight Node.js/Express backend using lowdb for flat-file data storage.

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

Server runs on `http://localhost:5000` by default.

## Project Structure

```
src/
├── server.js          # Express app setup
├── db.js              # lowdb initialization
├── utils.js           # Utility functions (dice rolling, ID generation, etc.)
└── routes/
    ├── users.js       # User registration and login
    ├── characters.js  # Character CRUD operations
    └── rolls.js       # Dice roll mechanics
```

## Data Storage

All data is stored in `data/db.json` as a single JSON file:

```json
{
  "users": [...],
  "characters": [...],
  "rolls": [...],
  "spaceships": [...],
  "messages": [...],
  "gameSessions": [...]
}
```

## API Endpoints

### Users

- `POST /api/users/register` - Create new user
  ```json
  { "username": "player1", "password": "secret" }
  ```

- `POST /api/users/login` - Authenticate user
  ```json
  { "username": "player1", "password": "secret" }
  ```

- `GET /api/users/:userId` - Get user info

- `GET /api/users/:userId/characters` - Get user's characters

### Characters

- `POST /api/characters` - Create new character
  ```json
  { "userId": "user-id", "name": "Ace Striker", "skills": {...} }
  ```

- `GET /api/characters` - Get all characters

- `GET /api/characters/:characterId` - Get character details

- `PATCH /api/characters/:characterId` - Update character
  ```json
  { "health": 8, "credits": 150 }
  ```

- `DELETE /api/characters/:characterId` - Delete character

### Rolls

- `POST /api/rolls/skill` - Execute skill roll
  ```json
  { "characterId": "char-id", "skill": "shooting", "diceCount": 3, "difficulty": 1 }
  ```

- `POST /api/rolls/attack` - Execute attack roll
  ```json
  { "attackerId": "char-id", "defenderId": "char-id", "diceCount": 3 }
  ```

- `POST /api/rolls/damage` - Execute damage roll
  ```json
  { "characterId": "char-id", "weaponName": "Laser Rifle", "diceCount": 2 }
  ```

- `GET /api/rolls` - Get all rolls

- `GET /api/rolls/:characterId` - Get rolls for specific character

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
BACKEND_PORT=5000
NODE_ENV=development
```

## Notes

- **Passwords:** Currently stored in plain text. In production, use bcrypt or similar.
- **Authentication:** No JWT tokens yet. Currently returns user info on login. Can be enhanced with token-based auth.
- **Concurrency:** lowdb handles basic file locking, but isn't ideal for high-traffic scenarios. Fine for a small group of friends.
- **Data Persistence:** All data persists in `data/db.json` between server restarts.

## Quick Test

```bash
# Create a user
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"secret"}'

# Create a character
curl -X POST http://localhost:5000/api/characters \
  -H "Content-Type: application/json" \
  -d '{"userId":"returned-user-id","name":"Ace Striker"}'

# Roll a skill
curl -X POST http://localhost:5000/api/rolls/skill \
  -H "Content-Type: application/json" \
  -d '{"characterId":"returned-character-id","skill":"shooting","diceCount":3}'
```

## Next Steps

1. Connect React frontend to these endpoints
2. Add WebSocket support for real-time rolls and chat
3. Implement Game Master roll calls
4. Add spaceship management routes
5. Enhance authentication with JWT tokens
