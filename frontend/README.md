# D62e Frontend

A React-based UI for the D62e TTRPG platform.

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Development server runs on `http://localhost:3000` by default.

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.jsx      # User login/registration
│   ├── CharacterPage.jsx  # Character management
│   ├── SpaceshipPage.jsx  # Spaceship management
│   ├── GamePage.jsx       # Main gameplay interface
│   └── GameMasterPage.jsx # Game Master controls
├── App.jsx                # Main app component with navigation
├── App.css                # Global styles
└── main.jsx               # React entry point
```

## Features

- **Login/Registration**: Create account and authenticate
- **Character Management**: Create, edit, and delete characters
- **Gameplay**: Roll skills, view roll results in real-time
- **Game Master Dashboard**: View all characters and recent rolls
- **Dark Theme**: D&D-inspired dark color scheme

## Connecting to Backend

The frontend expects the backend API at:
- Default: `http://localhost:5000/api`
- Configurable via `VITE_API_URL` environment variable

Create a `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Next Steps

1. Connect all pages to backend endpoints
2. Add WebSocket for real-time updates
3. Implement spaceship management features
4. Add character editing functionality
5. Implement Game Master roll calls
6. Add dice roll animations
