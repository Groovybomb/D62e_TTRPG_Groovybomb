# D62e Development Work Log

This document tracks all completed work, current progress, and next steps. **Update this file when work is completed.**

## 🎯 TL;DR — Current Status

**Version:** 1.2.0 — Decline GM rolls + spacecraft grid fix.

**What's Working (v1.1.0):**
- Max dice cap (GM-settable global limit, applies to all roll modals, polled every 3s by all clients)
- Character show/hide on GM tab (toggle visibility, persisted in localStorage)
- Compressed character skill/attribute view on GM tab (expandable per character)
- GM quick roll (plain d6 sum, posts to chat, no wild die)
- Hero points shown on roll result page (both RollModal and GMRollModal)
- Hero point sync: character data polled every 3s in App.jsx — edits reflect immediately in GM roll modals
- Character sheet re-fetches after GM roll modal closes (hero point changes visible without manual refresh)

**What's Working (v1.0.0):**
- Login/register with display name and GM role
- Full character sheet (7 attrs, 30+ skills, weapons, talents, perks, items)
- Roll modal with wild die system (explodes on 6, complication on 1)
- Damage roll buttons on weapons (plain d6 sum, no wild die)
- Exceptional Success free doubling on all roll types
- Hero Points (Double Dice, Re-Roll, Double Down)
- Spacecraft sheet (stats, weapons, crew, game rules panels)
- Roll Log / Chat tab (interleaved by timestamp, 3s polling)
- GM Roll System (5-tier outcomes, auto HP awards)
- Game Master tab (roll initiator, presets, response tracking, difficulty table)
- Data persistence via lowdb

**Known Limitations (v1):**
- Polling-based (no WebSocket)
- No game sessions (global shared state)
- Plain-text passwords (no bcrypt)
- No JWT auth (user ID in localStorage)
- No input validation

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

### Phase 8: Chat System + GM-Initiated Roll System
- [x] **Chat persistence** — messages saved to backend via POST /api/messages, loaded with 3s polling
- [x] Created backend/src/routes/messages.js — GET (last 100) and POST endpoints
- [x] Chat messages interleaved with rolls in Roll Log / Chat tab (sorted by timestamp)
- [x] Fixed lowdb v4/Node 24 compatibility — changed imports in db.js
- [x] **GM Roll System** — full roll-calling workflow:
  - [x] GM picks skill/attribute from dropdown, sets DC (static number or dice roll)
  - [x] Static DC: number input with difficulty quick-select buttons (5 Very Easy → 40 Mythical)
  - [x] Dice DC: adjustable dice count with Roll DC button, shows individual dice + sum
  - [x] "Call for Roll" creates request, broadcasts to all logged-in players via polling
- [x] Created backend/src/routes/gmRolls.js — 6 endpoints for full GM roll lifecycle
- [x] Added gmRollRequests and gmRollResponses collections to db.js
- [x] **Player GM Roll Modal** (frontend/src/components/GMRollModal.jsx):
  - [x] Pops up over any tab (mounted in App.jsx, polled every 3s)
  - [x] Three phases: setup → result → choice/done
  - [x] Setup: dice pool from character's skill, extra dice, double dice option
  - [x] Result: dice visual, total vs DC, outcome badge, re-roll/double-down
  - [x] Choice scenarios for wild die 6 (exceptional vs success) and wild die 1 (partial vs fail)
- [x] **Outcome evaluation** (frontend/src/utils/dice.js — evaluateGMRollOutcome):
  - [x] Exceptional Success: beat DC + wild 6 → +1 HP
  - [x] Success: beat DC → +2 HP (wild 6, no explosion needed), +1 HP (needed explosion), 0 HP (other)
  - [x] Partial Success: beat DC + wild 1 → +1 HP with complication (or choose fail for +2 HP)
  - [x] Fail: total ≤ DC → 0 HP
  - [x] Critical Fail: total ≤ DC + wild 1 → +1 HP with complication
- [x] **Hero Points auto-updated** on character sheet after GM roll outcomes
- [x] **GM response tracking** — GM tab shows active request, response count, individual results with outcome badges
- [x] **Roll Log display** — GM_ROLL entries show character name, [GM Roll] tag, skill, total vs DC, outcome badge, HP delta
- [x] Added ~200 lines of GM roll CSS (modal, banners, outcome badges, choice buttons, response cards)
- [x] **Browser tested** — all core flows verified working (see Testing Checklist)

### Phase 8b: Damage Roll Buttons + Exceptional Success Doubling
- [x] **Damage Roll button** on each weapon in Character Sheet (next to damage value)
  - [x] Parses damage formula (e.g., "4D6" → 4 dice) via regex `/(\d+)D/i`
  - [x] Opens DamageRollModal — plain d6 sum, no wild die mechanics
  - [x] Supports Extra Dice, Double Dice (HP cost), Re-Roll (HP cost), Double Down
  - [x] Red-themed visual (border, dice faces, total display)
  - [x] Posts to `POST /api/rolls/damage` with characterId, characterName, weaponName, damageFormula, diceCount, diceRolled, total, doubled, extraDice, rollFlag
- [x] **Damage rolls in Roll Log** — [Damage] tag (red), weapon name, formula, total, dice array
- [x] **Exceptional Success doubling** — free dice doubling across all roll modals:
  - [x] RollModal (skill/attribute rolls) — green "Exceptional Success" button, free doubling
  - [x] DamageRollModal (weapon damage) — green "Exceptional Success" button, free doubling
  - [x] GMRollModal (GM-initiated rolls) — green "Exceptional Success" button, free doubling
  - [x] `doubleSource` state tracks 'heroPoint' vs 'exceptional' — Undo only refunds HP for heroPoint source
  - [x] Doubled note shows "(Exceptional Success)" or "(Hero Point spent)" in result phase
- [x] Added `.exceptional-double-btn` CSS styles (green border/text, green hover fill)
- [x] **Browser tested** — damage rolls, exceptional success on all modals, Roll Log display all verified

### v1.1.0: GM Tab Enhancements & Hero Point Fixes (2026-06-25)
- [x] **Max Dice Cap** — GM can set a global cap on dice for any roll; stored server-side via new `/api/settings` endpoint; polled every 3s so all clients pick up changes without reload; cap applies in RollModal, GMRollModal, and DamageRollModal with yellow warning when capped; Double Dice preview respects cap
- [x] **Character Show/Hide on GM tab** — each character has a hide (✕) button; hidden chars shown in a restore bar; visibility stored in localStorage (GM-local preference)
- [x] **Compressed character view on GM tab** — all characters show attributes + dice at a glance; expandable per character to show all trained skills with totals and weapon list
- [x] **GM Quick Roll** — plain d6 roller (no wild die) on GM tab; posts result to chat log; +/- dice count controls
- [x] **Hero points on result page** — HP count shown in both RollModal and GMRollModal result phase (so player knows balance before choosing re-roll)
- [x] **Bug fix: stale hero points in GM roll modal** — App.jsx `myCharacters` now re-fetched every 3s via polling loop; edits made on character sheet reflect in the next GM roll modal without reload
- [x] **Bug fix: character sheet not updating after GM roll** — added `characterRefreshKey` that increments on GM roll modal close, triggering CharacterPage to re-fetch; hero point changes from GM rolls now appear immediately

### v1.2.0: Decline GM Rolls + Spacecraft Fix (2026-06-26)
- [x] **Decline GM roll requests** — players can click X to close the GM roll modal without rolling; records a `GM_ROLL_DECLINED` entry in the roll log and a response in `gmRollResponses` (so the poll stops showing the request)
- [x] **Decline endpoint** — `POST /api/gm-rolls/:id/decline` records the decline and adds roll log entry
- [x] **Roll log display** — declined rolls show as `[GM Roll — Declined]` with gray styling and italic "Declined" text
- [x] **Spacecraft stats grid fix** — widened grid minimum from 180px to 210px so "Maneuverability" label doesn't overflow into the value field

### v1.0.0 Refactoring & Documentation
- [x] **Extracted shared `API_URL`** — created `frontend/src/config.js`, removed 6 duplicate declarations across pages/components
- [x] **Extracted shared outcome constants** — created `frontend/src/data/outcomes.js` (`OUTCOME_LABELS`, `OUTCOME_COLORS`), removed duplication from GameMasterPage, GMRollModal, GamePage
- [x] **Server-side filtering** — added `?userId=` query param support to characters and spaceships routes, updated frontend to use params instead of fetching all + filtering client-side
- [x] **Removed dead backend code** — deleted unused `rollD6`, `rollMultipleDice`, `countWildDice`, `countSuccesses` from `utils.js` (all dice rolling is client-side)
- [x] **Fixed db.js initialization bug** — changed `if (!db.data[key])` to `if (db.data[key] === undefined)` to prevent skipping falsy-but-valid values
- [x] **Fixed redundant no-op ternary** in GMRollModal — removed `hasChoice ? outcome : outcome` pattern
- [x] **Removed unused imports** — cleaned up `getAllSkills`, `getDicePool`, duplicate `ATTRIBUTE_DEFINITIONS` imports
- [x] **Removed unused dependency** — removed `xlsx` devDependency from root package.json
- [x] **Version bumps** — all package.json files bumped to 1.0.0
- [x] **Simplified .env.example** — removed unused JWT, WebSocket, database, session config vars
- [x] **Full documentation rewrite** — README.md, QUICKSTART.md, backend/README.md, frontend/README.md, CLAUDE.md all updated for v1 accuracy
- [x] **Browser tested** — all features verified working after refactoring, zero console errors

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

## 📋 GM Roll System Architecture (Phase 8)

**Polling-Based Communication (No WebSocket):**
- GM creates a roll request → stored in `gmRollRequests` collection
- Players poll `GET /api/gm-rolls/active?userId=X` every 3 seconds from App.jsx
- When a pending request is found → `GMRollModal` pops up over whatever page the player is on
- Player responses stored in `gmRollResponses` + copied to `rolls` as `rollType: "GM_ROLL"`
- GM polls for responses on their tab, can close the request when done

**Outcome Evaluation (evaluateGMRollOutcome in dice.js):**
- total > DC + wild 6 → PENDING_CHOICE (player picks: exceptional +1 HP or success +2/+1 HP)
- total > DC + wild 2-5 → SUCCESS (0 HP)
- total > DC + wild 1 → PENDING_CHOICE (player picks: partial +1 HP or fail +2 HP)
- total ≤ DC + wild 2-6 → FAIL (0 HP)
- total ≤ DC + wild 1 → CRITICAL_FAIL (+1 HP, complication)

**"Needed Explosion" check:** When wild die = 6 and player beats DC, compute `totalWithoutExplosion = total - (wildDie.value - 6)`. If ≤ DC, explosion was needed → success only awards +1 HP instead of +2.

**DC Dice Rolls:** Use plain d6 sums (no wild die mechanics) — `rollPlainDice()` in dice.js.

**Key Files Created (Phase 8):**
- `backend/src/routes/messages.js` — chat message endpoints (GET/POST)
- `backend/src/routes/gmRolls.js` — 6 endpoints for GM roll lifecycle
- `frontend/src/components/GMRollModal.jsx` — player-facing GM roll popup (setup → result → choice)
- `frontend/src/utils/dice.js` — added `rollPlainDice()` and `evaluateGMRollOutcome()`
- `frontend/src/pages/GameMasterPage.jsx` — rebuilt with roll initiator, response tracking
- `frontend/src/pages/GamePage.jsx` — updated with chat persistence and GM_ROLL display
- `frontend/src/App.jsx` — added GM roll polling and modal mounting at app level

## 📊 Current Status

### What Works Now
✅ User registration with display name, login
✅ Full D62e character sheet: 7 attributes (Agility, Brawn, Knowledge, Perception, Charm, Mechanical, Technical), 30+ skills
✅ Character weapons, talents, flaws, perks, items, notes
✅ Dice pool: attribute + skill = total D6 to roll
✅ Computed Dodge (Perception ×5) and Parry (Agility ×5)
✅ **Roll buttons on every skill and attribute** — click to open roll modal
✅ **Damage Roll buttons on weapons** — plain d6 sum (no wild die), red-themed modal
✅ **Exceptional Success doubling** — free dice doubling on skill, attribute, damage, and GM rolls
✅ **Wild die system** — explodes on 6, complication on 1
✅ **Roll modal** — setup (add dice, double for 1 HP), result (show dice), options (re-roll, double down)
✅ **Hero Points** — spent on Double Dice and Re-Roll, auto-saved to backend
✅ **Roll log** — shows all rolls with wild die details, flags, color-coded dice
✅ **Chat persistence** — messages saved to db, 3s polling, interleaved with rolls in Roll Log / Chat
✅ **GM Roll System** — GM calls for rolls, players get popup on any tab, 5-tier outcomes with auto HP
✅ **Spacecraft** — stats (Navicomp, Maneuverability, Engines, Hull, Shield), weapons, crew, reference panels
✅ **Game Master tab** — roll initiator (static/dice DC), response tracking, difficulty table, recent rolls
✅ **Dark-themed UI** — responsive, modern, tab-based navigation
✅ All data persists in lowdb (backend/data/db.json)

### What Still Needs Work
- [ ] **WebSocket** — true real-time (currently polling every 3-5s, works but not instant)
- [ ] **Game sessions** — group players, manage initiative, track resources
- [ ] **Attack rolls UI** — opposed roll system on Game page (damage rolls done on Character Sheet)
- [ ] **Password hashing** — currently plain text (use bcrypt)
- [ ] **JWT tokens** — proper authentication (currently just user ID)
- [ ] **Input validation** — form validation on client and server

---

## 🎯 Next Steps (Priority Order)

### Short Term (Critical Path)
1. **WebSocket** — replace polling with real-time push (currently 3-5s polling works but isn't instant)
2. **Game sessions** — let players join a session, share rolls/chat within a group
3. **Attack rolls UI** — opposed roll system on Game page (damage rolls already on Character Sheet)

### Medium Term (Polish & UX)
1. **Password hashing** — use bcrypt in backend auth routes
2. **JWT tokens** — replace plain user ID with proper auth tokens
3. **Input validation** — validate character names, skill values, etc.
4. **Error handling** — better user-facing error messages

### Long Term (Polish)
1. **Animations** — dice rolling animation, pop effects on explode
2. **Sound effects** — dice sounds, level-up ding
3. **Mobile optimization** — make UI touch-friendly
4. **Dark mode toggle** — option for light theme
5. **Database migration** — move to PostgreSQL if needed

---

## 🐛 Known Issues / Limitations

- **Passwords plain text** — stored unhashed in db.json; use bcrypt for production
- **No authentication** — user ID in localStorage, anyone with ID can modify their characters
- **Polling, not WebSocket** — GM rolls poll every 3s, chat every 3s, roll log every 5s (functional but not instant)
- **No game sessions** — all rolls/chat in one global log, no grouping by game
- **lowdb limitations** — file-based JSON, fine for 2-4 players, not scalable
- **No input validation** — should validate skill values (0-5?), names, etc.
- **GM Roll modal scrolling** — on smaller viewports the modal may require scrolling to reach buttons
- **Single character per player for GM rolls** — currently uses first character; multi-character selection not implemented

---

## 📝 File Structure

```
D62e/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js
│   │   ├── utils.js
│   │   └── routes/
│   │       ├── users.js
│   │       ├── characters.js
│   │       ├── rolls.js
│   │       ├── spaceships.js
│   │       ├── messages.js
│   │       └── gmRolls.js
│   ├── data/db.json               (auto-created)
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── CharacterPage.jsx
│   │   │   ├── GamePage.jsx
│   │   │   ├── GameMasterPage.jsx
│   │   │   └── SpaceshipPage.jsx
│   │   ├── components/
│   │   │   ├── RollModal.jsx
│   │   │   └── GMRollModal.jsx
│   │   ├── data/
│   │   │   ├── attributes.js
│   │   │   └── outcomes.js
│   │   ├── utils/
│   │   │   └── dice.js
│   │   ├── config.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
├── CLAUDE.md
├── ORCHESTRATION.md
├── WORK_LOG.md
├── QUICKSTART.md
├── .gitignore
├── .env.example
└── package.json
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
- `GET /api/characters?userId=X` — Get characters (optional server-side userId filter)
- `GET /api/characters/:characterId` — Get character sheet
- `PATCH /api/characters/:characterId` — Update (attributes, skills, heroPoints, armor, weapons, talents, flaws, perks, items, notes)
- `DELETE /api/characters/:characterId` — Delete character

### Rolls
- `POST /api/rolls/skill` — Save skill roll (characterId, skill, attribute, diceCount, diceRolled, wildDie, total, complication, doubled, extraDice, rollFlag, linkedRollId)
- `POST /api/rolls/attack` — Save attack roll (attackerId, defenderId, attackerRoll, defenderRoll)
- `POST /api/rolls/damage` — Save damage roll (characterId, characterName, weaponName, damageFormula, diceCount, diceRolled, total, doubled, extraDice, rollFlag)
- `GET /api/rolls` — Get all rolls (50 newest)
- `GET /api/rolls/character/:characterId` — Get character's rolls

### Messages
- `GET /api/messages` — Get last 100 messages (newest first)
- `POST /api/messages` — Send message (userId, author, text)

### GM Rolls
- `POST /api/gm-rolls` — GM creates roll request (skill, attribute, label, dcType, dcValue)
- `GET /api/gm-rolls/active?userId=X` — Player polls for pending requests (returns active requests player hasn't responded to)
- `POST /api/gm-rolls/:id/respond` — Player submits roll response (also saves to rolls as GM_ROLL, updates character HP)
- `POST /api/gm-rolls/:id/decline` — Player declines roll request (saves response + GM_ROLL_DECLINED to roll log)
- `PATCH /api/gm-rolls/:id/respond/:responseId` — Update response for outcome choice (wild-6 or wild-1 scenarios)
- `GET /api/gm-rolls/:id/responses` — GM polls for incoming responses
- `PATCH /api/gm-rolls/:id` — GM closes/cancels request (sets status to "closed"/"cancelled")
- `GET /api/gm-rolls` — Returns last 50 GM roll requests for history

### Spaceships
- `POST /api/spaceships` — Create ship (userId, name)
- `GET /api/spaceships?userId=X` — Get spaceships (optional server-side userId filter)
- `GET /api/spaceships/:id` — Get spaceship details
- `PATCH /api/spaceships/:id` — Update (stats, weapons, crew, notes)
- `DELETE /api/spaceships/:id` — Delete spaceship

---

## 💾 Data Schema (lowdb)

Current db.json structure:
```json
{
  "users": [
    { "id", "username", "password", "displayName", "createdAt" }
  ],
  "characters": [
    { "id", "userId", "name", "attributes", "heroPoints", "armor", "weapons", "talents", "flaws", "perks", "items", "notes", "createdAt", "updatedAt" }
  ],
  "rolls": [
    { "id", "characterId", "rollType", "skill", "attribute", "diceCount", "diceRolled", "wildDie", "total", "complication", "doubled", "extraDice", "rollFlag", "linkedRollId", "dcValue", "outcome", "heroPointDelta", "createdAt" }
  ],
  "spaceships": [
    { "id", "userId", "name", "stats", "weapons", "crew", "notes", "createdAt", "updatedAt" }
  ],
  "messages": [
    { "id", "userId", "author", "text", "createdAt" }
  ],
  "gmRollRequests": [
    { "id", "gmUserId", "skill", "attribute", "label", "dcType", "dcValue", "dcDiceCount", "status", "createdAt" }
  ],
  "gmRollResponses": [
    { "id", "requestId", "characterId", "characterName", "userId", "diceCount", "diceRolled", "wildDie", "total", "complication", "outcome", "heroPointDelta", "rollFlag", "createdAt" }
  ],
  "gameSessions": []
}
```

---

## 🔍 Testing Checklist

### Core (Verified 2026-06-25)
- [x] Backend starts without errors (node src/server.js on port 5000)
- [x] Frontend loads at http://localhost:3000
- [x] Can register new user with display name
- [x] Can login with registered credentials
- [x] Can create character with full attribute/skill sheet
- [x] Roll buttons work on character sheet skills
- [x] Roll modal: setup → roll → result flow works
- [x] Roll appears in Roll Log / Chat tab
- [x] Chat messages persist and display alongside rolls
- [x] Spacecraft page loads

### GM Roll System (Verified 2026-06-25)
- [x] GM can select skill/attribute from dropdown
- [x] Static DC: number input + difficulty quick-select buttons work
- [x] Dice DC: roll button generates random DC sum
- [x] "Call for Roll" creates active request
- [x] GM Roll Modal pops up for player (even on non-GM tabs)
- [x] Player can roll dice against DC in modal
- [x] Success outcome displays correctly (total > DC, wild 2-5)
- [x] Fail outcome displays correctly (total ≤ DC)
- [x] Double Down works in GM roll modal
- [x] GM sees responses with outcome badges in real-time
- [x] "Close Roll" resets GM tab to new roll form
- [x] GM_ROLL entries appear in Roll Log with proper formatting
- [x] Recent Rolls panel on GM tab shows roll history
- [ ] Choice scenario: wild die 6 + beat DC (exceptional vs success) — not yet hit randomly
- [ ] Choice scenario: wild die 1 + beat DC (partial vs fail) — not yet hit randomly
- [ ] Critical Fail scenario (total ≤ DC + wild 1) — not yet hit randomly
- [ ] Re-Roll in GM roll modal — not tested (would need HP)

### Damage Rolls & Exceptional Success (Verified 2026-06-25)
- [x] Roll button visible next to weapon damage on Character Sheet
- [x] Damage modal opens with correct dice count (parsed from formula)
- [x] Damage roll: plain d6 sum, no wild die — correct
- [x] Exceptional Success button: doubles dice for free (no HP cost)
- [x] Undo exceptional success: does not refund HP
- [x] Damage roll appears in Roll Log with [Damage] tag, weapon name, formula, total
- [x] Exceptional Success button on skill/attribute roll modal — works, free doubling
- [x] Exceptional Success button on GM roll modal — works, free doubling

---

**Last Updated:** 2026-06-26 (v1.2.0 release)
**Last Work Done:** Decline GM roll requests (X button + roll log entry) + spacecraft stats grid width fix
**Status:** v1.2.0 — decline GM rolls, spacecraft grid fix, browser-tested, documented
