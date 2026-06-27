# D62e Development Work Log

This document tracks all completed work, current progress, and next steps. **Update this file when work is completed.**

## 🎯 TL;DR — Current Status

**Version:** 1.6.0 — Opposed Rolls (live), collapsible panel with preset pairings, defender popup modal.

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
- Vehicle sheet (stats, weapons, crew, game rules panels)
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
# - "Update WORK_LOG.md: completed vehicle routes"

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
- [x] Created frontend/src/pages/VehiclePage.jsx - Placeholder for later
- [x] Created frontend/.env with API URL configuration
- [x] Created frontend/README.md with setup and features

### Phase 4: Display Name & Tab Redesign
- [x] Added displayName field to user registration (backend + frontend)
- [x] Login returns displayName; navbar shows displayName
- [x] Added PATCH /api/users/:userId endpoint for updating display name
- [x] Renamed tabs: Character Sheet, Vehicle, Roll Log / Chat, Game Master

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

### Phase 6: Vehicle System (based on player Excel Starship sheet)
- [x] Created backend/src/routes/vehicles.js - Full CRUD for vehicles
- [x] Registered vehicle routes in server.js
- [x] Vehicle stats: Navicomp, Maneuverability, Engines, Hull, Shield
- [x] Computed stats: Defense (Hull x5), Resist Damage (Hull + Shield), Evasion Bonus (Piloting + Maneuverability)
- [x] Vehicle weapons table (qty, name, damage, notes)
- [x] Crew stations: Captain (moving), Helm (evading), Tactical (attacking), Operations (resist damage), Engineer (repairs)
- [x] Quick reference panels: Navigation rules, Vehicle Combat, Damage & Repair, Crew Roles
- [x] Vehicle notes field
- [x] Full edit mode with save/cancel
- [x] Vehicle selector bar with New/Edit/Delete
- [x] Added vehicle CSS (stats grid, computed stats, crew grid)

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

### v1.2.0: Decline GM Rolls + Vehicle Fix (2026-06-26)
- [x] **Decline GM roll requests** — players can click X to close the GM roll modal without rolling; records a `GM_ROLL_DECLINED` entry in the roll log and a response in `gmRollResponses` (so the poll stops showing the request)
- [x] **Decline endpoint** — `POST /api/gm-rolls/:id/decline` records the decline and adds roll log entry
- [x] **Roll log display** — declined rolls show as `[GM Roll — Declined]` with gray styling and italic "Declined" text
- [x] **Vehicle stats grid fix** — widened grid minimum from 180px to 210px so "Maneuverability" label doesn't overflow into the value field

### v1.3.0: Vehicle Action Rolls + Rename (2026-06-26)
- [x] **Spaceship→Vehicle rename** — all references to "spaceship/spacecraft/ship" changed to "vehicle" across code, CSS classes, database schema, routes, and documentation
  - [x] `spaceships.js` route → `vehicles.js`, CSS `ship-*` → `vehicle-*`, db.json key `spaceships` → `vehicles`
  - [x] Deleted old `SpaceshipPage.jsx` and `spaceships.js` files
  - [x] Updated ORCHESTRATION.md, README.md, backend/README.md, frontend/README.md
- [x] **Vehicle Action Rolls** — four rollable vehicle actions with wild die mechanics:
  - [x] **Movement** — Engines dice only (e.g., Engines 2 → 2D6 wild die roll)
  - [x] **Navigate** — Character's full Navigation dice pool + vehicle Navicomp dice
  - [x] **Evade** — Character's Piloting skill only (NOT attribute) + Maneuverability dice + Defense as flat bonus added to total
  - [x] **Resist Damage** — Hull + Shield dice combined (wild die roll)
- [x] **Vehicle Weapon Damage Rolls** — Roll button on each weapon in the weapons table; plain d6 sum (no wild die), same as character weapon damage
- [x] **VehicleRollModal** — new component (`frontend/src/components/VehicleRollModal.jsx`) for vehicle action rolls with flexible `breakdownParts` array, flat bonus support, wild die mechanics, hero point integration (Double Dice, Re-Roll, Double Down, Exceptional Success)
- [x] **VehicleDamageModal** — inline damage modal in VehiclePage for vehicle weapon damage (plain d6, no wild die)
- [x] **Crew Member selector** — character dropdown on Vehicle page; shows Navigation pool, Piloting skill, and Hero Points; needed for Navigate and Evade rolls
- [x] **Defense formula fix** — changed from `Hull × 5` to `Hull × 5 + Shield` (e.g., hull=2, shield=1 → defense=11)
- [x] **maxDice prop** — passed from App.jsx to VehiclePage so GM dice cap applies to vehicle rolls
- [x] **Vehicle actions CSS** — action rows with label, description, dice breakdown, and Roll button
- [x] **Browser tested** — Movement, Navigate, Evade (with flat defense bonus), Resist Damage, weapon damage rolls all verified working

### v1.4.0: Advanced Skills + Jupiter Drive Navigation Fix (2026-06-26)
- [x] **Advanced Skills system** — new skill category for skills that can't be used untrained and augment other skills
  - [x] Four advanced skills: Jupiter Drive (Navigation), Surgery (Medicine), Perform (Persuasion), Cryptography (Computers)
  - [x] Dice pool = advanced skill + base skill + base skill's attribute (e.g., Jupiter Drive 2 + Navigation 4 + Mechanical 2 = 8D)
  - [x] Cannot roll if advanced skill is 0 (untrained) — Roll button disabled with tooltip
  - [x] "Advanced" section on character sheet between attributes grid and weapons
  - [x] Each skill shows its base skill in parentheses, skill dice, and total pool
  - [x] Full edit mode support — number inputs for each advanced skill
  - [x] Roll modal shows correct breakdown: attribute + (advanced + base skill) = total
- [x] **Data model** — `advancedSkills` object added to character model with `jupiterDrive`, `surgery`, `perform`, `cryptography` keys (default 0)
  - [x] `ADVANCED_SKILL_DEFINITIONS` in `attributes.js` with base attribute/skill references
  - [x] `getAdvancedDicePool()` utility function
  - [x] Backend: `advancedSkills` in default character template and PATCH allowed fields
- [x] **Vehicle Navigate fix** — Navigate action now uses Jupiter Drive instead of plain Navigation
  - [x] Pool = Jupiter Drive (advanced + Navigation + Mechanical) + Navicomp
  - [x] Disabled with "Requires Jupiter Drive" note if crew member has 0 Jupiter Drive
  - [x] Crew member stats display changed from "Navigation XD" to "Jupiter Drive XD"
  - [x] Quick reference updated: "Jupiter Drive roll: Difficulty 15 (25 if rushed)"
- [x] **Vehicle Attack action** — new rollable action using character's Gunnery skill (Perception attr + Gunnery skill)
  - [x] Crew member stats display now shows "Gunnery XD | Jupiter Drive XD | Piloting XD | HP: X"
- [x] **Size Advantage system** — adjustable +/- control on all vehicle roll modals, default 0, scales per size category
  - [x] **Smaller Size Attack Bonus** — +1D per size category on Attack rolls
  - [x] **Smaller Size Dodge Bonus** — +3 flat per size category on Evade rolls (added to Defense)
  - [x] **Larger Size Resist Bonus** — +1D per size category on Resist Damage rolls
  - [x] **Larger Size Damage Bonus** — +1D per size category on vehicle weapon damage rolls
  - [x] Green indicator shows bonus value when size > 0 (e.g., "+2D" or "+6")
  - [x] Dice bonuses participate in doubling; flat bonuses shown in result breakdown
- [x] **Clear Log button (GM only)** — red "Clear Log" button on Roll Log / Chat tab clears all rolls and chat messages
  - [x] `DELETE /api/rolls` and `DELETE /api/messages` endpoints added to backend
  - [x] Confirmation dialog before clearing ("Clear all rolls and chat messages? This cannot be undone.")
  - [x] Clears both backend data and local state immediately
  - [x] Only visible to GM users (non-GM players see Refresh button only)
- [x] **Browser tested** — Advanced skills, vehicle Attack, size bonuses (dice and flat types), Clear Log all verified working

### v1.5.0: NPC/Foe Management (2026-06-27)
- [x] **NPC Character Sheets** — GM's "Characters" tab becomes "NPCs" when logged in as GM; creates characters with `isNPC: true` flag
  - [x] Backend: `POST /api/characters` accepts `isNPC`, `GET` supports `?isNPC=true/false` query filter, `PATCH` allows `isNPC` field
  - [x] Same full character sheet structure (attributes, skills, weapons, wounds, etc.)
  - [x] GM roll prompts (Call for Roll, Initiative) do NOT prompt NPC characters
- [x] **NPC Vehicles** — GM's "Vehicles" tab becomes "NPC Vehicles"; vehicles created with `isNPC: true`
  - [x] Backend: same `isNPC` support on vehicles routes (POST, GET filter, PATCH)
- [x] **Duplicate Button** — yellow "Duplicate" button on character selector bar; clones all character data (attributes, skills, weapons, talents, etc.) via POST + PATCH pattern
- [x] **Initiative Button** — cyan "Initiative" button on character sheet; rolls Perception dice (wild die rules) and POSTs result to `/api/initiative` endpoint
  - [x] New `backend/src/routes/initiative.js` — full CRUD: POST (add entry), GET (sorted by total desc), DELETE all, DELETE by id
  - [x] Registered in `backend/src/server.js`
  - [x] GM tab polls `/api/initiative` every 5s, merges API entries into localStorage initiative tracker
  - [x] Initiative entries show `[NPC]` tag in orange when `entry.isNPC` is true
- [x] **[NPC] Tags in Roll Log** — skill rolls, damage rolls, and GM rolls display orange `[NPC]` badge when the rolling character has `isNPC: true`
  - [x] `characterName` and `isNPC` fields added to roll POST endpoints
  - [x] GamePage resolves NPC status from roll data or character lookup
- [x] **GM Tab Filtering** — character overview on GM tab filters to `isNPC=false` (only player characters); response count excludes NPCs
- [x] **Dynamic Tab Labels** — `getTabs(isGM)` function replaces static TABS constant; GM sees "NPCs" / "NPC Vehicles" instead of "Characters" / "Vehicles"
- [x] **Browser tested** — NPC creation, duplicate, initiative posting, GM tab filtering, [NPC] tags in roll log, tab labels all verified

### v1.6.0: Opposed Rolls (2026-06-27)
- [x] **Opposed Roll Panel** — collapsible "Opposed Roll" section on Roll Log / Chat tab with full setup → rolling → waiting → complete flow
  - [x] Initiator/Defender character selectors (all characters visible, NPC tags shown)
  - [x] 12 preset pairings from D6 2e rulebook across 3 categories: Combat (4), Social (4), Skill (3) + Damage vs Resistance (disabled, uses weapon buttons)
  - [x] Preset buttons show live dice pools (green for attacker, yellow for defender) based on selected characters
  - [x] Phase transitions: setup → rolling_initiator → waiting/complete
  - [x] Complete result panel shows both totals, winner highlight, margin, "New Opposed Roll" button
- [x] **Static Defense Presets** — Combat presets (Melee vs Parry, Shooting/Throwing/Gunnery vs Dodge) resolve immediately
  - [x] Dodge = Perception × 5 (+ 10 if prone); Parry = Agility × 5 (capped at 10 if prone)
  - [x] Initiator rolls via full RollModal, result compared to computed static value, winner determined instantly
- [x] **Active Opposed Rolls** — Social and Skill presets create pending rolls requiring both sides to roll
  - [x] Initiator rolls via RollModal, record saved as `pending_defender`
  - [x] Defender gets popup modal (OpposedRollModal) via 3s polling in App.jsx
  - [x] GM-aware polling: `isGM=true` param returns pending rolls targeting any NPC, not just GM's own characters
  - [x] Waiting → complete transition: GamePage useEffect detects when polled data shows the roll is resolved
- [x] **OpposedRollModal** — full defender roll modal mounted at App.jsx level (like GMRollModal)
  - [x] Shows initiator's result at top (character name, skill, total)
  - [x] Defender roll setup: dice pool from skill, Extra Dice, Double Dice (HP cost), Exceptional Success (free)
  - [x] Wound penalty applied (with exemptions for special skills)
  - [x] Roll hints from talents/perks/flaws/cybernetics
  - [x] Result phase: dice visuals, wild die, complication notice, winner/margin display
  - [x] Re-Roll (HP cost) and Double Down (free) options
  - [x] Hero point changes persisted to backend
- [x] **Winner Determination** — `determineWinner()`: higher total wins; ties: PC beats NPC, NPC vs NPC or PC vs PC flagged as tie
- [x] **Opposed Roll Log Entries** — interleaved with rolls and chat, sorted by timestamp
  - [x] Shows both sides: initiator name/skill/total vs defender name/skill/total
  - [x] [NPC] tags on NPC characters, [Opposed Roll] tag header
  - [x] Pending rolls show "Waiting for X to roll..." in yellow italic
  - [x] Complete rolls show winner with color-coded highlight and margin
- [x] **Backend API** — `backend/src/routes/opposedRolls.js` with 4 endpoints
  - [x] `POST /api/opposed-rolls` — create record (initiator data pre-filled, static defense resolves immediately)
  - [x] `GET /api/opposed-rolls/active?userId=X&isGM=true` — poll for pending defender rolls
  - [x] `POST /api/opposed-rolls/:id/respond` — defender submits roll, determines winner
  - [x] `GET /api/opposed-rolls` — recent rolls for log display (last 50)
  - [x] `DELETE /api/opposed-rolls` — clear all (used by Clear Log button)
- [x] **Preset Data** — `frontend/src/data/opposedPresets.js` with `OPPOSED_PRESETS`, `getStaticDefense()`, `getSkillLabel()`, `getDefenderDicePool()`, `determineWinner()`
- [x] **Clear Log integration** — Clear Log button on Roll Log tab now also clears opposed rolls
- [x] **Browser tested** — static defense (Shooting vs Dodge), NPC vs NPC active roll (Stealth vs Investigation), NPC vs Player active roll (Intimidation vs Willpower), roll log display, waiting→complete transition all verified

### v1.0.0 Refactoring & Documentation
- [x] **Extracted shared `API_URL`** — created `frontend/src/config.js`, removed 6 duplicate declarations across pages/components
- [x] **Extracted shared outcome constants** — created `frontend/src/data/outcomes.js` (`OUTCOME_LABELS`, `OUTCOME_COLORS`), removed duplication from GameMasterPage, GMRollModal, GamePage
- [x] **Server-side filtering** — added `?userId=` query param support to characters and vehicles routes, updated frontend to use params instead of fetching all + filtering client-side
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
✅ **Advanced Skills** — Jupiter Drive, Surgery, Perform, Cryptography — untrained restriction, combined dice pools, character sheet section
✅ **Vehicle** — stats, weapons, crew, reference panels, **action rolls** (Movement, Navigate via Jupiter Drive, Evade, Resist Damage), weapon damage rolls, crew member selector
✅ **Game Master tab** — roll initiator (static/dice DC), response tracking, difficulty table, recent rolls
✅ **Dark-themed UI** — responsive, modern, tab-based navigation
✅ All data persists in lowdb (backend/data/db.json)

### What Still Needs Work
- [ ] **WebSocket** — true real-time (currently polling every 3-5s, works but not instant)
- [ ] **Game sessions** — group players, manage initiative, track resources
- [x] **Opposed rolls** — collapsible panel on Game page with 12 presets, static + active defense, defender popup modal
- [ ] **Password hashing** — currently plain text (use bcrypt)
- [ ] **JWT tokens** — proper authentication (currently just user ID)
- [ ] **Input validation** — form validation on client and server

---

## 🎯 Next Steps (Priority Order)

### Short Term (Critical Path)
1. **WebSocket** — replace polling with real-time push (currently 3-5s polling works but isn't instant)
2. **Game sessions** — let players join a session, share rolls/chat within a group
3. ~~**Attack rolls UI**~~ — ✅ Done (v1.6.0 Opposed Rolls)

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

## 📖 Game Rules Gap Analysis (Rulebook Review — Space Campaign)

Items identified from D6 Second Edition rulebook that are missing from the app. Magic and superhero modules excluded (not used in this campaign).

### Combat Mechanics
- [x] **Wound State Tracking** — Wound level (Healthy/Wounded/Incapacitated/Mortally Wounded/Dead) + condition (Clear/Staggered/Stunned). Wounded = −1D, Staggered = −1D, stackable to −2D. Penalty auto-applied in RollModal and GMRollModal with clear notice. Incapacitated+ shows "cannot act" warning. Persisted server-side, interactive outside edit mode.
- [x] **Brawn Resistance Roll** — Added "Resistance" skill under Brawn. Pool = Brawn + Armor dice. Armor displayed as die code (e.g., "3D"). Wound penalty exempt per rulebook. Works in both player RollModal and GM-initiated rolls.
- [x] **Vehicle/Starship Wound Tracking** — Vehicles have 5-state wound track (Undamaged/Light/Heavy/Severe/Destroyed) with clickable buttons like character wounds. Light=−1D, Heavy=−2D, Severe=−3D + "cannot operate" warning. Penalty applied to all vehicle action rolls (Movement, Navigate, Attack, Evade, Resist Damage) with clear notice in roll modal. Repair rolls exempt from penalty. Persisted server-side.
- [x] **Repair Rolls for Vehicles & Ships** — Repair action added to Vehicle Actions using crew member's Mechanical + Use/Repair skill. Wild die roll via VehicleRollModal. Crew member stats display now shows Repair dice.
- [x] **Attack Roll vs. Defense Structured Flow** — Opposed Roll panel on Roll Log / Chat tab. Attacker rolls weapon skill via RollModal; static defense (Dodge/Parry) resolves immediately, active defense (Willpower, Investigation, etc.) creates pending roll for defender. 12 presets across Combat, Social, and Skill categories.
- [x] **In-Round Condition Flags** — Running applies −1D to all actions. Handled via Extra Dice counter (supports negative values) + reminder text at bottom of character sheet. No dedicated tracking UI needed.
- [x] **Preparing/Aiming Bonus** — Spending a full round aiming grants +1D to next action. Handled via Extra Dice counter (+1) + reminder text at bottom of character sheet.
- [x] **Multi-Action Penalty** — −1D per extra action in a round. Handled via Extra Dice counter (−1 per extra action) + reminder text at bottom of character sheet.
- [x] **Initiative Tracker** — GM tab has full initiative tracker: add characters/NPCs with Perception roll values, auto-sorts highest first, active turn marker (green highlight) cycles through list with Next/Prev buttons and wraps around, GM can reorder (move up/down), edit names/rolls inline, and remove entries. "Roll Initiative" button broadcasts a straight Perception roll to all players via the GM Roll system (DC 0); player responses automatically populate the tracker with character names and totals, sorted by roll. Persisted in localStorage. Replaced the Recent Rolls panel (available in Roll Log tab).
- [x] **Prone Status & Defense Adjustment** — Prone added as a condition in the wound tracker. When active, Dodge becomes base + 10 (harder to hit at range), Parry capped at 10 (easier to hit in melee). Values update in real-time on the character sheet header with orange styling and explanatory notes.
- [x] **Full Defense Stance** — Character sheet shows Full Defense values below Dodge/Parry when the character has Acrobatics or Melee skills. Displays "Full Defense: Dodge X (+Acrobatics YD) · Parry X (+Melee YD)". Also added as a reminder in the Dice Modifier Reminders section.

### Character Advancement
- [ ] **Skill Specialization System** — Narrow specialization within a skill grants +1D when applicable. Max specializations = skill rating. No specialization tracking on character sheet.
- [x] **Perks/Flaws/Talents/Cybernetics Reference System** — All four sections on character sheet now support selecting entries from the D6 2e rulebook via a scrollable picker ("+ Book" button) with names, costs, and mechanical effects pre-filled. Players can also add custom entries ("+ Custom" button). In view mode, clicking an entry with a known rulebook match expands to show its mechanical effect. Cybernetics section added using superhero powers from the rulebook, re-flavored as cybernetic implants/cyborg attachments. Data stored in `frontend/src/data/characterOptions.js`.
- [x] **Item Reference Lists** — Items section on character sheet now has a "+ Book" button with grouped category picker (Armor, Blaster Weapons, Energy Weapons, Laser Weapons, Melee Weapons, Gear & Equipment). Each item includes name and stats/effects from the rulebook. `ListSection` component updated to handle both flat arrays and grouped objects via `referenceGrouped` prop. Category headers are sticky within the scrollable picker.
- [x] **Roll Hints / Dice Modifier Reminders** — When opening a roll modal (RollModal or GMRollModal), the system checks the character's talents, perks, flaws, and cybernetics against the reference data for matching hints. Hints are matched by attribute key or skill key (with `'any'` wildcard for universal effects like Good Luck). Positive hints (talents/perks/cybernetics) show in green; warning hints (flaws) show in red. Each hint displays the source type, entry name (with rank if applicable), and a reminder note (e.g., "Talent: Youthful Appearance — +1D/rank to social rolls"). Implemented via `getRollHints()` in `characterOptions.js`.

### Starship / Space Operations
- [ ] **Crew Requirement & Undercrew Penalty** — Each ship has a minimum crew count. Every missing crew member applies −1D to all ship-related rolls. No crew requirement or penalty system.
- [ ] **Interstellar Jump Two-Roll Sequence** — Navigation roll (Difficulty 15) to plot the course, then Computers roll (Difficulty 15) to execute; Wild Die 1 on the Computers roll triggers a Mishap. Currently jump navigation uses a single generic roll.
- [x] **Starship Scale vs. Personal Scale** — Scale bonuses added to the Dice Modifier Reminders section on the character sheet: Smaller Size Attack Bonus (+1D), Smaller Size Dodge Bonus (+3), Larger Size Damage Bonus (+1D), Larger Size Resist Bonus (+1D). Scale tiers listed: Person → Speeder → Tank → Light Freighter → Heavy Freighter → Capital Ship. Players use Extra Dice to apply.

### Equipment & Items
- [ ] **Ammo Tracking** — Ammo field is a free-text box; rules call for decrementing a numeric counter per shot. No numeric decrement mechanic.
- [x] **Science Fiction Equipment Reference** — Item reference lists added to character sheet with grouped categories: Armor (6), Blaster Weapons (3), Energy Weapons (2), Laser Weapons (2), Melee Weapons (3), Gear & Equipment (12). Selectable via "+ Book" picker with pre-filled names and stats.
- [x] **Armor as Die Code** — Armor now displays as "3D" on character sheet header. Used as dice in the Resistance skill pool (Brawn + Armor). Existing numeric field works as die code.

### GM Tools
- [x] **NPC/Foe Management** — GM's Characters/Vehicles tabs become NPC tabs with `isNPC` flag. Full character sheet for NPCs with duplicate button, initiative button (posts to API tracker), [NPC] tags in roll log. GM roll prompts exclude NPCs. GM tab overview filtered to player characters only.
- [x] **Opposed Rolls (live)** — Collapsible panel on Roll Log / Chat tab with 12 presets (Combat, Social, Skill). Initiator rolls via RollModal; static defense resolves immediately, active defense sends defender popup via polling. Winner determined by higher total, PC wins ties vs NPC. Results shown in roll log with both sides' totals and margin.
- [x] **Environmental Hazard Tracking** — Environmental Hazards reference table added to GM tab with 7 hazard types (Extreme Heat, Cold, Drowning, Toxic Gas, Vacuum, Fire, Radiation), each with difficulty, interval, and damage/effect details. Color-coded hazard names.

### Advanced Modules (Space Campaign Applicable)
- [ ] **Psionics** — Three standalone skills: Kinesis, Perceive, Reform; each has a list of powers requiring a roll to activate. Not implemented.
- [ ] **Cyberpunk/Cyberware** — Cyberware declared as Talents, limited by Knowledge die code, can be hacked. No cyberware distinction or Knowledge-based limit.
- [x] **Hacking** — Hacking Reference table added to GM tab with Computers vs. Firewall rules, 6-tier result table (Fail by 10+ through Beat DC by 10+), color-coded outcomes, and Firewall difficulty examples (Personal 10, Corporate 20, Military 30, AI Core 40).
- [x] **Chase Mechanics** — Handled via GM Roll requests (opposed rolls each round) + GM Notes textarea for tracking distance/progress. No dedicated chase UI needed.

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
│   │       ├── vehicles.js
│   │       ├── messages.js
│   │       ├── gmRolls.js
│   │       ├── initiative.js
│   │       └── opposedRolls.js
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
│   │   │   └── VehiclePage.jsx
│   │   ├── components/
│   │   │   ├── RollModal.jsx
│   │   │   ├── GMRollModal.jsx
│   │   │   ├── OpposedRollModal.jsx
│   │   │   └── VehicleRollModal.jsx
│   │   ├── data/
│   │   │   ├── attributes.js
│   │   │   ├── characterOptions.js
│   │   │   ├── opposedPresets.js
│   │   │   ├── outcomes.js
│   │   │   ├── vehicleWounds.js
│   │   │   └── wounds.js
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
- `POST /api/characters` — Create character (userId, name, isNPC)
- `GET /api/characters?userId=X&isNPC=true/false` — Get characters (optional server-side userId and isNPC filters)
- `GET /api/characters/:characterId` — Get character sheet
- `PATCH /api/characters/:characterId` — Update (attributes, skills, heroPoints, armor, weapons, talents, flaws, perks, items, notes)
- `DELETE /api/characters/:characterId` — Delete character

### Rolls
- `POST /api/rolls/skill` — Save skill roll (characterId, skill, attribute, diceCount, diceRolled, wildDie, total, complication, doubled, extraDice, rollFlag, linkedRollId)
- `POST /api/rolls/attack` — Save attack roll (attackerId, defenderId, attackerRoll, defenderRoll)
- `POST /api/rolls/damage` — Save damage roll (characterId, characterName, weaponName, damageFormula, diceCount, diceRolled, total, doubled, extraDice, rollFlag)
- `GET /api/rolls` — Get all rolls (50 newest)
- `GET /api/rolls/character/:characterId` — Get character's rolls
- `DELETE /api/rolls` — Clear all rolls

### Messages
- `GET /api/messages` — Get last 100 messages (newest first)
- `POST /api/messages` — Send message (userId, author, text)
- `DELETE /api/messages` — Clear all messages

### GM Rolls
- `POST /api/gm-rolls` — GM creates roll request (skill, attribute, label, dcType, dcValue)
- `GET /api/gm-rolls/active?userId=X` — Player polls for pending requests (returns active requests player hasn't responded to)
- `POST /api/gm-rolls/:id/respond` — Player submits roll response (also saves to rolls as GM_ROLL, updates character HP)
- `POST /api/gm-rolls/:id/decline` — Player declines roll request (saves response + GM_ROLL_DECLINED to roll log)
- `PATCH /api/gm-rolls/:id/respond/:responseId` — Update response for outcome choice (wild-6 or wild-1 scenarios)
- `GET /api/gm-rolls/:id/responses` — GM polls for incoming responses
- `PATCH /api/gm-rolls/:id` — GM closes/cancels request (sets status to "closed"/"cancelled")
- `GET /api/gm-rolls` — Returns last 50 GM roll requests for history

### Vehicles
- `POST /api/vehicles` — Create vehicle (userId, name, isNPC)
- `GET /api/vehicles?userId=X&isNPC=true/false` — Get vehicles (optional server-side userId and isNPC filters)
- `GET /api/vehicles/:id` — Get vehicle details
- `PATCH /api/vehicles/:id` — Update (stats, weapons, crew, notes, isNPC)
- `DELETE /api/vehicles/:id` — Delete vehicle

### Opposed Rolls
- `POST /api/opposed-rolls` — Create opposed roll (initiator data pre-filled; static defense resolves immediately)
- `GET /api/opposed-rolls/active?userId=X&isGM=true` — Poll for pending defender rolls (GM gets NPC defenders too)
- `POST /api/opposed-rolls/:id/respond` — Defender submits roll (determines winner, updates record)
- `GET /api/opposed-rolls` — Get recent opposed rolls (last 50, for roll log display)
- `DELETE /api/opposed-rolls` — Clear all opposed rolls

### Initiative
- `POST /api/initiative` — Add initiative entry (characterId, characterName, total, diceResults, isNPC, isVehicle)
- `GET /api/initiative` — Get all entries sorted by total descending
- `DELETE /api/initiative` — Clear all entries
- `DELETE /api/initiative/:id` — Remove single entry

---

## 💾 Data Schema (lowdb)

Current db.json structure:
```json
{
  "users": [
    { "id", "username", "password", "displayName", "createdAt" }
  ],
  "characters": [
    { "id", "userId", "name", "isNPC", "attributes", "heroPoints", "armor", "weapons", "talents", "flaws", "perks", "items", "notes", "createdAt", "updatedAt" }
  ],
  "rolls": [
    { "id", "characterId", "rollType", "skill", "attribute", "diceCount", "diceRolled", "wildDie", "total", "complication", "doubled", "extraDice", "rollFlag", "linkedRollId", "dcValue", "outcome", "heroPointDelta", "createdAt" }
  ],
  "vehicles": [
    { "id", "userId", "name", "isNPC", "stats", "weapons", "crew", "notes", "createdAt", "updatedAt" }
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
  "initiative": [
    { "id", "characterId", "characterName", "total", "diceResults", "isNPC", "isVehicle", "createdAt" }
  ],
  "opposedRolls": [
    { "id", "initiatorUserId", "initiatorCharacterId", "initiatorCharacterName", "initiatorIsNPC", "preset", "initiatorSkillLabel", "initiatorDiceCount", "initiatorDiceRolled", "initiatorWildDie", "initiatorTotal", "initiatorComplication", "defenderUserId", "defenderCharacterId", "defenderCharacterName", "defenderIsNPC", "defenderSkillLabel", "defenderIsStatic", "defenderTotal", "defenderDiceCount", "defenderDiceRolled", "defenderWildDie", "defenderComplication", "winner", "margin", "status", "createdAt" }
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
- [x] Vehicle page loads

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

### Vehicle Action Rolls (Verified 2026-06-26)
- [x] Vehicle page loads with vehicle selector and crew member selector
- [x] Crew member shows Navigation pool, Piloting skill, and Hero Points
- [x] Movement roll: Engines dice only, wild die mechanics
- [x] Navigate roll: character Navigation pool + vehicle Navicomp dice
- [x] Evade roll: Piloting skill only + Maneuverability + Defense flat bonus in total
- [x] Resist Damage roll: Hull + Shield dice combined
- [x] Weapon damage roll: plain d6 sum, no wild die (Roll button in weapons table)
- [x] Defense computed stat: Hull × 5 + Shield (verified hull=1, shield=1 → 6)
- [x] Wild die exploding works in vehicle rolls (verified explosion on Movement roll)
- [x] Complication works in vehicle rolls (verified wild-1 on Evade roll)
- [x] Flat bonus correctly added to dice total in Evade result display
- [x] Hero point options (Double Dice, Re-Roll, Double Down, Exceptional Success) all present

### Damage Rolls & Exceptional Success (Verified 2026-06-25)
- [x] Roll button visible next to weapon damage on Character Sheet
- [x] Damage modal opens with correct dice count (parsed from formula)
- [x] Damage roll: plain d6 sum, no wild die — correct
- [x] Exceptional Success button: doubles dice for free (no HP cost)
- [x] Undo exceptional success: does not refund HP
- [x] Damage roll appears in Roll Log with [Damage] tag, weapon name, formula, total
- [x] Exceptional Success button on skill/attribute roll modal — works, free doubling
- [x] Exceptional Success button on GM roll modal — works, free doubling

### NPC Management (Verified 2026-06-27)
- [x] GM tabs show "NPCs" and "NPC Vehicles" labels
- [x] NPC creation sets `isNPC: true` on character
- [x] Duplicate button clones all character data to new NPC
- [x] Initiative button rolls Perception dice and posts to `/api/initiative`
- [x] GM tab character overview only shows player characters (isNPC=false)
- [x] Initiative tracker receives API entries with [NPC] tag in orange
- [x] Roll log shows [NPC] tags on skill, damage, and GM rolls for NPC characters
- [x] GM Roll prompts do not appear for NPC characters (filtered in App.jsx)

### Opposed Rolls (Verified 2026-06-27)
- [x] Opposed Roll panel opens/closes via collapsible header
- [x] Initiator/Defender selectors show all characters with [NPC] tags
- [x] Preset buttons appear after both characters selected, grouped by category
- [x] Preset buttons show live dice pools (green=attacker, yellow=defender)
- [x] Static defense (Shooting vs Dodge): initiator rolls → result resolves immediately → shows in panel and log
- [x] Active opposed roll (Intimidation vs Willpower): initiator rolls → panel shows "Waiting for defender"
- [x] NPC vs NPC: GM-aware polling returns NPC defender rolls to GM user
- [x] Defender popup (OpposedRollModal): shows initiator result, defender rolls with full dice mechanics
- [x] Winner/margin display in both OpposedRollModal and opposed panel
- [x] Opposed roll entries appear in roll log with both sides' totals
- [x] Pending entries show "Waiting for X to roll..." in yellow italic
- [x] Complete entries show winner highlight with colored border
- [x] Clear Log also clears opposed rolls
- [x] Waiting → complete transition detected via polling (useEffect on opposedRolls state)

---

**Last Updated:** 2026-06-27
**Last Work Done:** Opposed Rolls — collapsible panel with 12 presets, static/active defense, defender popup modal
**Status:** v1.6.0 + all prior features + opposed rolls system
