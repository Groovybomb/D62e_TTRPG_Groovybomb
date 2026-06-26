import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { ATTRIBUTE_DEFINITIONS, DIFFICULTY_TABLE, getDicePool } from '../data/attributes';
import { OUTCOME_LABELS, OUTCOME_COLORS } from '../data/outcomes';
import { rollPlainDice } from '../utils/dice';

const PRESET_KEY = 'gm-roll-presets';
const HIDDEN_CHARS_KEY = 'gm-hidden-characters';

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY)) || [];
  } catch { return []; }
}

function presetsEqual(a, b) {
  return a.selectedSkill === b.selectedSkill && a.dcType === b.dcType &&
         a.staticDC === b.staticDC && a.dcDiceCount === b.dcDiceCount;
}

function savePreset(config) {
  const presets = loadPresets();
  const dupe = presets.findIndex(p => presetsEqual(p, config));
  if (dupe !== -1) presets.splice(dupe, 1);
  presets.unshift(config);
  const trimmed = presets.slice(0, 20);
  localStorage.setItem(PRESET_KEY, JSON.stringify(trimmed));
  return trimmed;
}

function loadHiddenChars() {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_CHARS_KEY)) || [];
  } catch { return []; }
}

export default function GameMasterPage({ userId, displayName, maxDice, onMaxDiceChange }) {
  const [characters, setCharacters] = useState([]);
  const [rolls, setRolls] = useState([]);

  // GM Roll Initiator state
  const [selectedSkill, setSelectedSkill] = useState('');
  const [dcType, setDcType] = useState('static');
  const [staticDC, setStaticDC] = useState(15);
  const [dcDiceCount, setDcDiceCount] = useState(4);
  const [dcDiceResults, setDcDiceResults] = useState(null);
  const [dcDiceTotal, setDcDiceTotal] = useState(null);

  // Active request state
  const [activeRequest, setActiveRequest] = useState(null);
  const [responses, setResponses] = useState([]);

  // Recent roll presets
  const [presets, setPresets] = useState(() => loadPresets());

  // Max dice cap
  const [maxDiceInput, setMaxDiceInput] = useState(maxDice || '');

  // Hidden characters
  const [hiddenChars, setHiddenChars] = useState(() => loadHiddenChars());
  const [expandedChars, setExpandedChars] = useState({});

  // Generic roll
  const [genericDiceCount, setGenericDiceCount] = useState(3);
  const [genericResult, setGenericResult] = useState(null);

  useEffect(() => {
    fetchCharacters();
    fetchRolls();
    checkActiveRequest();
  }, []);

  useEffect(() => {
    setMaxDiceInput(maxDice || '');
  }, [maxDice]);

  useEffect(() => {
    if (!activeRequest) return;
    const interval = setInterval(fetchResponses, 3000);
    fetchResponses();
    return () => clearInterval(interval);
  }, [activeRequest]);

  const fetchCharacters = async () => {
    try {
      const res = await axios.get(`${API_URL}/characters`);
      setCharacters(res.data);
    } catch { /* ignore */ }
  };

  const fetchRolls = async () => {
    try {
      const res = await axios.get(`${API_URL}/rolls`);
      setRolls(res.data.slice(0, 30));
    } catch { /* ignore */ }
  };

  const checkActiveRequest = async () => {
    try {
      const res = await axios.get(`${API_URL}/gm-rolls`);
      const active = res.data.find(r => r.status === 'active');
      if (active) {
        setActiveRequest(active);
      }
    } catch { /* ignore */ }
  };

  const fetchResponses = async () => {
    if (!activeRequest) return;
    try {
      const res = await axios.get(`${API_URL}/gm-rolls/${activeRequest.id}/responses`);
      setResponses(res.data);
      fetchCharacters();
    } catch { /* ignore */ }
  };

  const handleRollDC = () => {
    const results = rollPlainDice(dcDiceCount);
    const total = results.reduce((a, b) => a + b, 0);
    setDcDiceResults(results);
    setDcDiceTotal(total);
  };

  const handleInitiateRoll = async () => {
    let skill = null, skillLabel = null, attribute = null, attributeLabel = null, label = '';
    const dcValue = dcType === 'static' ? staticDC : dcDiceTotal;

    if (dcValue == null) return;

    if (selectedSkill) {
      const [attrKey, skillKey] = selectedSkill.split('.');
      const attrDef = ATTRIBUTE_DEFINITIONS[attrKey];
      if (attrKey && !skillKey) {
        attribute = attrKey;
        attributeLabel = attrDef?.label || attrKey;
        label = attributeLabel;
      } else if (attrDef && skillKey) {
        skill = skillKey;
        skillLabel = attrDef.skills[skillKey];
        attribute = attrKey;
        attributeLabel = attrDef.label;
        label = `${skillLabel} (${attributeLabel})`;
      }
    }

    if (!label) {
      label = 'GM Check';
    }

    try {
      const res = await axios.post(`${API_URL}/gm-rolls`, {
        gmUserId: userId,
        skill,
        skillLabel,
        attribute,
        attributeLabel,
        label,
        dcType,
        dcValue,
        dcDiceCount: dcType === 'dice' ? dcDiceCount : null,
        dcDiceResults: dcType === 'dice' ? dcDiceResults : null,
      });
      setActiveRequest(res.data);
      setResponses([]);

      const preset = { selectedSkill, label, dcType, staticDC: dcType === 'static' ? dcValue : 15, dcDiceCount: dcType === 'dice' ? dcDiceCount : 4 };
      setPresets(savePreset(preset));
    } catch { /* ignore */ }
  };

  const handleCloseRoll = async () => {
    if (!activeRequest) return;
    try {
      await axios.patch(`${API_URL}/gm-rolls/${activeRequest.id}`, { status: 'closed' });
      setActiveRequest(null);
      setResponses([]);
      fetchRolls();
    } catch { /* ignore */ }
  };

  const getLatestResponses = () => {
    const byChar = {};
    for (const r of responses) {
      if (!byChar[r.characterId] || new Date(r.createdAt) > new Date(byChar[r.characterId].createdAt)) {
        byChar[r.characterId] = r;
      }
    }
    return Object.values(byChar);
  };

  // Max dice handlers
  const handleMaxDiceSave = async () => {
    const val = maxDiceInput === '' ? null : parseInt(maxDiceInput) || null;
    try {
      await axios.patch(`${API_URL}/settings`, { maxDice: val });
      onMaxDiceChange(val);
    } catch { /* ignore */ }
  };

  // Hidden character handlers
  const toggleCharHidden = (charId) => {
    const updated = hiddenChars.includes(charId)
      ? hiddenChars.filter(id => id !== charId)
      : [...hiddenChars, charId];
    setHiddenChars(updated);
    localStorage.setItem(HIDDEN_CHARS_KEY, JSON.stringify(updated));
  };

  const toggleCharExpanded = (charId) => {
    setExpandedChars(prev => ({ ...prev, [charId]: !prev[charId] }));
  };

  const visibleChars = characters.filter(c => !hiddenChars.includes(c.id));
  const hiddenCharsList = characters.filter(c => hiddenChars.includes(c.id));

  const handleGenericRoll = async () => {
    if (genericDiceCount < 1) return;
    const results = rollPlainDice(genericDiceCount);
    const total = results.reduce((a, b) => a + b, 0);
    setGenericResult({ results, total });

    const diceStr = results.join(', ');
    const text = `[GM Roll] ${genericDiceCount}D6 → [${diceStr}] = ${total}`;

    try {
      await axios.post(`${API_URL}/messages`, {
        userId,
        author: displayName || 'Game Master',
        text,
      });
    } catch { /* ignore */ }
  };

  return (
    <div className="page" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Left column */}
      <div>
        <h2>Game Master</h2>

        {/* GM Settings Row: Max Dice + Generic Roll */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {/* Max Dice Cap */}
          <div className="card" style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ffd60a', fontSize: '0.9rem' }}>Max Dice Cap</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                value={maxDiceInput}
                onChange={e => setMaxDiceInput(e.target.value)}
                min={1}
                placeholder="No limit"
                style={{ width: '80px', padding: '0.4rem', backgroundColor: '#0f3460', color: '#eee', border: '1px solid #444', borderRadius: '4px' }}
              />
              <button onClick={handleMaxDiceSave} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Set</button>
              {maxDice && (
                <button onClick={async () => { setMaxDiceInput(''); onMaxDiceChange(null); try { await axios.patch(`${API_URL}/settings`, { maxDice: null }); } catch {} }} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#555' }}>Clear</button>
              )}
            </div>
            {maxDice && <div style={{ fontSize: '0.8rem', color: '#ffd60a', marginTop: '0.25rem' }}>Active: {maxDice}D6 max</div>}
          </div>

          {/* Generic Roll */}
          <div className="card" style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#06d6a0', fontSize: '0.9rem' }}>Quick Roll</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setGenericDiceCount(Math.max(1, genericDiceCount - 1))} className="dice-adjust-btn">-</button>
              <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '40px', textAlign: 'center' }}>{genericDiceCount}D6</span>
              <button onClick={() => setGenericDiceCount(genericDiceCount + 1)} className="dice-adjust-btn">+</button>
              <button onClick={handleGenericRoll} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#06d6a0', color: '#1a1a2e', fontWeight: 700, fontSize: '0.85rem' }}>Roll</button>
            </div>
            {genericResult && (
              <div style={{ marginTop: '0.4rem', padding: '0.4rem', backgroundColor: '#1a1a2e', borderRadius: '4px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  {genericResult.results.map((val, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '24px', height: '24px', borderRadius: '3px', fontSize: '0.8rem', fontWeight: 700,
                      backgroundColor: '#0f3460',
                      color: '#eee',
                    }}>
                      {val}
                    </span>
                  ))}
                </div>
                <span style={{ color: '#888' }}>Total: </span>
                <strong style={{ color: '#ffd60a' }}>{genericResult.total}</strong>
              </div>
            )}
          </div>
        </div>

        {/* GM Roll Initiator */}
        <div className="card" style={{ borderColor: '#e94560', borderWidth: '2px' }}>
          <h3 style={{ color: '#e94560' }}>Call for Roll</h3>

          {activeRequest ? (
            <div>
              <div style={{ padding: '0.75rem', backgroundColor: '#1a1a2e', borderRadius: '6px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffd60a' }}>
                  Active: {activeRequest.label}
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                  DC: {activeRequest.dcValue} ({activeRequest.dcType})
                </div>
              </div>

              <h4 style={{ marginBottom: '0.5rem' }}>Responses ({getLatestResponses().length}/{characters.length})</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {getLatestResponses().map(resp => (
                  <div key={resp.id} className="gm-response-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#eee' }}>{resp.characterName}</strong>
                      {resp.outcome && (
                        <span className="outcome-badge-sm" style={{ backgroundColor: OUTCOME_COLORS[resp.outcome] || '#888' }}>
                          {OUTCOME_LABELS[resp.outcome] || resp.outcome}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.25rem' }}>
                      Rolled: {resp.total} vs DC {activeRequest.dcValue}
                      {resp.complication && <span style={{ color: '#ef476f' }}> COMPLICATION</span>}
                      {resp.heroPointDelta > 0 && (
                        <span style={{ color: '#06d6a0' }}> (+{resp.heroPointDelta} HP)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.15rem' }}>
                      Dice: [{resp.diceRolled?.join(', ')}]
                      {resp.rollFlag && <span> ({resp.rollFlag})</span>}
                    </div>
                  </div>
                ))}
                {getLatestResponses().length === 0 && (
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>Waiting for players to roll...</p>
                )}
              </div>

              <button onClick={handleCloseRoll} style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', backgroundColor: '#ef476f' }}>
                Close Roll
              </button>
            </div>
          ) : (
            <div>
              {/* Skill picker */}
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#aaa' }}>Skill / Attribute:</label>
              <select
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
                className="select-input"
                style={{ width: '100%', marginBottom: '0.75rem' }}
              >
                <option value="">-- Select --</option>
                {Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attr]) => (
                  <optgroup key={attrKey} label={attr.label}>
                    <option value={`${attrKey}`}>{attr.label} (attribute only)</option>
                    {Object.entries(attr.skills).map(([skillKey, skillLabel]) => (
                      <option key={skillKey} value={`${attrKey}.${skillKey}`}>{skillLabel}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* DC Type */}
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#aaa' }}>DC Type:</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  onClick={() => { setDcType('static'); setDcDiceResults(null); setDcDiceTotal(null); }}
                  className={dcType === 'static' ? 'active' : ''}
                  style={{ flex: 1, padding: '0.5rem', backgroundColor: dcType === 'static' ? '#e94560' : '#16213e', border: '1px solid #444', borderRadius: '4px', color: '#eee', cursor: 'pointer' }}
                >
                  Static
                </button>
                <button
                  onClick={() => setDcType('dice')}
                  className={dcType === 'dice' ? 'active' : ''}
                  style={{ flex: 1, padding: '0.5rem', backgroundColor: dcType === 'dice' ? '#e94560' : '#16213e', border: '1px solid #444', borderRadius: '4px', color: '#eee', cursor: 'pointer' }}
                >
                  Dice Roll
                </button>
              </div>

              {/* Static DC */}
              {dcType === 'static' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#aaa' }}>DC:</label>
                    <input
                      type="number"
                      value={staticDC}
                      onChange={e => setStaticDC(parseInt(e.target.value) || 0)}
                      min={1}
                      style={{ width: '80px', padding: '0.4rem', backgroundColor: '#0f3460', color: '#eee', border: '1px solid #444', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {DIFFICULTY_TABLE.map(d => (
                      <button
                        key={d.dn}
                        onClick={() => setStaticDC(d.dn)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: staticDC === d.dn ? '#e94560' : '#16213e',
                          color: '#eee',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        {d.dn} {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dice DC */}
              {dcType === 'dice' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Dice:</label>
                    <button onClick={() => setDcDiceCount(Math.max(1, dcDiceCount - 1))} className="dice-adjust-btn">-</button>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{dcDiceCount}D6</span>
                    <button onClick={() => setDcDiceCount(dcDiceCount + 1)} className="dice-adjust-btn">+</button>
                    <button onClick={handleRollDC} style={{ marginLeft: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: '#e94560' }}>
                      Roll DC
                    </button>
                  </div>
                  {dcDiceResults && (
                    <div style={{ padding: '0.5rem', backgroundColor: '#1a1a2e', borderRadius: '6px' }}>
                      <span style={{ color: '#888' }}>Rolled: [{dcDiceResults.join(', ')}] = </span>
                      <strong style={{ color: '#ffd60a', fontSize: '1.1rem' }}>{dcDiceTotal}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Initiate button */}
              <button
                onClick={handleInitiateRoll}
                disabled={!selectedSkill || (dcType === 'dice' && dcDiceTotal == null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  backgroundColor: '#06d6a0',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: (!selectedSkill || (dcType === 'dice' && dcDiceTotal == null)) ? 0.5 : 1,
                }}
              >
                Call for Roll
              </button>
            </div>
          )}
        </div>

        {/* Recent Calls presets */}
        {presets.length > 0 && !activeRequest && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ color: '#ffd60a' }}>Recent Calls</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedSkill(p.selectedSkill);
                    setDcType(p.dcType);
                    setStaticDC(p.staticDC);
                    setDcDiceCount(p.dcDiceCount);
                    setDcDiceResults(null);
                    setDcDiceTotal(null);
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: selectedSkill === p.selectedSkill && dcType === p.dcType && staticDC === p.staticDC ? '#1a1a2e' : '#0f3460',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#eee',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{p.label}</span>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {p.dcType === 'static' ? `DC ${p.staticDC}` : `${p.dcDiceCount}D6 DC`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty reference */}
        <div className="card">
          <h3>Difficulty Numbers</h3>
          <table className="weapon-table">
            <thead><tr><th>DN</th><th>Difficulty</th></tr></thead>
            <tbody>
              {DIFFICULTY_TABLE.map(d => (
                <tr key={d.dn}><td style={{ fontWeight: 700, color: '#e94560' }}>{d.dn}</td><td>{d.label}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Characters section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3>Characters ({visibleChars.length}/{characters.length})</h3>
          </div>

          {/* Hidden characters toggle */}
          {hiddenCharsList.length > 0 && (
            <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: '#1a1a2e', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Hidden ({hiddenCharsList.length}):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {hiddenCharsList.map(char => (
                  <button
                    key={char.id}
                    onClick={() => toggleCharHidden(char.id)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#16213e', border: '1px solid #444', borderRadius: '3px', color: '#888', cursor: 'pointer' }}
                    title="Click to show"
                  >
                    {char.name} ↩
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Visible characters */}
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {visibleChars.map(char => (
              <div key={char.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleCharExpanded(char.id)}
                      style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #555', borderRadius: '3px', color: '#888', cursor: 'pointer' }}
                    >
                      {expandedChars[char.id] ? '▼' : '▶'}
                    </button>
                    <strong style={{ color: '#e94560' }}>{char.name}</strong>
                  </div>
                  <button
                    onClick={() => toggleCharHidden(char.id)}
                    style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #555', borderRadius: '3px', color: '#666', cursor: 'pointer' }}
                    title="Hide character"
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#aaa', marginTop: '0.25rem' }}>
                  <span>HP: {char.heroPoints}</span>
                  <span>Armor: {char.armor}</span>
                  <span>Dodge: {(char.attributes?.perception?.dice || 0) * 5}</span>
                  <span>Parry: {(char.attributes?.agility?.dice || 0) * 5}</span>
                </div>
                {/* Compressed attribute dice */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                  {Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attrDef]) => (
                    <span key={attrKey}>{attrDef.label}: {char.attributes?.[attrKey]?.dice || 0}D</span>
                  ))}
                </div>

                {/* Expanded: full skill breakdown */}
                {expandedChars[char.id] && char.attributes && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#0a0a1a', borderRadius: '4px' }}>
                    {Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attrDef]) => {
                      const attr = char.attributes[attrKey];
                      if (!attr) return null;
                      const skills = Object.entries(attrDef.skills)
                        .map(([sk, sl]) => ({ key: sk, label: sl, dice: attr.skills?.[sk] || 0, total: (attr.dice || 0) + (attr.skills?.[sk] || 0) }))
                        .filter(s => s.dice > 0);
                      return (
                        <div key={attrKey} style={{ marginBottom: '0.4rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e94560' }}>
                            {attrDef.label} ({attr.dice}D)
                          </div>
                          {skills.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingLeft: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>
                              {skills.map(s => (
                                <span key={s.key} style={{ backgroundColor: '#16213e', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                                  {s.label} +{s.dice}D = {s.total}D
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: '#555', paddingLeft: '0.5rem' }}>No trained skills</div>
                          )}
                        </div>
                      );
                    })}
                    {/* Weapons */}
                    {char.weapons && char.weapons.length > 0 && (
                      <div style={{ marginTop: '0.4rem', borderTop: '1px solid #333', paddingTop: '0.4rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffd60a' }}>Weapons</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>
                          {char.weapons.map((w, i) => (
                            <span key={i} style={{ backgroundColor: '#16213e', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                              {w.name} ({w.damage})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Recent Rolls */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Recent Rolls</h2>
          <button onClick={fetchRolls} style={{ padding: '0.5rem 1rem' }}>Refresh</button>
        </div>

        <div style={{ height: '700px', overflowY: 'auto', backgroundColor: '#0f3460', border: '1px solid #444', borderRadius: '8px', padding: '1rem' }}>
          {rolls.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', marginTop: '2rem' }}>No rolls yet.</p>
          )}

          {rolls.map(roll => {
            const charName = characters.find(c => c.id === roll.characterId)?.name || roll.characterId;

            if (roll.rollType === 'GM_ROLL') {
              return (
                <div key={roll.id} className="roll-result" style={{ borderLeft: `3px solid ${OUTCOME_COLORS[roll.outcome] || '#888'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{charName}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>
                      {new Date(roll.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    {roll.skill} — <strong>{roll.total}</strong> vs DC <strong>{roll.dcValue}</strong>
                    {' '}
                    <span style={{ color: OUTCOME_COLORS[roll.outcome] || '#888', fontWeight: 700 }}>
                      {OUTCOME_LABELS[roll.outcome] || roll.outcome}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                    Dice: [{roll.diceRolled?.join(', ')}]
                    {roll.complication && <span style={{ color: '#ef476f' }}> COMPLICATION</span>}
                    {roll.heroPointDelta > 0 && <span style={{ color: '#06d6a0' }}> +{roll.heroPointDelta} HP</span>}
                  </div>
                </div>
              );
            }

            const resultClass = roll.resultLevel === 'CRITICAL_SUCCESS' ? 'critical'
              : (roll.resultLevel === 'SUCCESS' || roll.resultLevel === 'PARTIAL') ? 'success'
              : 'failure';

            return (
              <div key={roll.id} className={`roll-result ${resultClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{charName}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {new Date(roll.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {roll.rollType === 'SKILL' && (
                  <>
                    <div>{roll.skill} — <strong style={{ color: resultClass === 'critical' ? '#ffd60a' : resultClass === 'success' ? '#06d6a0' : '#ef476f' }}>{roll.total}</strong></div>
                    <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                      Dice: [{roll.diceRolled?.join(', ')}]
                      {roll.complication && <span style={{ color: '#ef476f' }}> COMPLICATION</span>}
                    </div>
                  </>
                )}
                {roll.rollType === 'ATTACK' && (
                  <div>Attack: {roll.attackHits ? 'HIT' : 'MISS'}</div>
                )}
                {roll.rollType === 'DAMAGE' && (
                  <div>Damage: {roll.total} ({roll.weaponName})</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
