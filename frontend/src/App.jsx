import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { API_URL } from './config';
import LoginPage from './pages/LoginPage';
import CharacterPage from './pages/CharacterPage';
import VehiclePage from './pages/VehiclePage';
import GamePage from './pages/GamePage';
import GameMasterPage from './pages/GameMasterPage';
import TabletopPage from './pages/TabletopPage';
import GMRollModal from './components/GMRollModal';
import OpposedRollModal from './components/OpposedRollModal';

function getTabs(isGM) {
  return [
    { key: 'characters', label: isGM ? 'NPCs' : 'Character Sheet' },
    { key: 'vehicles', label: isGM ? 'NPC Vehicles' : 'Vehicle' },
    { key: 'game', label: 'Roll Log / Chat' },
    { key: 'tabletop', label: 'Tabletop' },
    { key: 'gm', label: 'Game Master' },
  ];
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [myCharacters, setMyCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [activeGMRoll, setActiveGMRoll] = useState(null);
  const [activeOpposedRoll, setActiveOpposedRoll] = useState(null);
  const [maxDice, setMaxDice] = useState(null);
  const [characterRefreshKey, setCharacterRefreshKey] = useState(0);

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
    fetchSettings();
  }, [currentUser]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      setMaxDice(res.data.maxDice || null);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!currentUser) return;
    const poll = async () => {
      try {
        const res = await axios.get(`${API_URL}/gm-rolls/active?userId=${currentUser.id}`);
        if (res.data.length > 0 && !activeGMRoll) {
          setActiveGMRoll(res.data[0]);
        }
      } catch { /* ignore */ }
      try {
        const oRes = await axios.get(`${API_URL}/opposed-rolls/active?userId=${currentUser.id}&isGM=${!!currentUser.isGM}`);
        if (oRes.data.length > 0 && !activeOpposedRoll) {
          setActiveOpposedRoll(oRes.data[0]);
        }
      } catch { /* ignore */ }
      fetchSettings();
      fetchMyCharacters(currentUser.id);
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [currentUser, activeGMRoll, activeOpposedRoll]);

  const playerCharacters = myCharacters.filter(c => !c.isNPC);
  const selectedCharacter = playerCharacters.find(c => c.id === selectedCharacterId) || playerCharacters[0] || null;

  const handleGMRollHeroPointChange = async (newPoints) => {
    const char = selectedCharacter;
    if (!char) return;
    try {
      await axios.patch(`${API_URL}/characters/${char.id}`, { heroPoints: newPoints });
      setMyCharacters(prev => prev.map(c => c.id === char.id ? { ...c, heroPoints: newPoints } : c));
    } catch { /* ignore */ }
  };

  const handleGMRollClose = () => {
    setActiveGMRoll(null);
    if (currentUser) fetchMyCharacters(currentUser.id);
    setCharacterRefreshKey(k => k + 1);
  };

  const [opposedDefenderChar, setOpposedDefenderChar] = useState(null);

  useEffect(() => {
    if (!activeOpposedRoll) { setOpposedDefenderChar(null); return; }
    const local = myCharacters.find(c => c.id === activeOpposedRoll.defenderCharacterId);
    if (local) { setOpposedDefenderChar(local); return; }
    axios.get(`${API_URL}/characters/${activeOpposedRoll.defenderCharacterId}`)
      .then(res => setOpposedDefenderChar(res.data))
      .catch(() => setOpposedDefenderChar(null));
  }, [activeOpposedRoll, myCharacters]);

  const handleOpposedHeroPointChange = async (newPoints) => {
    if (!opposedDefenderChar) return;
    try {
      await axios.patch(`${API_URL}/characters/${opposedDefenderChar.id}`, { heroPoints: newPoints });
      setMyCharacters(prev => prev.map(c => c.id === opposedDefenderChar.id ? { ...c, heroPoints: newPoints } : c));
    } catch { /* ignore */ }
  };

  const handleOpposedRollClose = () => {
    setActiveOpposedRoll(null);
    if (currentUser) fetchMyCharacters(currentUser.id);
    setCharacterRefreshKey(k => k + 1);
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
            {getTabs(currentUser.isGM).filter(tab => tab.key !== 'gm' || currentUser.isGM).map(tab => (
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
          <CharacterPage userId={currentUser.id} maxDice={maxDice} refreshKey={characterRefreshKey} selectedCharacterId={selectedCharacterId} onSelectCharacter={setSelectedCharacterId} isNPC={!!currentUser.isGM} />
        )}
        {currentPage === 'vehicles' && currentUser && (
          <VehiclePage userId={currentUser.id} maxDice={maxDice} isNPC={!!currentUser.isGM} />
        )}
        {currentPage === 'game' && currentUser && (
          <GamePage userId={currentUser.id} displayName={currentUser.displayName} isGM={currentUser.isGM} maxDice={maxDice} />
        )}
        {currentUser && (
          <div style={{ display: currentPage === 'tabletop' ? 'block' : 'none' }}>
            <TabletopPage />
          </div>
        )}
        {currentPage === 'gm' && currentUser && currentUser.isGM && (
          <GameMasterPage userId={currentUser.id} displayName={currentUser.displayName} maxDice={maxDice} onMaxDiceChange={(val) => setMaxDice(val)} />
        )}
      </main>

      {activeGMRoll && selectedCharacter && (
        <GMRollModal
          request={activeGMRoll}
          character={selectedCharacter}
          onClose={handleGMRollClose}
          onHeroPointChange={handleGMRollHeroPointChange}
          maxDice={maxDice}
        />
      )}

      {activeOpposedRoll && opposedDefenderChar && (
        <OpposedRollModal
          opposedRoll={activeOpposedRoll}
          character={opposedDefenderChar}
          onClose={handleOpposedRollClose}
          onHeroPointChange={handleOpposedHeroPointChange}
          maxDice={maxDice}
        />
      )}
    </div>
  );
}

export default App;
