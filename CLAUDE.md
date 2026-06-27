# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Work Tracking

**When you complete work on this project, update [WORK_LOG.md](WORK_LOG.md).** This file tracks completed features, current progress, known issues, and next steps.

## Development Commands

```bash
npm install          # Install all dependencies (root + frontend + backend via workspaces)
npm run dev          # Start both frontend and backend concurrently
npm run dev:frontend # Frontend only (Vite dev server, http://localhost:3000)
npm run dev:backend  # Backend only (Node --watch, http://localhost:5000)
npm run build        # Production build (frontend only — backend has no build step)
```

No test suite exists yet. No linter is configured at the root level (frontend has an eslint script but no eslint config file).

All data persists in `backend/data/db.json` (lowdb, auto-created, gitignored). Delete it to reset all data.

## Architecture

### Overview

D62e is a TTRPG (D6 Second Edition) platform. React frontend talks to Express backend via REST + polling. No WebSocket — all real-time features use `setInterval` polling (3s for chat/characters, 5s for GM rolls).

### Frontend Data Flow

`App.jsx` is the central state holder. It owns:
- `currentUser` (persisted in localStorage)
- `myCharacters` (polled every 3s)
- `activeGMRoll` (polled every 3s)
- `maxDice` global cap (polled every 3s via `/api/settings`)

These are passed down as props to page components. The GM roll modal (`GMRollModal`) mounts at the App level so it can appear over any tab.

Tab routing is manual state (`currentPage` string), not a router library. The `gm` tab is conditionally rendered based on `currentUser.isGM`.

### Dice System (`frontend/src/utils/dice.js`)

Two rolling functions with distinct mechanics:
- `rollDice(count)` — Wild Die rules: first die explodes on 6 (keep rolling/adding), complication on 1 (wild=0, remove highest other die). Returns die objects with `{value, isWild, rolls, exploded, rawFirst}`.
- `rollPlainDice(count)` — Simple d6 sum, no wild die. Used for GM DC rolls and damage.

`calculateTotal(diceResults)` handles the wild-die-1 complication logic (zeroing wild, removing highest).

`evaluateGMRollOutcome(total, wildDie, dcValue)` determines 5-tier outcome and hero point awards. Wild 6 + beat DC and wild 1 + beat DC produce `hasChoice: true` for player decision.

### Roll Modals

Three modal components share similar structure but have distinct mechanics:
- `RollModal` — Skill/attribute rolls. Setup phase (extra dice, Double Dice) → result phase (re-roll, double down).
- `GMRollModal` — GM-initiated rolls. Adds choice phase for wild-6/wild-1 scenarios and outcome reporting.
- Damage rolls are handled inline in `RollModal` via a damage mode — `rollPlainDice`, no wild die.

All modals support: extra dice, Double Dice (1 HP), Re-Roll (1 HP), Double Down (free, complication risk), Exceptional Success (free doubling).

### Character Data Model

Defined in `frontend/src/data/attributes.js`. Seven attributes (Agility, Brawn, Knowledge, Perception, Charm, Mechanical, Technical), each with 4-6 skills. Dice pool = attribute dice + skill dice. `getDicePool(character, attrKey, skillKey)` computes this.

Character objects store `attributes.{attrKey}.dice` (attribute level) and `attributes.{attrKey}.skills.{skillKey}` (skill level).

### Backend

Express routes under `/api`. All CRUD follows the same pattern: lowdb array, `generateId()` (uuid), `findById()`, `findIndexById()`. See `backend/README.md` for endpoint reference.

The GM roll lifecycle spans multiple endpoints: create → poll active → respond/decline → update outcome → close. Responses are stored in both `gmRollResponses` (for polling) and `rolls` (for roll log display).

### Styling

All CSS lives in `frontend/src/App.css` — single file, dark theme. No CSS modules or preprocessor.

## Conventions

- Plain JavaScript, no TypeScript
- React functional components with hooks
- `API_URL` from `frontend/src/config.js` — all fetch calls use this
- Shared constants in `frontend/src/data/` (attribute definitions, outcome labels/colors)
- Backend uses ES modules (`"type": "module"` in package.json)
- Auth is plain user ID in localStorage — no JWT, no password hashing

## Token Usage Guidelines

When implementing new features, prefer lightweight approaches that reduce Claude Code token consumption without impacting functionality:

- **UI hints over complex state machines** — For per-round modifiers (running penalty, multi-action penalty, aiming bonus), use reminder text and the existing Extra Dice counter (which supports negative values) instead of building dedicated tracking UIs with backend persistence. Players adjust the counter as needed.
- **Reuse existing controls** — Before adding a new input/button/modal, check if an existing one can serve the purpose (e.g., Extra Dice covers any temporary dice modifier).
- **Skip backend work when client-only suffices** — Ephemeral per-round state doesn't need API endpoints or database fields. Only persist state that must survive a page refresh or be visible to other users.
- **Batch related changes** — Group small related items into a single implementation pass rather than separate feature branches.

## Key References

- [ORCHESTRATION.md](ORCHESTRATION.md) — D6 2e game rules as implemented
- [WORK_LOG.md](WORK_LOG.md) — Development history, known issues, next steps
- [QUICKSTART.md](QUICKSTART.md) — Setup instructions
- [backend/README.md](backend/README.md) — API endpoint reference
- [D6_System_2e_Rulebook.txt](D6_System_2e_Rulebook.txt) — Full D6 Second Edition rulebook extracted as plain text (5340 lines). Use this as the authoritative source when implementing or verifying game mechanics. Magic and superhero modules are present but not used in this campaign.
