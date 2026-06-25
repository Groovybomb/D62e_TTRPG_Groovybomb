# D62e Codebase Documentation

## 📋 Important: Work Tracking

**When you complete work on this project, update [WORK_LOG.md](WORK_LOG.md).** This file tracks:
- ✅ Completed features and tasks
- 🔄 Current progress on in-progress work
- 📝 Known issues and limitations
- 🎯 Prioritized next steps

Keeping it updated helps coordinate work and track project status at a glance.

## Overview

This document describes the structure, conventions, and key architectural decisions for the D62e TTRPG platform.

**Current Build Status:** v1.0.0 — All core features implemented, refactored, and browser-tested.

## v1 Feature Summary

- User authentication (register/login with displayName, GM role flag)
- Character sheet: 7 attributes, 30+ skills, weapons, talents, flaws, perks, items, notes
- Roll system: wild die mechanics, Hero Points (Double Dice, Re-Roll, Double Down, Exceptional Success)
- Roll modal with setup and result phases, roll buttons on every attribute/skill
- Damage rolls from weapon formulas
- Spacecraft sheet: stats, weapons, crew stations, game rules panels
- Roll log / chat: interleaved by timestamp, 3s polling
- GM roll system: call for rolls, 5-tier outcomes, auto HP awards
- Game Master tab: roll initiator, response tracking, difficulty table, presets
- Dark-themed responsive UI with 4 tabs
- Data persistence via lowdb (JSON file-based)

See [WORK_LOG.md](WORK_LOG.md) for development history and known issues.

## Directory Structure

```
D62e/
├── frontend/
│   ├── src/
│   │   ├── components/      # RollModal.jsx, GMRollModal.jsx
│   │   ├── pages/           # LoginPage, CharacterPage, SpaceshipPage, GamePage, GameMasterPage
│   │   ├── data/            # attributes.js (skill definitions), outcomes.js (shared constants)
│   │   ├── utils/           # dice.js (roll logic, wild die, outcome evaluation)
│   │   ├── config.js        # Shared API_URL constant
│   │   ├── App.jsx          # Root component, nav, GM roll polling
│   │   ├── App.css          # All styling (dark theme)
│   │   └── main.jsx         # React entry point
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/          # users, characters, rolls, spaceships, messages, gmRolls
│   │   ├── server.js        # Express app with middleware and routes
│   │   ├── db.js            # lowdb initialization with default schema
│   │   └── utils.js         # generateId(), findById(), findIndexById()
│   ├── data/                # db.json (auto-created, gitignored)
│   └── package.json
│
├── CLAUDE.md                # This file — codebase documentation
├── ORCHESTRATION.md         # Game rules and mechanics
├── WORK_LOG.md              # Development progress tracking
├── QUICKSTART.md            # Quick setup instructions
├── README.md                # Project overview
├── .gitignore               # Git ignore rules
├── .env.example             # Environment variables template
└── package.json             # Root monorepo package.json
```

## Key Modules

### Frontend

**Pages:**
- `LoginPage` — Register/login with display name and GM checkbox
- `CharacterPage` — Character sheet with edit mode, roll buttons on every skill/attribute, damage rolls
- `SpaceshipPage` — Ship stats, weapons, crew stations, game rules reference panels
- `GamePage` — Roll log + chat (interleaved by timestamp), quick roll selector
- `GameMasterPage` — Call for rolls (static/dice DC), response tracking, difficulty table, presets

**Components:**
- `RollModal` — Skill/attribute roll popup (setup phase + result phase)
- `GMRollModal` — GM-initiated roll popup (setup + result + choice/done phases)

**Shared Data:**
- `config.js` — Shared `API_URL` constant (used by all pages/components)
- `data/attributes.js` — Attribute/skill definitions, `getDicePool()`, `DIFFICULTY_TABLE`
- `data/outcomes.js` — Shared `OUTCOME_LABELS` and `OUTCOME_COLORS` maps
- `utils/dice.js` — `rollDice()`, `rollPlainDice()`, `calculateTotal()`, `evaluateGMRollOutcome()`

### Backend

**Routes (all under `/api`):**
- `users.js` — Register, login, get/update user, get user's characters
- `characters.js` — CRUD with server-side `?userId=` filtering
- `rolls.js` — Store skill/attack/damage rolls, get rolls (newest first)
- `spaceships.js` — CRUD with server-side `?userId=` filtering
- `messages.js` — Get last 100 messages, post new message
- `gmRolls.js` — Full GM roll lifecycle (create, poll active, respond, update outcome, close)

**Utilities:**
- `utils.js` — `generateId()` (uuid), `findById()`, `findIndexById()`
- `db.js` — lowdb initialization with default schema for all collections

## Data Storage

All data persists in `backend/data/db.json` (lowdb, auto-created on first run). Collections:
- `users` — accounts with username, password, displayName, isGM flag
- `characters` — full character sheets (attributes, skills, weapons, talents, flaws, perks, items, notes)
- `rolls` — skill/attack/damage roll history with full wild die details
- `spaceships` — ship stats, weapons, crew stations
- `messages` — chat messages (author, text, timestamp)
- `gmRollRequests` — GM-initiated roll calls (skill, DC, status)
- `gmRollResponses` — player responses to GM roll calls
- `gameSessions` — placeholder (not yet used)

## Authentication

- Plain user ID stored in localStorage (no JWT)
- Passwords stored in plain text (no hashing)
- GM role set at registration via `isGM` flag
- No session tokens or middleware auth checks

## Communication

- Polling-based (no WebSocket)
- Roll log / chat: 3-second polling interval
- GM roll requests: 5-second polling by players
- GM roll responses: 5-second polling by GM

## Roll System

See [ORCHESTRATION.md](ORCHESTRATION.md) for full game rules.

**Dice (`frontend/src/utils/dice.js`):**
- `rollDice(count)` — rolls N d6, first is Wild Die
- Wild Die = 6: explodes (keep rolling/adding until not-6)
- Wild Die = 1: complication (wild = 0, highest other die removed)
- Returns array of die objects with `{value, isWild, rolls, exploded, rawFirst}`

**Roll Modal (`frontend/src/components/RollModal.jsx`):**
- Two phases: setup (extra dice, Double Dice for 1 HP) → result (wild die display, totals)
- Hero Point options: Re-Roll (1 HP), Double Down (free, complication on 2nd fail)
- Exceptional Success auto-detected (total ≥ DC by threshold)
- Roll flag saved to backend: `REROLL`, `DOUBLE_DOWN`, or `null`

**GM Roll System (`frontend/src/components/GMRollModal.jsx`):**
- GM sets skill + DC (static number or dice formula)
- All logged-in players get popup via 5s polling
- 5-tier outcomes: Exceptional Success, Success, Partial Success, Fail, Critical Fail
- Auto Hero Point awards on Exceptional Success

## Conventions

**Code Style:**
- Plain JavaScript (no TypeScript)
- camelCase for variables/functions, PascalCase for components
- React functional components throughout
- Async/await over `.then()` chains
- Shared constants extracted to `config.js` and `data/` modules

**Commits:**
- Commit after every coding session
- Descriptive messages: `"Add attack roll UI"`, `"Fix wild dice counting"`
- See [WORK_LOG.md](WORK_LOG.md) for git workflow

## Tech Stack

- **Frontend**: React (Vite) + plain JavaScript
- **Backend**: Node.js + Express
- **Database**: lowdb (JSON file-based)
- **Communication**: Polling (3-5s intervals)
- **Auth**: Plain user ID in localStorage
- **Package manager**: npm workspaces (monorepo)

## Known Limitations

- No WebSocket (polling-based)
- No game sessions (global shared state)
- No password hashing (plain text)
- No JWT authentication
- No input validation
- lowdb not suitable for high traffic

## Future Considerations

- WebSocket for real-time communication
- Game sessions to group players
- JWT auth and password hashing
- Input validation and sanitization
- Character export/import
- Mobile app
