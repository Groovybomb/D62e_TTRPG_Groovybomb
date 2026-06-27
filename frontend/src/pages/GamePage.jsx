import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { ATTRIBUTE_DEFINITIONS, getDicePool } from '../data/attributes';
import { OUTCOME_LABELS, OUTCOME_COLORS } from '../data/outcomes';
import RollModal from '../components/RollModal';

export default function GamePage({ userId, displayName, isGM }) {
  const [characters, setCharacters] = useState([]);
  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [rolls, setRolls] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [rollModal, setRollModal] = useState(null);

  useEffect(() => {
    fetchCharacters();
    fetchRolls();
    fetchMessages();
    const rollInterval = setInterval(fetchRolls, 5000);
    const msgInterval = setInterval(fetchMessages, 3000);
    return () => { clearInterval(rollInterval); clearInterval(msgInterval); };
  }, [userId]);

  const fetchCharacters = async () => {
    try {
      const [allRes, mineRes] = await Promise.all([
        axios.get(`${API_URL}/characters`),
        axios.get(`${API_URL}/characters`, { params: { userId } }),
      ]);
      setAllCharacters(allRes.data);
      setCharacters(mineRes.data);
      if (mineRes.data.length > 0 && !selectedCharacter) setSelectedCharacter(mineRes.data[0]);
    } catch { /* ignore */ }
  };

  const fetchRolls = async () => {
    try {
      const res = await axios.get(`${API_URL}/rolls`);
      setRolls(res.data.slice(0, 50));
    } catch { /* ignore */ }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/messages`);
      setChatMessages(res.data);
    } catch { /* ignore */ }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await axios.post(`${API_URL}/messages`, {
        userId,
        author: displayName,
        text: chatInput.trim(),
      });
      setChatInput('');
      fetchMessages();
    } catch { /* ignore */ }
  };

  const handleHeroPointChange = async (newPoints) => {
    if (!selectedCharacter) return;
    try {
      await axios.patch(`${API_URL}/characters/${selectedCharacter.id}`, { heroPoints: newPoints });
      setSelectedCharacter({ ...selectedCharacter, heroPoints: newPoints });
      setCharacters(characters.map(c => c.id === selectedCharacter.id ? { ...c, heroPoints: newPoints } : c));
    } catch { /* ignore */ }
  };

  const handleSkillSelect = (e) => {
    const [attrKey, skillKey] = e.target.value.split('.');
    const attrDef = ATTRIBUTE_DEFINITIONS[attrKey];
    const attr = selectedCharacter?.attributes[attrKey];
    if (!attrDef || !attr) return;

    const skillLabel = attrDef.skills[skillKey];
    const skillDice = attr.skills[skillKey] || 0;
    const totalDice = attr.dice + skillDice;

    setRollModal({
      label: `${skillLabel} (${attrDef.label})`,
      attrLabel: attrDef.label,
      attrDice: attr.dice,
      skillLabel,
      skillDice,
      baseDice: totalDice,
    });
  };

  const clearLog = async () => {
    if (!window.confirm('Clear all rolls and chat messages? This cannot be undone.')) return;
    try {
      await Promise.all([
        axios.delete(`${API_URL}/rolls`),
        axios.delete(`${API_URL}/messages`),
      ]);
      setRolls([]);
      setChatMessages([]);
    } catch { /* ignore */ }
  };

  const getChar = (id) => allCharacters.find(c => c.id === id);
  const getCharName = (id) => getChar(id)?.name || 'Unknown';

  const combined = [
    ...rolls.map(r => ({ type: 'roll', data: r, time: new Date(r.createdAt).getTime() })),
    ...chatMessages.map(m => ({ type: 'chat', data: m, time: new Date(m.createdAt).getTime() })),
  ].sort((a, b) => b.time - a.time);

  return (
    <div className="page" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '2rem', maxWidth: '1400px' }}>
      {/* Left: Controls */}
      <div>
        <h2>Roll</h2>

        {characters.length === 0 ? (
          <div className="error">Create a character on the Character Sheet tab first!</div>
        ) : (
          <>
            <div className="card">
              <h3>Character</h3>
              <select
                value={selectedCharacter?.id || ''}
                onChange={(e) => setSelectedCharacter(characters.find(c => c.id === e.target.value))}
                className="select-input"
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ fontSize: '0.85rem', color: '#888' }}>
                Hero Points: <strong style={{ color: '#e94560' }}>{selectedCharacter?.heroPoints || 0}</strong>
              </div>
            </div>

            <div className="card">
              <h3>Quick Roll</h3>
              <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
                Select a skill to open the roll popup:
              </p>
              <select
                onChange={handleSkillSelect}
                value=""
                className="select-input"
                style={{ width: '100%' }}
              >
                <option value="" disabled>Choose a skill...</option>
                {Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attr]) => (
                  <optgroup key={attrKey} label={attr.label}>
                    {Object.entries(attr.skills).map(([skillKey, skillLabel]) => {
                      const total = selectedCharacter ? getDicePool(selectedCharacter, attrKey, skillKey) : 0;
                      return (
                        <option key={skillKey} value={`${attrKey}.${skillKey}`}>
                          {skillLabel} ({total}D)
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Right: Roll Log & Chat */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Roll Log &amp; Chat</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={fetchRolls} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Refresh</button>
{isGM && <button onClick={clearLog} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#ef476f' }}>Clear Log</button>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f3460', border: '1px solid #444', borderRadius: '8px 8px 0 0', padding: '1rem' }}>
          {combined.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', marginTop: '2rem' }}>
              No rolls yet. Roll from the Character Sheet or use Quick Roll!
            </p>
          )}

          {combined.map((item, i) => {
            if (item.type === 'chat') {
              return (
                <div key={`chat-${item.data.id}`} className="message">
                  <div className="message-author">{item.data.author}</div>
                  <div className="message-text">{item.data.text}</div>
                  <div className="message-time">{new Date(item.data.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            }

            const roll = item.data;
            const charName = roll.characterName || getCharName(roll.characterId);
            const rollIsNPC = roll.isNPC || getChar(roll.characterId)?.isNPC || false;
            const wildDie = roll.wildDie;

            if (roll.rollType === 'GM_ROLL') {
              const outcomeColor = OUTCOME_COLORS[roll.outcome] || '#888';
              const outcomeLabel = OUTCOME_LABELS[roll.outcome] || roll.outcome;

              return (
                <div key={roll.id} className="message system" style={{ borderLeft: `3px solid ${outcomeColor}` }}>
                  <div className="message-author">{charName} {rollIsNPC && <span style={{ color: '#ff8c00', fontSize: '0.8rem' }}>[NPC]</span>} <span style={{ color: '#ffd60a', fontSize: '0.8rem' }}>[GM Roll]</span></div>
                  <div className="message-text">
                    <strong>{roll.skill}</strong> — {roll.total} vs DC {roll.dcValue}{' '}
                    <span style={{ color: outcomeColor, fontWeight: 700 }}>{outcomeLabel}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                    Dice: [{roll.diceRolled?.join(', ')}]
                    {roll.complication && <span style={{ color: '#ef476f', fontWeight: 700 }}> COMPLICATION</span>}
                    {roll.heroPointDelta > 0 && <span style={{ color: '#06d6a0' }}> +{roll.heroPointDelta} HP</span>}
                  </div>
                  <div className="message-time">{new Date(roll.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            }

            if (roll.rollType === 'GM_ROLL_DECLINED') {
              return (
                <div key={roll.id} className="message system" style={{ borderLeft: '3px solid #888' }}>
                  <div className="message-author">{charName} <span style={{ color: '#888', fontSize: '0.8rem' }}>[GM Roll — Declined]</span></div>
                  <div className="message-text">
                    <strong>{roll.skill}</strong> — <span style={{ color: '#888', fontStyle: 'italic' }}>Declined</span>
                  </div>
                  <div className="message-time">{new Date(roll.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            }

            if (roll.rollType === 'DAMAGE') {
              return (
                <div key={roll.id} className="message system" style={{ borderLeft: '3px solid #e94560' }}>
                  <div className="message-author">{charName} {rollIsNPC && <span style={{ color: '#ff8c00', fontSize: '0.8rem' }}>[NPC]</span>} <span style={{ color: '#e94560', fontSize: '0.8rem' }}>[Damage]</span></div>
                  <div className="message-text">
                    <strong>{roll.weaponName}</strong> ({roll.damageFormula}) — <strong style={{ color: '#e94560', fontSize: '1.1em' }}>{roll.total}</strong> damage
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                    Dice: [{roll.diceRolled?.join(', ')}]
                    {roll.rollFlag && <span style={{ color: '#ffd60a' }}> {roll.rollFlag === 'REROLL' ? 'RE-ROLL' : 'DOUBLE DOWN'}</span>}
                  </div>
                  <div className="message-time">{new Date(roll.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            }

            return (
              <div key={roll.id} className={`message system`}>
                <div className="message-author">
                  {charName}
                  {rollIsNPC && <span style={{ color: '#ff8c00', fontSize: '0.8rem', marginLeft: '0.3rem' }}>[NPC]</span>}
                  {roll.rollFlag && (
                    <span className={`roll-flag-inline ${roll.rollFlag === 'REROLL' ? 'reroll' : 'doubledown'}`}>
                      {roll.rollFlag === 'REROLL' ? 'RE-ROLL' : 'DOUBLE DOWN'}
                    </span>
                  )}
                  {roll.doubled && <span className="roll-flag-inline doubled">DOUBLED</span>}
                </div>
                <div className="message-text">
                  <strong>{roll.skill}</strong>
                  {roll.attribute && roll.attribute !== roll.skill && <span style={{ color: '#888' }}> ({roll.attribute})</span>}
                  {' — '}
                  {roll.diceCount}D6 = <strong style={{ color: '#06d6a0', fontSize: '1.1em' }}>{roll.total}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                  Dice: [{roll.diceRolled?.join(', ')}]
                  {wildDie && (
                    <span>
                      {' | Wild: '}
                      <span style={{ color: wildDie.rawFirst === 6 ? '#06d6a0' : wildDie.rawFirst === 1 ? '#ef476f' : '#ccc', fontWeight: 700 }}>
                        {wildDie.rolls?.join(' + ')} = {wildDie.total}
                      </span>
                      {wildDie.exploded && <span style={{ color: '#ffd60a' }}> EXPLODING!</span>}
                    </span>
                  )}
                  {roll.complication && <span style={{ color: '#ef476f', fontWeight: 700 }}> COMPLICATION!</span>}
                </div>
                <div className="message-time">{new Date(roll.createdAt).toLocaleTimeString()}</div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleChat} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#16213e', border: '1px solid #444', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '0.6rem', backgroundColor: '#0f3460', color: '#eee', border: '1px solid #444', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '0.6rem 1.25rem' }}>Send</button>
        </form>
      </div>

      {rollModal && selectedCharacter && (
        <RollModal
          rollInfo={rollModal}
          character={selectedCharacter}
          onClose={() => { setRollModal(null); fetchRolls(); }}
          onHeroPointChange={handleHeroPointChange}
        />
      )}
    </div>
  );
}
