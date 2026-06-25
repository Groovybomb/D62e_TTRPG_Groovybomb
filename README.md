# D62e TTRPG Platform

A web-based platform for playing D6 Second Edition, a tabletop role-playing game. This platform enables players to manage characters, control spaceships, roll dice, chat, and allows a Game Master to orchestrate gameplay.

## Features

- **Authentication**: Login with username, password, and display name
- **Character Sheet**: Full D62e character (7 attributes, 30+ skills, weapons, talents, perks, items)
- **Roll System** ⭐: Click to roll any skill/attribute → modal with wild die mechanics
  - Wild Die explodes on 6 (keep rolling), complication on 1 (wild die = 0, remove highest)
  - Hero Points: spend to Double Dice (2× rolls) or Re-Roll a failed roll
  - Rolls show in Roll Log with color-coded dice (green=6, red=1) and flags (REROLL, DOUBLE DOWN)
- **Spacecraft**: Full ship sheet with stats, weapons, crew, and game rules reference
- **Game Master Tab**: See all players, difficulty table, recent rolls
- **Chat**: Send messages alongside rolls in Roll Log / Chat tab (in-memory, refresh clears)
- **Dark Theme**: Responsive UI optimized for desktop play

## Tech Stack

- **Frontend**: React (Vite) + vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: lowdb (JSON file-based, fine for small groups)
- **Real-time Communication**: None yet (TODO: WebSocket)

## Getting Started

### Prerequisites
- Node.js 16+ or [Python 3.9+] (adjust based on your choice)
- npm or yarn (or equivalent package manager)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd D62e

# Install dependencies
# Frontend
cd frontend && npm install
# Backend
cd ../backend && npm install
```

### Running the Application

```bash
# Start backend
cd backend && npm run dev

# In another terminal, start frontend
cd frontend && npm run dev
```

## Project Structure

See [CLAUDE.md](CLAUDE.md) for detailed codebase documentation.

## Game Rules & Mechanics

See [ORCHESTRATION.md](ORCHESTRATION.md) for game mechanics and roll resolution rules.

## Tracking Progress

- **[WORK_LOG.md](WORK_LOG.md)** - Track completed work, current status, and next steps (update after each work session!)
- **[PROJECT_SETUP.md](PROJECT_SETUP.md)** - Phase-by-phase development plan
- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 3 commands

## Git Workflow & Commits

**Always commit your work to GitHub to track changes.** See [GIT_WORKFLOW.md](GIT_WORKFLOW.md) for:
- Quick commit commands
- How to write good commit messages
- What files NOT to commit
- Team collaboration tips

Quick reference:
```bash
git add .
git commit -m "Description of what you changed"
git push
```

## Contributing

- Commit after every work session
- Update WORK_LOG.md with completed items
- Write clear commit messages (see GIT_WORKFLOW.md)
- Test changes locally before committing

## License

[To be determined]
