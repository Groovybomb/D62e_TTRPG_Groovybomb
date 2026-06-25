import { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import CharacterPage from './pages/CharacterPage';
import SpaceshipPage from './pages/SpaceshipPage';
import GamePage from './pages/GamePage';
import GameMasterPage from './pages/GameMasterPage';

const TABS = [
  { key: 'characters', label: 'Character Sheet' },
  { key: 'spaceships', label: 'Spacecraft' },
  { key: 'game', label: 'Roll Log / Chat' },
  { key: 'gm', label: 'Game Master' },
];

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
      setCurrentPage('characters');
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentPage('characters');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentPage('login');
  };

  return (
    <div className="app">
      {currentUser && (
        <nav className="navbar">
          <div className="nav-left">
            <h1>D62e</h1>
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={currentPage === tab.key ? 'active' : ''}
                onClick={() => setCurrentPage(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="nav-right">
            <span>Welcome, {currentUser.displayName}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </nav>
      )}

      <main className="main-content">
        {currentPage === 'login' && (
          <LoginPage onLogin={handleLogin} />
        )}
        {currentPage === 'characters' && currentUser && (
          <CharacterPage userId={currentUser.id} />
        )}
        {currentPage === 'spaceships' && currentUser && (
          <SpaceshipPage userId={currentUser.id} />
        )}
        {currentPage === 'game' && currentUser && (
          <GamePage userId={currentUser.id} displayName={currentUser.displayName} />
        )}
        {currentPage === 'gm' && currentUser && (
          <GameMasterPage userId={currentUser.id} />
        )}
      </main>
    </div>
  );
}

export default App;
