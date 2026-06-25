# D62e Backend

Node.js/Express backend using lowdb for flat-file data storage.

## Setup

```bash
npm install
npm run dev    # Development (auto-restart on changes)
npm start      # Production
```

Server runs on http://localhost:5000 by default.

## Project Structure

```
src/
├── server.js          # Express app, middleware, route mounting
├── db.js              # lowdb initialization with default schema
├── utils.js           # ID generation, array find helpers
└── routes/
    ├── users.js       # Register, login, user management
    ├── characters.js  # Character CRUD with attribute/skill schema
    ├── rolls.js       # Skill, attack, and damage roll storage
    ├── spaceships.js  # Spacecraft CRUD
    ├── messages.js    # Chat message storage
    └── gmRolls.js     # GM roll request/response lifecycle
```

## Data Storage

All data persists in `data/db.json`:

```json
{
  "users": [],
  "characters": [],
  "rolls": [],
  "spaceships": [],
  "messages": [],
  "gmRollRequests": [],
  "gmRollResponses": [],
  "gameSessions": []
}
```

## API Endpoints

### Users
- `POST /api/users/register` — Create user (username, password, displayName, isGM)
- `POST /api/users/login` — Authenticate (username, password)
- `GET /api/users/:userId` — Get user info
- `PATCH /api/users/:userId` — Update user
- `GET /api/users/:userId/characters` — Get user's characters

### Characters
- `POST /api/characters` — Create character (userId, name)
- `GET /api/characters?userId=X` — Get characters (optional userId filter)
- `GET /api/characters/:id` — Get character
- `PATCH /api/characters/:id` — Update character
- `DELETE /api/characters/:id` — Delete character

### Rolls
- `POST /api/rolls/skill` — Store skill roll (with wild die details)
- `POST /api/rolls/attack` — Store attack roll
- `POST /api/rolls/damage` — Store damage roll
- `GET /api/rolls` — Get all rolls (newest first)
- `GET /api/rolls/character/:id` — Get character's rolls

### Spaceships
- `POST /api/spaceships` — Create spaceship (userId, name)
- `GET /api/spaceships?userId=X` — Get spaceships (optional userId filter)
- `GET /api/spaceships/:id` — Get spaceship
- `PATCH /api/spaceships/:id` — Update spaceship
- `DELETE /api/spaceships/:id` — Delete spaceship

### Messages
- `GET /api/messages` — Get last 100 messages (newest first)
- `POST /api/messages` — Send message (userId, author, text)

### GM Rolls
- `POST /api/gm-rolls` — GM creates roll request
- `GET /api/gm-rolls/active?userId=X` — Player polls for pending requests
- `POST /api/gm-rolls/:id/respond` — Player submits roll response
- `PATCH /api/gm-rolls/:id/respond/:responseId` — Update response (outcome choice)
- `GET /api/gm-rolls/:id/responses` — GM polls for responses
- `PATCH /api/gm-rolls/:id` — Close/cancel request
- `GET /api/gm-rolls` — Get recent requests

## Notes

- **Passwords** are stored in plain text — use bcrypt for production
- **No JWT** — returns user info on login, stored in client localStorage
- **lowdb** is fine for 2-4 players, not for high traffic
