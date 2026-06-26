# D62e TTRPG Platform

A web-based platform for playing D6 Second Edition, a tabletop role-playing game. Players manage characters, control vehicles, roll dice with wild die mechanics, chat in real-time, and a Game Master orchestrates gameplay with called rolls and outcome tracking.

## Features

- **Authentication**: Register/login with username, password, and display name; GM role flag
- **Character Sheet**: Full D62e character — 7 attributes, 30+ skills, weapons, talents, flaws, perks, items, notes
- **Roll System**: Click to roll any skill/attribute, opens modal with:
  - Wild Die mechanics (explodes on 6, complication on 1)
  - Hero Points: Double Dice (2x) or Re-Roll
  - Exceptional Success: free dice doubling
  - Double Down: free re-roll with risk
- **Damage Rolls**: Roll weapon damage directly from character sheet
- **GM Roll System**: GM calls for rolls, all players get popup, 5-tier outcomes with auto Hero Point awards
- **Vehicle**: Vehicle stats, weapons, crew stations, game rules reference panels
- **Roll Log / Chat**: Real-time display of rolls and chat messages, interleaved by timestamp
- **Dark Theme**: Responsive UI with 4 tabs (Character Sheet, Vehicle, Roll Log/Chat, Game Master)

## Tech Stack

- **Frontend**: React (Vite) + JavaScript
- **Backend**: Node.js + Express
- **Database**: lowdb (JSON file-based)
- **Communication**: Polling-based (3-5s intervals)

## Quick Start

```bash
# Install all dependencies
npm install

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

## Project Structure

```
D62e/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express app
│   │   ├── db.js               # lowdb initialization
│   │   ├── utils.js            # ID generation, find helpers
│   │   └── routes/
│   │       ├── users.js        # Auth (register/login)
│   │       ├── characters.js   # Character CRUD
│   │       ├── rolls.js        # Skill/attack/damage rolls
│   │       ├── vehicles.js     # Vehicle CRUD
│   │       ├── messages.js     # Chat messages
│   │       └── gmRolls.js      # GM roll lifecycle
│   └── data/db.json            # Auto-created data file
├── frontend/
│   ├── src/
│   │   ├── pages/              # LoginPage, CharacterPage, VehiclePage, GamePage, GameMasterPage
│   │   ├── components/         # RollModal, GMRollModal
│   │   ├── data/               # Attribute definitions, outcome constants
│   │   ├── utils/              # Dice rolling logic
│   │   ├── config.js           # Shared API URL
│   │   ├── App.jsx             # Root component + navigation
│   │   └── App.css             # All styling
│   └── index.html
├── CLAUDE.md                   # Codebase documentation
├── ORCHESTRATION.md            # Game rules and mechanics
├── WORK_LOG.md                 # Development progress
└── QUICKSTART.md               # Setup instructions
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — Codebase architecture and conventions
- **[ORCHESTRATION.md](ORCHESTRATION.md)** — Game rules and roll resolution
- **[WORK_LOG.md](WORK_LOG.md)** — Development history and known limitations
- **[QUICKSTART.md](QUICKSTART.md)** — Get running in minutes

## Known Limitations (v1)

- Polling-based communication (not WebSocket)
- No game sessions (global roll/chat log)
- Plain-text passwords (no bcrypt)
- User ID in localStorage (no JWT)
- No input validation

## License

MIT
