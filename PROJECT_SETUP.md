# Project Setup Guide

This document records the tech stack decisions and development phases completed for D62e v1.

## Tech Stack (Decided)

### Frontend
- **Framework:** React (Vite)
- **Language:** Plain JavaScript
- **Styling:** Custom CSS (dark theme in App.css)
- **State Management:** React hooks (useState, useEffect)

### Backend
- **Language:** Node.js
- **Framework:** Express
- **Database:** lowdb (JSON file-based, `backend/data/db.json`)
- **Utilities:** uuid for ID generation

### Communication
- Polling-based (3-5 second intervals)
- No WebSocket yet

### Authentication
- Plain user ID in localStorage
- No JWT or OAuth yet

## Development Phases (All Complete)

1. **Documentation & Structure** — project scaffolding, markdown docs, monorepo setup
2. **Backend** — Express server, lowdb, user/character/roll/vehicle routes
3. **Frontend** — React app, login, character sheet, game page, GM page
4. **Display Name & Tabs** — user display names, tab redesign
5. **Character Sheet** — full D62e character model (7 attributes, 30+ skills, weapons, etc.)
6. **Vehicle** — vehicle stats, weapons, crew stations, game rules panels
7. **Roll System** — wild die mechanics, Hero Points, roll modal
8. **Chat + GM Rolls** — chat persistence, GM roll calling, 5-tier outcomes, damage rolls
9. **v1 Refactoring** — shared constants, server-side filtering, dead code removal, doc rewrite

## Setup Instructions

See [QUICKSTART.md](QUICKSTART.md) for how to run the application.
