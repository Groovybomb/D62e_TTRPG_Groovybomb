import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { ATTRIBUTE_DEFINITIONS, getDicePool, SPECIAL_SKILLS } from '../data/attributes';
import { OUTCOME_LABELS, OUTCOME_COLORS } from '../data/outcomes';
import { OPPOSED_PRESETS, getStaticDefense, getSkillLabel, determineWinner } from '../data/opposedPresets';
import { rollDice, calculateTotal } from '../utils/dice';
import { getWoundPenalty } from '../data/wounds';
import RollModal from '../components/RollModal';

export default function GamePage({ userId, displayName, isGM, maxDice }) {
  const [characters, setCharacters] = useState([]);
  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [rolls, setRolls] = useState([]);
  const [opposedRolls, setOpposedRolls] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [rollModal, setRollModal] = useState(null);

  // Opposed roll panel state
  const [opposedOpen, setOpposedOpen] = useState(false);
  const [oppInitiatorId, setOppInitiatorId] = useState('');
  const [oppDefenderId, setOppDefenderId] = useState('');
  const [oppPreset, setOppPreset] = useState(null);
  const [oppCustomAttacker, setOppCustomAttacker] = useState('');
  const [oppCustomDefender, setOppCustomDefender] = useState('');
  const [oppPhase, setOppPhase] = useState('setup'); // 'setup' | 'rolling_initiator' | 'waiting' | 'rolling_defender' | 'complete'
  const [oppResult, setOppResult] = useState(null);

  useEffect(() => {
    fetchCharacters();
    fetchRolls();
    fetchMessages();
    fetchOpposedRolls();
    const rollInterval = setInterval(fetchRolls, 5000);
    const msgInterval = setInterval(fetchMessages, 3000);
    const oppInterval = setInterval(fetchOpposedRolls, 5000);
    return () => { clearInterval(rollInterval); clearInterval(msgInterval); clearInterval(oppInterval); };
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

  const fetchOpposedRolls = async () => {
    try {
      const res = await axios.get(`${API_URL}/opposed-rolls`);
      setOpposedRolls(res.data);
    } catch { /* ignore */ }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await axios.post(`${API_URL}/messages`, { userId, author: displayName, text: chatInput.trim() });
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
    setRollModal({
      label: `${skillLabel} (${attrDef.label})`,
      attrKey, attrLabel: attrDef.label, attrDice: attr.dice,
      skillKey, skillLabel, skillDice, baseDice: attr.dice + skillDice,
    });
  };

  const clearLog = async () => {
    if (!window.confirm('Clear all rolls and chat messages? This cannot be undone.')) return;
    try {
      await Promise.all([
        axios.delete(`${API_URL}/rolls`),
        axios.delete(`${API_URL}/messages`),
        axios.delete(`${API_URL}/opposed-rolls`),
      ]);
      setRolls([]);
      setChatMessages([]);
      setOpposedRolls([]);
    } catch { /* ignore */ }
  };

  const getChar = (id) => allCharacters.find(c => c.id === id);
  const getCharName = (id) => getChar(id)?.name || 'Unknown';

  // --- Opposed Roll Logic ---
  const initiatorChar = allCharacters.find(c => c.id === oppInitiatorId);
  const defenderChar = allCharacters.find(c => c.id === oppDefenderId);

  const handlePresetSelect = (preset) => {
    setOppPreset(preset);
    setOppCustomAttacker('');
    setOppCustomDefender('');
  };

  const startOpposedRoll = () => {
    if (!initiatorChar || !defenderChar || !oppPreset) return;

    if (oppPreset.attacker.type === 'damage') {
      // Damage mode: initiator picks a weapon, just use plain dice
      // For simplicity, open a "pick dice count" approach
      setOppPhase('rolling_initiator');
      return;
    }

    const { attr, skill } = oppPreset.attacker;
    const attrDef = ATTRIBUTE_DEFINITIONS[attr];
    const attrData = initiatorChar.attributes?.[attr];
    if (!attrDef || !attrData) return;

    const skillLabel = attrDef.skills[skill];
    const special = SPECIAL_SKILLS[skill];
    const skillDice = special
      ? (initiatorChar[special.sourceField] || 0)
      : (attrData.skills[skill] || 0);
    const baseDice = attrData.dice + skillDice;

    setRollModal({
      label: `${skillLabel} (${attrDef.label})`,
      attrKey: attr, attrLabel: attrDef.label, attrDice: attrData.dice,
      skillKey: skill, skillLabel, skillDice, baseDice,
      skipWoundPenalty: special?.skipWoundPenalty,
      isOpposedInitiator: true,
    });
    setOppPhase('rolling_initiator');
  };

  const handleInitiatorRollComplete = async (total, diceValues) => {
    if (!initiatorChar || !defenderChar || !oppPreset) return;

    const { attr: aAttr, skill: aSkill } = oppPreset.attacker;
    const initiatorSkillLabel = getSkillLabel(aAttr, aSkill);
    const initiatorIsNPC = initiatorChar.isNPC || false;
    const defenderIsNPC = defenderChar.isNPC || false;

    if (oppPreset.defender.type === 'static') {
      const { value, label } = getStaticDefense(defenderChar, oppPreset.defender.stat);
      const winner = determineWinner(total, value, initiatorIsNPC, defenderIsNPC);
      const margin = Math.abs(total - value);

      try {
        const res = await axios.post(`${API_URL}/opposed-rolls`, {
          initiatorUserId: initiatorChar.userId,
          initiatorCharacterId: initiatorChar.id,
          initiatorCharacterName: initiatorChar.name,
          initiatorIsNPC,
          preset: oppPreset.key,
          initiatorSkillLabel,
          initiatorDiceCount: diceValues.length,
          initiatorDiceRolled: diceValues,
          initiatorWildDie: null,
          initiatorTotal: total,
          initiatorComplication: false,
          defenderUserId: defenderChar.userId,
          defenderCharacterId: defenderChar.id,
          defenderCharacterName: defenderChar.name,
          defenderIsNPC,
          defenderSkillLabel: `${label} (${value})`,
          defenderIsStatic: true,
          defenderTotal: value,
          winner,
          margin,
        });
        setOppResult(res.data);
        setOppPhase('complete');
        fetchOpposedRolls();
      } catch { /* ignore */ }
    } else {
      // Active roll — save pending, defender must respond
      const { attr: dAttr, skill: dSkill } = oppPreset.defender;
      const defenderSkillLabel = getSkillLabel(dAttr, dSkill);

      try {
        const res = await axios.post(`${API_URL}/opposed-rolls`, {
          initiatorUserId: initiatorChar.userId,
          initiatorCharacterId: initiatorChar.id,
          initiatorCharacterName: initiatorChar.name,
          initiatorIsNPC,
          preset: oppPreset.key,
          initiatorSkillLabel,
          initiatorDiceCount: diceValues.length,
          initiatorDiceRolled: diceValues,
          initiatorWildDie: null,
          initiatorTotal: total,
          initiatorComplication: false,
          defenderUserId: defenderChar.userId,
          defenderCharacterId: defenderChar.id,
          defenderCharacterName: defenderChar.name,
          defenderIsNPC,
          defenderSkillLabel,
          defenderIsStatic: false,
          defenderTotal: null,
          winner: null,
          margin: null,
        });

        // If defender belongs to current user (e.g., GM's NPC), it'll be picked up by App.jsx polling
        setOppResult(res.data);
        setOppPhase('waiting');
        fetchOpposedRolls();
      } catch { /* ignore */ }
    }
  };

  const resetOpposed = () => {
    setOppPhase('setup');
    setOppResult(null);
    setOppPreset(null);
  };

  useEffect(() => {
    if (oppPhase !== 'waiting' || !oppResult) return;
    const updated = opposedRolls.find(r => r.id === oppResult.id);
    if (updated && updated.status === 'complete') {
      setOppResult(updated);
      setOppPhase('complete');
    }
  }, [opposedRolls, oppPhase, oppResult]);

  // Combine all log entries
  const combined = [
    ...rolls.map(r => ({ type: 'roll', data: r, time: new Date(r.createdAt).getTime() })),
    ...chatMessages.map(m => ({ type: 'chat', data: m, time: new Date(m.createdAt).getTime() })),
    ...opposedRolls.map(o => ({ type: 'opposed', data: o, time: new Date(o.createdAt).getTime() })),
  ].sort((a, b) => b.time - a.time);

  const categories = [...new Set(OPPOSED_PRESETS.map(p => p.category))];

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
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}{c.isNPC ? ' [NPC]' : ''}</option>)}
              </select>
              <div style={{ fontSize: '0.85rem', color: '#888' }}>
                Hero Points: <strong style={{ color: '#e94560' }}>{selectedCharacter?.heroPoints || 0}</strong>
              </div>
            </div>

            <div className="card">
              <h3>Quick Roll</h3>
              <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>Select a skill to open the roll popup:</p>
              <select onChange={handleSkillSelect} value="" className="select-input" style={{ width: '100%' }}>
                <option value="" disabled>Choose a skill...</option>
                {Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attr]) => (
                  <optgroup key={attrKey} label={attr.label}>
                    {Object.entries(attr.skills).map(([skillKey, skillLabel]) => {
                      const total = selectedCharacter ? getDicePool(selectedCharacter, attrKey, skillKey) : 0;
                      return <option key={skillKey} value={`${attrKey}.${skillKey}`}>{skillLabel} ({total}D)</option>;
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Opposed Roll Panel */}
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <div
            onClick={() => setOpposedOpen(!opposedOpen)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <h3 style={{ margin: 0, color: '#e94560' }}>Opposed Roll</h3>
            <span style={{ fontSize: '1.2rem', color: '#888' }}>{opposedOpen ? '▾' : '▸'}</span>
          </div>

          {opposedOpen && (
            <div style={{ marginTop: '0.75rem' }}>
              {oppPhase === 'setup' && (
                <>
                  {/* Initiator selector */}
                  <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Initiator:</label>
                  <select
                    value={oppInitiatorId}
                    onChange={e => setOppInitiatorId(e.target.value)}
                    className="select-input"
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                  >
                    <option value="">Select character...</option>
                    {allCharacters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.isNPC ? ' [NPC]' : ''}</option>
                    ))}
                  </select>

                  {/* Defender selector */}
                  <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Defender:</label>
                  <select
                    value={oppDefenderId}
                    onChange={e => setOppDefenderId(e.target.value)}
                    className="select-input"
                    style={{ width: '100%', marginBottom: '0.75rem' }}
                  >
                    <option value="">Select character...</option>
                    {allCharacters.filter(c => c.id !== oppInitiatorId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.isNPC ? ' [NPC]' : ''}</option>
                    ))}
                  </select>

                  {initiatorChar && defenderChar && (
                    <>
                      {/* Preset buttons by category */}
                      {categories.map(cat => (
                        <div key={cat} style={{ marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{cat}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {OPPOSED_PRESETS.filter(p => p.category === cat && p.attacker.type !== 'damage').map(p => {
                              const isSelected = oppPreset?.key === p.key;
                              let initiatorPool = '';
                              if (p.attacker.attr && p.attacker.skill) {
                                initiatorPool = `${getDicePool(initiatorChar, p.attacker.attr, p.attacker.skill)}D`;
                              }
                              let defenderInfo = '';
                              if (p.defender.type === 'static') {
                                const sd = getStaticDefense(defenderChar, p.defender.stat);
                                defenderInfo = `${sd.value}`;
                              } else if (p.defender.attr && p.defender.skill) {
                                defenderInfo = `${getDicePool(defenderChar, p.defender.attr, p.defender.skill)}D`;
                              }

                              return (
                                <button
                                  key={p.key}
                                  onClick={() => handlePresetSelect(p)}
                                  style={{
                                    padding: '0.3rem 0.5rem', fontSize: '0.78rem',
                                    background: isSelected ? '#e94560' : '#16213e',
                                    border: `1px solid ${isSelected ? '#e94560' : '#444'}`,
                                    color: isSelected ? '#fff' : '#ccc',
                                    borderRadius: '4px', cursor: 'pointer',
                                  }}
                                >
                                  {p.label.split(' vs. ')[0]}
                                  {initiatorPool && <span style={{ color: isSelected ? '#ffd' : '#06d6a0', marginLeft: '0.3rem' }}>{initiatorPool}</span>}
                                  <span style={{ color: '#888', margin: '0 0.2rem' }}>vs</span>
                                  {defenderInfo && <span style={{ color: isSelected ? '#ffd' : '#ffd60a' }}>{defenderInfo}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Damage vs Resistance preset */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {OPPOSED_PRESETS.filter(p => p.attacker.type === 'damage').map(p => {
                            const isSelected = oppPreset?.key === p.key;
                            const defPool = getDicePool(defenderChar, 'brawn', 'resistance');
                            return (
                              <button
                                key={p.key}
                                onClick={() => handlePresetSelect(p)}
                                style={{
                                  padding: '0.3rem 0.5rem', fontSize: '0.78rem',
                                  background: isSelected ? '#e94560' : '#16213e',
                                  border: `1px solid ${isSelected ? '#e94560' : '#444'}`,
                                  color: isSelected ? '#fff' : '#ccc',
                                  borderRadius: '4px', cursor: 'pointer',
                                }}
                              >
                                Damage vs Resistance
                                <span style={{ color: '#888', margin: '0 0.2rem' }}>vs</span>
                                <span style={{ color: isSelected ? '#ffd' : '#ffd60a' }}>{defPool}D</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {oppPreset && (
                        <button
                          onClick={startOpposedRoll}
                          disabled={oppPreset.attacker.type === 'damage'}
                          style={{ width: '100%', padding: '0.6rem', background: '#e94560', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', marginTop: '0.25rem' }}
                        >
                          {oppPreset.attacker.type === 'damage'
                            ? 'Use weapon damage buttons on character sheet'
                            : `Start: ${initiatorChar.name} rolls ${oppPreset.label.split(' vs. ')[0]}`}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {oppPhase === 'rolling_initiator' && (
                <div style={{ textAlign: 'center', color: '#ffd60a', padding: '1rem 0' }}>
                  Rolling for {initiatorChar?.name}...
                </div>
              )}

              {oppPhase === 'waiting' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ color: '#ffd60a', marginBottom: '0.5rem' }}>
                    Waiting for {defenderChar?.name} to roll {oppPreset?.label.split(' vs. ')[1]}...
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                    {initiatorChar?.name} rolled <strong style={{ color: '#06d6a0' }}>{oppResult?.initiatorTotal}</strong>
                  </div>
                  <button onClick={resetOpposed} style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Cancel</button>
                </div>
              )}

              {oppPhase === 'complete' && oppResult && (
                <div style={{ padding: '0.5rem 0' }}>
                  <div style={{
                    padding: '0.6rem', borderRadius: '6px', textAlign: 'center',
                    backgroundColor: oppResult.winner === 'initiator' ? '#1a2e1a' : oppResult.winner === 'defender' ? '#3d1a1a' : '#2a2a3e',
                    border: `2px solid ${oppResult.winner === 'initiator' ? '#06d6a0' : oppResult.winner === 'defender' ? '#e94560' : '#ffd60a'}`,
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                      {oppResult.initiatorCharacterName}: <strong style={{ color: '#06d6a0' }}>{oppResult.initiatorTotal}</strong>
                      <span style={{ color: '#888', margin: '0 0.5rem' }}>vs.</span>
                      {oppResult.defenderCharacterName}: <strong style={{ color: '#ffd60a' }}>{oppResult.defenderTotal}</strong>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.3rem',
                      color: oppResult.winner === 'initiator' ? '#06d6a0' : oppResult.winner === 'defender' ? '#e94560' : '#ffd60a'
                    }}>
                      {oppResult.winner === 'initiator' ? `${oppResult.initiatorCharacterName} wins!` :
                       oppResult.winner === 'defender' ? `${oppResult.defenderCharacterName} wins!` : 'Tie!'}
                      {oppResult.margin > 0 && <span style={{ fontSize: '0.85rem', color: '#ccc', marginLeft: '0.5rem' }}>by {oppResult.margin}</span>}
                    </div>
                  </div>
                  <button onClick={resetOpposed} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}>New Opposed Roll</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Roll Log & Chat */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Roll Log &amp; Chat</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { fetchRolls(); fetchOpposedRolls(); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Refresh</button>
            {isGM && <button onClick={clearLog} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#ef476f' }}>Clear Log</button>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f3460', border: '1px solid #444', borderRadius: '8px 8px 0 0', padding: '1rem' }}>
          {combined.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', marginTop: '2rem' }}>
              No rolls yet. Roll from the Character Sheet or use Quick Roll!
            </p>
          )}

          {combined.map((item) => {
            if (item.type === 'chat') {
              return (
                <div key={`chat-${item.data.id}`} className="message">
                  <div className="message-author">{item.data.author}</div>
                  <div className="message-text">{item.data.text}</div>
                  <div className="message-time">{new Date(item.data.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            }

            if (item.type === 'opposed') {
              const o = item.data;
              const isComplete = o.status === 'complete';
              const winColor = o.winner === 'initiator' ? '#06d6a0' : o.winner === 'defender' ? '#e94560' : '#ffd60a';
              return (
                <div key={`opp-${o.id}`} className="message system" style={{ borderLeft: `3px solid ${isComplete ? winColor : '#ffd60a'}` }}>
                  <div className="message-author">
                    <span style={{ color: '#e94560', fontSize: '0.8rem' }}>[Opposed Roll]</span>
                  </div>
                  <div className="message-text">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                      <span>
                        <strong>{o.initiatorCharacterName}</strong>
                        {o.initiatorIsNPC && <span style={{ color: '#ff8c00', fontSize: '0.8rem' }}> [NPC]</span>}
                        {' '}{o.initiatorSkillLabel}
                        {' = '}<strong style={{ color: '#06d6a0' }}>{o.initiatorTotal}</strong>
                      </span>
                      <span style={{ color: '#888' }}>vs.</span>
                      <span>
                        <strong>{o.defenderCharacterName}</strong>
                        {o.defenderIsNPC && <span style={{ color: '#ff8c00', fontSize: '0.8rem' }}> [NPC]</span>}
                        {' '}{o.defenderSkillLabel}
                        {' = '}<strong style={{ color: '#ffd60a' }}>{o.defenderTotal ?? '...'}</strong>
                      </span>
                    </div>
                  </div>
                  {isComplete && (
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: winColor, marginTop: '0.2rem' }}>
                      {o.winner === 'initiator' ? `${o.initiatorCharacterName} wins` :
                       o.winner === 'defender' ? `${o.defenderCharacterName} wins` : 'Tie'}
                      {o.margin > 0 && ` by ${o.margin}`}
                      {o.winner === 'tie' && ' — PC wins ties vs NPC'}
                    </div>
                  )}
                  {!isComplete && (
                    <div style={{ fontSize: '0.85rem', color: '#ffd60a', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      Waiting for {o.defenderCharacterName} to roll...
                    </div>
                  )}
                  <div className="message-time">{new Date(o.createdAt).toLocaleTimeString()}</div>
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
              <div key={roll.id} className="message system">
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
                  {' — '}{roll.diceCount}D6 = <strong style={{ color: '#06d6a0', fontSize: '1.1em' }}>{roll.total}</strong>
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

      {rollModal && (rollModal.isOpposedInitiator ? initiatorChar : selectedCharacter) && (
        <RollModal
          rollInfo={rollModal}
          character={rollModal.isOpposedInitiator ? initiatorChar : selectedCharacter}
          onClose={() => {
            setRollModal(null);
            if (rollModal.isOpposedInitiator && oppPhase === 'rolling_initiator') {
              resetOpposed();
            }
            fetchRolls();
          }}
          onHeroPointChange={handleHeroPointChange}
          maxDice={maxDice}
          isNPC={rollModal.isOpposedInitiator ? (initiatorChar?.isNPC || false) : (selectedCharacter?.isNPC || false)}
          onRollComplete={rollModal.isOpposedInitiator ? handleInitiatorRollComplete : undefined}
        />
      )}
    </div>
  );
}
