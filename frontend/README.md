# D62e Frontend

React-based UI for the D62e TTRPG platform.

## Setup

```bash
npm install
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.jsx         # Register/login with display name + GM flag
│   ├── CharacterPage.jsx     # Character sheet, edit mode, roll buttons, damage rolls
│   ├── VehiclePage.jsx       # Vehicle stats, weapons, crew, game rules panels
│   ├── GamePage.jsx          # Roll log + chat (interleaved), quick roll selector
│   └── GameMasterPage.jsx    # Call for rolls, response tracking, difficulty table
├── components/
│   ├── RollModal.jsx         # Skill/attribute roll popup (setup + result phases)
│   └── GMRollModal.jsx       # GM-initiated roll popup (setup + result + choice)
├── data/
│   ├── attributes.js         # Attribute/skill definitions, getDicePool()
│   └── outcomes.js           # Shared outcome labels and colors
├── utils/
│   └── dice.js               # rollDice(), calculateTotal(), evaluateGMRollOutcome()
├── config.js                 # Shared API_URL constant
├── App.jsx                   # Root component, tab navigation, GM roll polling
├── App.css                   # All styling (dark theme)
└── main.jsx                  # React entry point
```

## Features

- **Login/Registration** with display name and Game Master checkbox
- **Character Sheet** — 7 attributes, 30+ skills, weapons, talents, flaws, perks, items, notes
- **Roll Modal** — wild die mechanics, extra dice, Double Dice, Re-Roll, Double Down, Exceptional Success
- **Damage Rolls** — plain d6 sum from weapon damage formula
- **GM Roll Modal** — polls for GM-called rolls, 5-tier outcomes with Hero Point awards
- **Roll Log / Chat** — interleaved rolls and messages with 3-5s polling
- **Vehicle** — stats, computed values, weapons, crew stations, game rules reference
- **Dark Theme** — responsive design

## Configuration

Create `.env`:
```
VITE_API_URL=http://localhost:5000/api
```
