# Quick Start Guide

Get the D62e TTRPG platform running locally in minutes.

## Prerequisites

- Node.js 18+ installed
- npm installed

## Installation

```bash
# From project root — installs both frontend and backend
npm install
```

## Running the Application

### Option A: Run Both Together (Recommended)

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:5000 (data stored in `backend/data/db.json`)
- **Frontend**: http://localhost:3000 (opens in browser)

### Option B: Run Separately

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

## First Time Setup

1. **Register** — go to http://localhost:3000, click "Register", enter username/password/display name. Check "Game Master" if you want GM controls.

2. **Create a character** — on the Character Sheet tab, click "+ New", enter a name. Edit to set attribute dice, skills, weapons, etc.

3. **Roll dice** — click any "Roll" button on the character sheet. The modal shows wild die mechanics, extra dice, doubling options.

4. **Chat** — go to Roll Log / Chat tab. Send messages and see rolls interleaved in real-time.

5. **GM Rolls** (GM only) — go to Game Master tab. Pick a skill, set a DC, click "Call for Roll". All logged-in players get a popup to roll against the DC.

## Troubleshooting

**Backend won't start:**
```bash
cd backend && npm install && npm run dev
```

**Frontend won't load:**
```bash
cd frontend && npm install && npm run dev
```

**"Cannot find module" errors:**
```bash
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
```

**API calls failing:**
- Verify backend is running on http://localhost:5000
- Check `frontend/.env` has `VITE_API_URL=http://localhost:5000/api`

## Data

All game data is stored in `backend/data/db.json`. Delete this file to reset all data (it recreates on next backend start).

## Useful Commands

```bash
npm run dev              # Start both frontend + backend
npm run build            # Production build (frontend)
cd backend && npm start  # Production backend
```
