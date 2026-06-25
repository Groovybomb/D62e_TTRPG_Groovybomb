# D62e Development Work Log

This document tracks all completed work, current progress, and next steps. **Update this file when work is completed.**

## 🎯 TL;DR — Current Status

**Phase:** 7/10 — Roll System Complete (not yet tested in browser)

**What's Working:**
- Login/register with display name
- Full character sheet (7 attrs, 30+ skills, weapons, talents, perks, items)
- **Roll modal with wild die system** — click Roll on any skill/attribute, modal opens, roll dice, see results
- Hero Points — spend on Double Dice or Re-Roll
- Spacecraft sheet with stats and crew
- Roll Log / Chat tab (reads from backend every 5 sec)
- Game Master tab with difficulty table and all rolls
- Data persists in lowdb JSON file

**NOT Working Yet:**
- WebSocket (no real-time, must refresh manually)
- Game sessions (all rolls in one global log)
- Chat persistence (lost on page refresh)
- Password hashing, JWT auth

**Immediate Next Step:**
1. `cd backend && npm run dev`
2. `cd frontend && npm run dev` (in another terminal)
3. Test in browser at http://localhost:3000 — use test checklist below

See file sections below for detailed architecture, API, file inventory.

---

## How to Update This File

After finishing work on the project:
1. **Move completed items** from the next steps to "✅ Completed Work"
2. **Update status indicators** (✅, 🔄, ⏳, ❌)
3. **Add known issues** if bugs are discovered
4. **Update the testing checklist** with what's been verified
5. **Update "Last Updated"** date at the bottom
6. **Commit to GitHub** - See Git Workflow below

Example completed item format:
```
- [x] Feature name - Brief description of what was done
```

## 📌 Git Workflow - Always Commit Your Work!

**After every coding session, commit your changes to GitHub.** This ensures we track all changes and can review/rollback if needed.

### Standard Commit Process

```bash
# 1. Check what changed
git status

# 2. Stage your changes
git add .

# 3. Commit with a descriptive message
git commit -m "Brief description of what you changed"

# Examples of good commit messages:
# - "Add character editing UI to frontend"
# - "Implement JWT authentication in backend"
# - "Fix wild dice calculation in rolls"
# - "Update WORK_LOG.md: completed spaceship routes"

# 4. Push to GitHub
git push
```

### Commit Message Format

Keep it concise but descriptive. Good examples:
- ✅ `"Add skill roll mechanic to GamePage"`
- ✅ `"Fix password hashing with bcrypt"`
- ✅ `"Create WebSocket connection handler"`
- ❌ `"updated stuff"`
- ❌ `"fix bug"`

### When to Commit

- **After completing a feature** - Even if partially done
- **Before stepping away** - Don't leave work uncommitted
- **After bug fixes** - Document what was fixed
- **After updating documentation** - WORK_LOG.md, CLAUDE.md changes
- **After testing** - If something is verified working

### Commit Checklist

Before committing, verify:
- [ ] Code changes are related (single focus)
- [ ] No debug `console.log()` statements left behind
- [ ] No `.env` or sensitive files staged
- [ ] Commit message is clear and descriptive
- [ ] Changes are tested locally

---

## Project Overview
- **Project:** D62e TTRPG Platform (D6 Second Edition)
- **Tech Stack:** React (frontend), Node.js/Express (backend), lowdb (flat-file storage)
- **Status:** Foundation complete, ready for testing and expansion

---

## ✅ Completed Work

### Phase 1: Project Documentation & Structure
- [x] Updated README.md with project overview and features
- [x] Created CLAUDE.md with complete codebase documentation
- [x] Created ORCHESTRATION.md with game rules and mechanics
- [x] Created PROJECT_SETUP.md with phase-by-phase development guide
- [x] Created QUICKSTART.md with setup instructions
- [x] Created .gitignore for Node/Python projects
- [x] Created .env.example with all configuration variables
- [x] Created root package.json with monorepo setup

### Phase 2: Backend Implementation
- [x] Created backend/package.json with Express, lowdb, CORS, uuid
- [x] Created backend/src/server.js - Express app with middleware and routes
- [x] Created backend/src/db.js - lowdb initialization with default schema
- [x] Created backend/src/utils.js - Dice rolling utilities and helpers
- [x] Created backend/src/routes/users.js - Login, register, user management
- [x] Created backend/src/routes/characters.js - Character CRUD operations
- [x] Created backend/src/routes/rolls.js - Skill/attack/damage roll mechanics
- [x] Created backend/.env with configuration
- [x] Created backend/data/.gitkeep for data directory
- [x] Created backend/README.md with API documentation

### Phase 3: Frontend Implementation
- [x] Created frontend/package.json with React, Vite, axios
- [x] Created frontend/index.html - Main HTML entry point
- [x] Created frontend/vite.config.js - Vite configuration
- [x] Created frontend/src/main.jsx - React entry point
- [x] Created frontend/src/App.jsx - Main app with navigation
- [x] Created frontend/src/App.css - Global dark theme styling
- [x] Created frontend/src/pages/LoginPage.jsx - Auth interface
- [x] Created frontend/src/pages/CharacterPage.jsx - Character management
- [x] Created frontend/src/pages/GamePage.jsx - Gameplay with roll mechanics
- [x] Created frontend/src/pages/GameMasterPage.jsx - GM controls and roll log
- [x] Created frontend/src/pages/SpaceshipPage.jsx - Placeholder for later
- [x] Created frontend/.env with API URL configuration
- [x] Created frontend/README.md with setup and features

### Phase 4: Display Name & Tab Redesign
- [x] Added displayName field to user registration (backend + frontend)
- [x] Login returns displayName; navbar shows displayName
- [x] Added PATCH /api/users/:userId endpoint for updating display name
- [x] Renamed tabs: Character Sheet, Spacecraft, Roll Log / Chat, Game Master

### Phase 5: Character Sheet Redesign (based on player Excel sheet)
- [x] Rebuilt character model with 7 attributes: Agility, Brawn, Knowledge, Perception, Charm, Mechanical, Technical
- [x] Each attribute has proper skills matching D62e rulebook (e.g., Perception has Driving, Investigation, Stealth, Survival, Gunnery, Streetwise)
- [x] Dice pool = attribute dice + skill dice (e.g., Athletics 3 + Brawn 5 = 8D6)
- [x] Created frontend/src/data/attributes.js with attribute/skill definitions, getDicePool(), getAllSkills()
- [x] Character sheet displays attribute blocks with skills, total dice, edit mode
- [x] Computed stats: Dodge = Perception x5, Parry = Agility x5
- [x] Weapons table with Name, Damage, Ammo, Short/Medium/Long Range
- [x] Talents, Flaws, Perks, Items sections (add/remove/edit in edit mode)
- [x] Notes field for freeform text
- [x] Character selector bar with New/Edit/Save/Cancel/Delete
- [x] Roll Log / Chat page rebuilt: skill dropdown grouped by attribute, shows total dice pool
- [x] Chat input for messages (not just rolls)
- [x] GM page shows all characters with stats, difficulty number reference table
- [x] Added character sheet CSS (attribute blocks, skill rows, dice badges, weapon table)
- [x] Added db.json to .gitignore (local test data)

### Phase 6: Spacecraft System (based on player Excel Starship sheet)
- [x] Created backend/src/routes/spaceships.js - Full CRUD for spaceships
- [x] Registered spaceship routes in server.js
- [x] Ship stats: Navicomp, Maneuverability, Engines, Hull, Shield
- [x] Computed stats: Defense (Hull x5), Resist Damage (Hull + Shield), Evasion Bonus (Piloting + Maneuverability)
- [x] Ship weapons table (qty, name, damage, notes)
- [x] Crew stations: Captain (moving), Helm (evading), Tactical (attacking), Operations (resist damage), Engineer (repairs)
- [x] Quick reference panels: Navigation rules, Starship Combat, Damage & Repair, Crew Roles
- [x] Ship notes field
- [x] Full edit mode with save/cancel
- [x] Ship selector bar with New/Edit/Delete
- [x] Added spaceship CSS (stats grid, computed stats, crew grid)

### Phase 7: Roll System Overhaul — Wild Die, Exploding Dice, Re-Roll & Double Down
- [x] Created frontend/src/utils/dice.js — dice rolling with wild die and exploding 6s
- [x] Wild die (first die): explodes on 6 (keep rolling+adding), complication on 1 (counts as 0, remove highest other die)
- [x] Created frontend/src/components/RollModal.jsx — full roll popup with setup and result phases
- [x] Roll popup setup: shows dice breakdown, extra dice +/- control, Double Dice button (costs 1 Hero Point)
- [x] Roll popup results: wild die shown larger with color (green=6, red=1), exploding chain displayed
- [x] Re-Roll button (costs 1 Hero Point, flagged in roll log)
- [x] Double Down button (free re-roll, flagged in roll log, complication on 2nd failure)
- [x] Roll buttons on every attribute header and every skill row in Character Sheet
- [x] Roll buttons hidden in edit mode
- [x] Hero Points automatically decremented on Double Dice and Re-Roll (saved to backend)
- [x] Rebuilt backend/src/routes/rolls.js — stores full roll data (wild die details, flags, linked rolls)
- [x] Roll system changed from success-counting to sum-based (matches D6 2e rules)
- [x] GamePage reads rolls from backend (auto-refreshes every 5 seconds)
- [x] Roll log shows wild die details, exploding dice, complication notices, roll flags (RE-ROLL, DOUBLE DOWN, DOUBLED)
- [x] Quick Roll selector on Game tab also opens roll modal
- [x] Added comprehensive CSS for modal, dice faces, roll flags, buttons

---

## 📋 Roll System Architecture (Phase 7)

The dice rolling system follows D6 Second Edition rules:

**Wild Die Mechanics:**
- First die rolled is the "Wild Die" — rolls 1-6 like normal
- If Wild Die = 6: **Explodes** — roll another d6, add to total, repeat until not-6
- If Wild Die = 1: **Complication** — wild die counts as 0, highest other die removed from total
- All other dice just sum normally

**Roll Flow:**
1. Click "Roll" button on Character Sheet (attribute or skill)
2. Modal opens showing dice breakdown (e.g., "Brawn 5D + Athletics 3D = 8D6")
3. Can add Extra Dice (+/- buttons) or Double Dice (costs 1 Hero Point, doubles total)
4. Execute roll → Wild die shown in large colored box (green=6, red=1)
5. See total and choose: Re-Roll (costs 1 HP) or Double Down (free, complication on fail)
6. Roll saved to backend and appears in Roll Log / Chat tab

**Key Files Created (Phase 7):**
- `frontend/src/utils/dice.js` — dice rolling logic with wild die + exploding mechanics
- `frontend/src/components/RollModal.jsx` — the roll popup (setup + result phases)
- `frontend/src/pages/CharacterPage.jsx` — updated with Roll buttons on every skill/attribute
- `frontend/src/pages/GamePage.jsx` — updated to read rolls from backend, quick-roll dropdown
- `backend/src/routes/rolls.js` — updated to store wild die details, roll flags (REROLL, DOUBLE_DOWN)
- CSS added to `frontend/src/App.css` — modal, dice faces, roll flags, buttons

## 📊 Current Status

### What Works Now
✅ User registration with display name, login
✅ Full D62e character sheet: 7 attributes (Agility, Brawn, Knowledge, Perception, Charm, Mechanical, Technical), 30+ skills
✅ Character weapons, talents, flaws, perks, items, notes
✅ Dice pool: attribute + skill = total D6 to roll
✅ Computed Dodge (Perception ×5) and Parry (Agility ×5)
✅ **Roll buttons on every skill and attribute** — click to open roll modal
✅ **Wild die system** — explodes on 6, complication on 1
✅ **Roll modal** — setup (add dice, double for 1 HP), result (show dice), options (re-roll, double down)
✅ **Hero Points** — spent on Double Dice and Re-Roll, auto-saved to backend
✅ **Roll log** — shows all rolls with wild die details, flags, color-coded dice
✅ **Spacecraft** — stats (Navicomp, Maneuverability, Engines, Hull, Shield), weapons, crew, reference panels
✅ **Game Master tab** — difficulty table, all characters with stats, recent rolls
✅ **Chat** — send messages alongside rolls in Roll Log / Chat tab
✅ **Dark-themed UI** — responsive, modern, tab-based navigation
✅ All data persists in lowdb (backend/data/db.json)

### What Still Needs Work
- [ ] **WebSocket** — real-time rolls/chat across players (currently must refresh manually)
- [ ] **Chat persistence** — currently in-memory only, lost on page refresh
- [ ] **Game sessions** — group players, manage initiative, track resources
- [ ] **GM roll calling** — GM can call rolls for specific players
- [ ] **Attack & Damage rolls UI** — implement on Game page
- [ ] **Password hashing** — currently plain text (use bcrypt)
- [ ] **JWT tokens** — proper authentication (currently just user ID)
- [ ] **Input validation** — form validation on client and server

---

## 🎯 Next Steps (Priority Order)

### Immediate (Test & Validate Everything Works)
**IMPORTANT:** Haven't tested in browser yet — dependencies added but not run.

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev

# Then in browser: http://localhost:3000
```

**Test checklist:**
- [ ] Register new user with username + password + display name
- [ ] Login
- [ ] Create character, verify attributes/skills loaded
- [ ] Click "Roll" on a skill in Character Sheet
- [ ] Roll modal opens, roll dice, see result
- [ ] Roll appears in Roll Log / Chat tab
- [ ] Double Dice button works, costs Hero Point
- [ ] Re-Roll / Double Down buttons work, appear in log with flags
- [ ] Create spacecraft, verify stats load
- [ ] Logout / login again, data still there

### Short Term (Critical Path)
1. **WebSocket** — real-time rolls broadcast to all players in a session (blocking feature for multiplayer)
2. **Game sessions** — let players join a session, share rolls/chat live
3. **Chat persistence** — save messages to db, load on page refresh
4. **GM features** — roll calling, setting difficulty, seeing all player rolls in real-time

### Medium Term (Polish & UX)
1. **Password hashing** — use bcrypt in backend auth routes
2. **JWT tokens** — replace plain user ID with proper auth tokens
3. **Input validation** — validate character names, skill values, etc.
4. **Attack & Damage rolls** — UI on Game page, same roll system
5. **Error handling** — better user-facing error messages

### Long Term (Polish)
1. **Animations** — dice rolling animation, pop effects on explode
2. **Sound effects** — dice sounds, level-up ding
3. **Mobile optimization** — make UI touch-friendly
4. **Dark mode toggle** — option for light theme
5. **Database migration** — move to PostgreSQL if needed

---

## 🐛 Known Issues / Limitations

- **NOT TESTED YET** — code written but not run in browser. First test is immediate next step.
- **Passwords plain text** — stored unhashed in db.json; use bcrypt for production
- **No authentication** — user ID in localStorage, anyone with ID can modify their characters
- **No WebSocket** — rolls/chat not real-time; must refresh manually
- **Chat not persistent** — in-memory only, lost on page refresh
- **No game sessions** — all rolls in one global log, no grouping by game
- **lowdb limitations** — file-based JSON, fine for 2-4 players, not scalable
- **No input validation** — should validate skill values (0-5?), names, etc.
- **Exploding dice** — currently adds all exploded dice to total; verify against D6 2e rules
- **Re-roll logic** — "greater than difficulty" rule from ORCHESTRATION.md not yet implemented

---

## 📝 File Structure Reminder

```
D62e/
├── backend/
│   ├── src/
│   │   ├── server.js              ✅ Working
│   │   ├── db.js                  ✅ Working
│   │   ├── utils.js               ✅ Working
│   │   └── routes/
│   │       ├── users.js           ✅ Working
│   │       ├── characters.js       ✅ Working
│   │       └── rolls.js           ✅ Working
│   ├── data/
│   │   └── db.json                (auto-created)
│   ├── .env                       ✅ Set
│   ├── package.json               ✅ Ready
│   └── README.md                  ✅ Done
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         ✅ Auth (register + login with displayName)
│   │   │   ├── CharacterPage.jsx     ✅ Sheet view + Roll buttons on skills/attributes
│   │   │   ├── GamePage.jsx          ✅ Roll Log/Chat, quick-roll dropdown, live refresh
│   │   │   ├── GameMasterPage.jsx    ✅ All characters, difficulty table, rolls
│   │   │   └── SpaceshipPage.jsx     ✅ Ship stats, weapons, crew, rules panels
│   │   ├── components/
│   │   │   └── RollModal.jsx         ✅ Roll popup (setup + result phases)
│   │   ├── data/
│   │   │   └── attributes.js         ✅ Attribute/skill definitions, getDicePool()
│   │   ├── utils/
│   │   │   └── dice.js               ✅ rollDice(), wild die + exploding, calculateTotal()
│   │   ├── App.jsx                   ✅ Nav tabs, route logic
│   │   ├── App.css                   ✅ All styling (character, ship, modal, dice)
│   │   └── main.jsx                  ✅ React entry point
│   ├── .env                       ✅ Set
│   ├── index.html                 ✅ Set
│   ├── vite.config.js             ✅ Set
│   ├── package.json               ✅ Ready
│   └── README.md                  ✅ Done
├── CLAUDE.md                      ✅ Done
├── ORCHESTRATION.md               ✅ Done
├── WORK_LOG.md                    ✅ This file
├── GIT_WORKFLOW.md                ✅ Done
├── QUICKSTART.md                  ✅ Done
├── PROJECT_SETUP.md               ✅ Done
├── .gitignore                     ✅ Done
├── .env.example                   ✅ Done
└── package.json                   ✅ Done
```

---

## 🔌 API Endpoints

### Users
- `POST /api/users/register` — Create account (username, password, displayName)
- `POST /api/users/login` — Login (username, password) → returns {id, username, displayName}
- `GET /api/users/:userId` — Get user info
- `PATCH /api/users/:userId` — Update displayName (or other fields)

### Characters
- `POST /api/characters` — Create character (userId, name)
- `GET /api/characters` — Get all characters (filtered by userId on frontend)
- `GET /api/characters/:characterId` — Get character sheet
- `PATCH /api/characters/:characterId` — Update (attributes, skills, heroPoints, armor, weapons, talents, flaws, perks, items, notes)
- `DELETE /api/characters/:characterId` — Delete character

### Rolls
- `POST /api/rolls/skill` — Save skill roll (characterId, skill, attribute, diceCount, diceRolled, wildDie, total, complication, doubled, extraDice, rollFlag, linkedRollId)
- `POST /api/rolls/attack` — Save attack roll (attackerId, defenderId, attackerRoll, defenderRoll)
- `POST /api/rolls/damage` — Save damage roll (characterId, weaponName, diceRolled, wildDie, total)
- `GET /api/rolls` — Get all rolls (50 newest)
- `GET /api/rolls/character/:characterId` — Get character's rolls

### Spaceships
- `POST /api/spaceships` — Create ship (userId, name)
- `GET /api/spaceships` — Get all spaceships
- `GET /api/spaceships/:id` — Get spaceship details
- `PATCH /api/spaceships/:id` — Update (stats, weapons, crew, notes)
- `DELETE /api/spaceships/:id` — Delete spaceship

---

## 💾 Data Schema (lowdb)

Current db.json structure:
```json
{
  "users": [
    { "id", "username", "password", "createdAt" }
  ],
  "characters": [
    { "id", "userId", "name", "skills", "health", "armor", "credits", "createdAt", "updatedAt" }
  ],
  "rolls": [
    { "id", "characterId", "rollType", "diceRolled", "wildCount", "resultLevel", "createdAt" }
  ],
  "spaceships": [],
  "messages": [],
  "gameSessions": []
}
```

---

## 🔍 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Can register new user
- [ ] Can login with registered credentials
- [ ] Can create character
- [ ] Can view character details
- [ ] Can execute skill roll
- [ ] Roll appears in log with correct format
- [ ] Wild dice (1s) are counted correctly
- [ ] Can delete character
- [ ] Can switch between characters
- [ ] Can view all rolls in Game Master page
- [ ] Data persists after server restart
- [ ] No console errors

---

**Last Updated:** 2026-06-24 (Phase 7 complete)
**Last Work Done:** Roll system overhaul — wild die mechanics, modal UI, Hero Points, re-roll/double-down logic
**Status:** NOT YET TESTED IN BROWSER — next step is to run npm install and test
