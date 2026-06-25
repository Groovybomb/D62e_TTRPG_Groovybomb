# Quick Start Guide

Get the D62e TTRPG platform running locally in minutes.

## Prerequisites

- Node.js 16+ installed
- npm installed

## Installation

### 1. Install Dependencies

```bash
# From project root
npm install

# This installs dependencies for both frontend and backend (monorepo)
# Alternatively, install individually:
# cd frontend && npm install
# cd backend && npm install
```

## Running the Application

### Option A: Run Both Together (Recommended)

```bash
# From project root
npm run dev
```

This will start:
- **Backend**: `http://localhost:5000` (data stored in `backend/data/db.json`)
- **Frontend**: `http://localhost:3000` (automatically opens in browser)

### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## First Time Setup

1. **Register a new user**
   - Go to `http://localhost:3000`
   - Click "Don't have an account? Register"
   - Enter username and password
   - Click Register

2. **Create a character**
   - Go to the "Characters" tab
   - Click "+ New Character"
   - Enter character name
   - Click Create

3. **Test a roll**
   - Go to the "Game" tab
   - Select your character
   - Choose a skill and dice count
   - Click "Roll"
   - Watch the result appear in the Roll Log

## Troubleshooting

### Backend won't start
```bash
cd backend
npm install
npm run dev
```

### Frontend won't load
```bash
cd frontend
npm install
npm run dev
```

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -r node_modules frontend/node_modules backend/node_modules
npm install
```

### API calls failing
- Make sure backend is running on `http://localhost:5000`
- Check that `frontend/.env` has `VITE_API_URL=http://localhost:5000/api`
- Check browser console (F12) for error messages

## Data

All game data is stored in `backend/data/db.json`. This is a plain JSON file you can inspect or edit directly.

## Next Steps

- Explore the Game Master tab to see all characters and rolls
- Try different skills and dice counts
- Check out the code in `backend/src/routes/rolls.js` to see how rolls are calculated
- Read `ORCHESTRATION.md` for game mechanics details

## Project Structure Overview

```
D62e/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app
│   │   ├── db.js              # Database init
│   │   ├── routes/            # API endpoints
│   │   └── utils.js           # Dice rolling logic
│   ├── data/
│   │   └── db.json            # Game data (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── App.jsx            # Main app
│   │   └── App.css            # Styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── CLAUDE.md                  # Code documentation
├── ORCHESTRATION.md           # Game rules
└── README.md                  # Project overview
```

## Useful Commands

```bash
# Build for production
npm run build

# Run production backend
cd backend && npm start

# View all characters (from root)
cat backend/data/db.json | grep -A5 '"characters"'

# Clear all game data
rm backend/data/db.json
# (It will recreate on next backend start)
```

Happy gaming! 🎲
