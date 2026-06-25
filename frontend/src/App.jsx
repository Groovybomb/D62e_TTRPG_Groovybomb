import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { API_URL } from './config';
import LoginPage from './pages/LoginPage';
import CharacterPage from './pages/CharacterPage';
import SpaceshipPage from './pages/SpaceshipPage';
import GamePage from './pages/GamePage';
import GameMasterPage from './pages/GameMasterPage';
import GMRollModal from './components/GMRollModal';

const TABS = [
  { key: 'characters', label: 'Character Sheet' },
  { key: 'spaceships', label: 'Spacecraft' },
  { key: 'game', label: 'Roll Log / Chat' },
  { key: 'gm', label: 'Game Master' },
];

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [myCharacters, setMyCharacters] = useState([]);
  const [activeGMRoll, setActiveGMRoll] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
      setCurrentPage('characters');
    }
  }, []);

  const fetchMyCharacters = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/characters`, { params: { userId } });
      setMyCharacters(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchMyCharacters(currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const poll = async () => {
      try {
        const res = await axios.get(`${API_URL}/gm-rolls/active?userId=${currentUser.id}`);
        if (res.data.length > 0 && !activeGMRoll) {
          setActiveGMRoll(res.data[0]);
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [currentUser, activeGMRoll]);

  const handleGMRollHeroPointChange = async (newPoints) => {
    const char = myCharacters[0];
    if (!char) return;
    try {
      await axios.patch(`${API_URL}/characters/${char.id}`, { heroPoints: newPoints });
      setMyCharacters(prev => prev.map(c => c.id === char.id ? { ...c, heroPoints: newPoints } : c));
    } catch { /* ignore */ }
  };

  const handleGMRollClose = () => {
    setActiveGMRoll(null);
    if (currentUser) fetchMyCharacters(currentUser.id);
  };

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
            {TABS.filter(tab => tab.key !== 'gm' || currentUser.isGM).map(tab => (
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
        {currentPage === 'gm' && currentUser && currentUser.isGM && (
          <GameMasterPage userId={currentUser.id} />
        )}
      </main>

      {activeGMRoll && myCharacters.length > 0 && (
        <GMRollModal
          request={activeGMRoll}
          character={myCharacters[0]}
          onClose={handleGMRollClose}
          onHeroPointChange={handleGMRollHeroPointChange}
        />
      )}
    </div>
  );
}

export default App;
