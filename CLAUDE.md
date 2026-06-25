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

**Current Build Status:** Phase 8 complete. All core features implemented, documented, and browser-tested.

## Current Implementation Status

**What's Built (Phase 1-8):**
- ✅ User authentication (register/login with displayName)
- ✅ Character Sheet: 7 attributes, 30+ skills, weapons, talents, flaws, perks, items, notes
- ✅ **Roll System** — Wild die (explodes on 6, complication on 1), Hero Points (Double Dice, Re-Roll, Double Down)
- ✅ Roll Modal popup — setup (extra dice, double), result (visual dice), reroll options
- ✅ Roll buttons on every attribute and skill (opens modal)
- ✅ Spacecraft sheet — stats, weapons, crew, game rules panels
- ✅ Roll Log / Chat tab — real-time display (5-sec refresh), interleaved rolls + persistent chat messages
- ✅ **Chat persistence** — messages saved to backend, 3s polling
- ✅ **GM Roll System** — GM calls for rolls, players get popup, 5-tier outcomes with auto HP awards
- ✅ Game Master tab — roll initiator (static/dice DC), response tracking, difficulty table, roll history
- ✅ Dark-themed responsive UI — 4 main tabs (Character Sheet, Spacecraft, Roll Log/Chat, Game Master)
- ✅ Data persistence — lowdb (JSON file-based)

**What's NOT Built Yet:**
- ❌ WebSocket (polling-based, not true real-time)
- ❌ Game Sessions (no grouping of players)
- ❌ JWT auth (plain user ID in localStorage)
- ❌ Password hashing (plain text in db)
- ❌ Input validation

See [WORK_LOG.md](WORK_LOG.md) for complete status, next steps, and known issues.

## Directory Structure

```
D62e/
├── frontend/                 # React/Vue/[framework] UI application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components (Login, Characters, Spaceships, Game, etc.)
│   │   ├── services/        # API clients and external service calls
│   │   ├── utils/           # Utility functions and helpers
│   │   ├── types/           # TypeScript type definitions
│   │   ├── styles/          # Global styles and theme
│   │   └── App.tsx          # Root component
│   └── package.json
│
├── backend/                  # Express/FastAPI/[framework] server
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/      # Request handlers and business logic
│   │   ├── models/          # Database models and schemas
│   │   ├── middleware/       # Express/server middleware (auth, logging, etc.)
│   │   ├── services/        # Core business logic (roll resolution, game state, etc.)
│   │   ├── types/           # TypeScript interfaces and types
│   │   ├── config/          # Configuration (database, env vars, etc.)
│   │   └── server.ts        # Server entry point
│   └── package.json
│
├── docs/                     # Additional documentation
│   ├── API.md               # API endpoint documentation
│   ├── DATABASE.md          # Database schema and relationships
│   └── DEPLOYMENT.md        # Deployment instructions
│
├── CLAUDE.md                # This file - Code documentation
├── ORCHESTRATION.md         # Game rules and mechanics
├── WORK_LOG.md              # Development progress tracking (update regularly!)
├── QUICKSTART.md            # Quick setup instructions
├── PROJECT_SETUP.md         # Phase-by-phase development guide
├── README.md                # Project overview
├── .gitignore              # Git ignore rules
├── .env.example            # Environment variables template
└── package.json            # Root package.json (if monorepo)
```

## Key Modules

### Frontend

**Pages:**
- `LoginPage` - Authentication and user login
- `CharacterPage` - Character creation and management
- `SpaceshipPage` - Spaceship management and status
- `GamePage` - Main gameplay interface with chat and roll log
- `GameMasterPage` - GM controls for calling rolls and managing game state

**Components:**
- `RollResult` - Display roll outcomes
- `ChatWindow` - Real-time chat messages
- `RollLog` - Historical record of all rolls
- `CharacterSheet` - Character display and editing
- `ShipStatus` - Spaceship information display

**Services:**
- `authService` - Login, logout, token management
- `characterService` - Fetch/create/update characters
- `gameService` - Real-time game state and communication
- `rollService` - Initiate rolls and fetch results

### Backend

**Models:**
- `User` - Player accounts and authentication
- `Character` - TTRPG character data
- `Spaceship` - Ship information and status
- `Roll` - Roll history and results
- `GameSession` - Active game session state

**Services:**
- `RollService` - Roll mechanics, wild dice calculation, result determination
- `AuthService` - User authentication and token generation
- `GameStateService` - Game session management
- `ChatService` - Message persistence and retrieval

**Routes:**
- `POST /auth/login` - User login
- `GET /characters` - Fetch user's characters
- `POST /characters` - Create character
- `GET /spaceships` - Fetch user's spaceships
- `POST /rolls` - Initiate a roll
- `WS /game/:sessionId` - WebSocket for real-time gameplay

## Database Schema

[See docs/DATABASE.md for detailed schema]

High-level entities:
- `users` - Player accounts
- `characters` - Character sheets
- `spaceships` - Ship data
- `rolls` - Roll history with results
- `game_sessions` - Active games
- `messages` - Chat messages

## Authentication & Authorization

- Token-based authentication (JWT or similar)
- Sessions tied to authenticated users
- Game Masters identified by role on game session
- Only character/spaceship owners can modify their assets

## Real-time Communication

- WebSocket connection for live game updates
- Roll announcements broadcast to all players in a session
- Chat messages pushed to connected clients
- Game state changes (GM calls) propagated in real-time

## Roll System (D62e 2e Rules)

See ORCHESTRATION.md for game mechanics. Implementation (Phase 7):

**Frontend (`frontend/src/utils/dice.js`):**
- `rollDice(count)` — rolls N dice, first is "Wild Die"
- Wild Die = 6? Explodes (keep rolling, add results, repeat until not-6)
- Wild Die = 1? Complication (wild die = 0, highest other die removed)
- Other dice just sum normally
- Returns array of die objects with {value, isWild, rolls, exploded, rawFirst}

**Components (`frontend/src/components/RollModal.jsx`):**
- Roll popup with two phases: setup → result
- Setup: shows dice breakdown, +/- extra dice, Double Dice button (1 HP)
- Result: displays wild die in large colored box (green=6, red=1), shows explosion chain
- Options: Re-Roll (1 HP) or Double Down (free, but complication on 2nd fail)
- Flag saved to backend (REROLL, DOUBLE_DOWN, or null)

**Backend (`backend/src/routes/rolls.js`):**
- `POST /api/rolls/skill` — stores full roll data
- Payload: characterId, skill, attribute, diceCount, diceRolled[], wildDie{}, total, complication, doubled, extraDice, rollFlag, linkedRollId
- Also supports attack and damage rolls (less developed)

**Character Sheet (`frontend/src/pages/CharacterPage.jsx`):**
- Roll button next to each attribute and skill
- Click to open RollModal with pre-filled rollInfo
- Hero Points updated automatically when modal closes

## Conventions

**Code Style:**
- Use TypeScript throughout (strict mode)
- Consistent naming: camelCase for variables, PascalCase for classes/types
- Functional components preferred in frontend
- Async/await over .then() chains

**Commits:**
- **Commit after every coding session** - Always push changes to GitHub to track progress
- Descriptive commit messages that explain WHAT changed (see WORK_LOG.md for format)
- Reference ORCHESTRATION.md or docs when explaining game mechanics
- Examples: `"Add attack roll UI to GamePage"`, `"Fix wild dice counting"`, `"Update WORK_LOG.md: completed spaceship routes"`
- See [WORK_LOG.md](WORK_LOG.md#-git-workflow---always-commit-your-work) for detailed git workflow

**Testing:**
- Unit tests for roll logic and calculations
- Integration tests for API routes
- E2E tests for critical user flows (login, character creation, gameplay)

## Tech Stack (DECIDED)

- [x] Frontend: **React** (Vite) with plain JS (not TypeScript for simplicity)
- [x] Backend: **Node.js/Express**
- [x] Database: **lowdb** (JSON file-based, fine for small group)
- [x] Real-time: Not yet (no WebSocket — TODO)
- [x] Auth: Plain user ID in localStorage (TODO: upgrade to JWT)
- [x] Package manager: npm (monorepo with frontend/ and backend/ workspaces)

## Future Considerations

- Spectator mode for players watching sessions
- Dice roll automation and macros
- Character export/import
- Game session recording/replay
- Mobile app
