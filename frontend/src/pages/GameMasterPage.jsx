import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { ATTRIBUTE_DEFINITIONS, DIFFICULTY_TABLE, getDicePool } from '../data/attributes';
import { OUTCOME_LABELS, OUTCOME_COLORS } from '../data/outcomes';
import { rollPlainDice } from '../utils/dice';

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

const PRESET_KEY = 'gm-roll-presets';
const HIDDEN_CHARS_KEY = 'gm-hidden-characters';
const INITIATIVE_KEY = 'gm-initiative-tracker';

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
  const [isInitiativeRoll, setIsInitiativeRoll] = useState(false);

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

  // Initiative Tracker
  const [initEntries, setInitEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(INITIATIVE_KEY)) || []; } catch { return []; }
  });
  const [initActive, setInitActive] = useState(-1);
  const [initNewName, setInitNewName] = useState('');
  const [initNewRoll, setInitNewRoll] = useState('');
  const [initEditId, setInitEditId] = useState(null);
  const [initEditName, setInitEditName] = useState('');
  const [initEditRoll, setInitEditRoll] = useState('');

  const saveInitEntries = (entries) => {
    setInitEntries(entries);
    localStorage.setItem(INITIATIVE_KEY, JSON.stringify(entries));
  };

  const addInitEntry = () => {
    if (!initNewName.trim()) return;
    const roll = parseInt(initNewRoll) || 0;
    const entry = { id: Date.now().toString(), name: initNewName.trim(), roll };
    const updated = [...initEntries, entry].sort((a, b) => b.roll - a.roll);
    saveInitEntries(updated);
    setInitNewName('');
    setInitNewRoll('');
    if (initActive >= 0) {
      const activeId = initEntries[initActive]?.id;
      const newIdx = updated.findIndex(e => e.id === activeId);
      setInitActive(newIdx >= 0 ? newIdx : -1);
    }
  };

  const removeInitEntry = (id) => {
    const activeId = initEntries[initActive]?.id;
    const updated = initEntries.filter(e => e.id !== id);
    saveInitEntries(updated);
    if (updated.length === 0) { setInitActive(-1); return; }
    if (activeId === id) { setInitActive(Math.min(initActive, updated.length - 1)); return; }
    const newIdx = updated.findIndex(e => e.id === activeId);
    setInitActive(newIdx >= 0 ? newIdx : -1);
  };

  const moveInitEntry = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= initEntries.length) return;
    const updated = [...initEntries];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    saveInitEntries(updated);
    if (initActive === index) setInitActive(target);
    else if (initActive === target) setInitActive(index);
  };

  const startEditInit = (entry) => {
    setInitEditId(entry.id);
    setInitEditName(entry.name);
    setInitEditRoll(String(entry.roll));
  };

  const saveEditInit = () => {
    const updated = initEntries.map(e => e.id === initEditId ? { ...e, name: initEditName.trim() || e.name, roll: parseInt(initEditRoll) || 0 } : e);
    saveInitEntries(updated);
    setInitEditId(null);
  };

  const nextTurn = () => {
    if (initEntries.length === 0) return;
    setInitActive(prev => prev >= initEntries.length - 1 ? 0 : prev + 1);
  };

  const prevTurn = () => {
    if (initEntries.length === 0) return;
    setInitActive(prev => prev <= 0 ? initEntries.length - 1 : prev - 1);
  };

  const clearInitiative = async () => {
    saveInitEntries([]);
    setInitActive(-1);
    try { await axios.delete(`${API_URL}/initiative`); } catch { /* ignore */ }
  };

  const callForInitiativeRoll = async () => {
    if (activeRequest) return;
    try {
      const res = await axios.post(`${API_URL}/gm-rolls`, {
        gmUserId: userId,
        skill: null,
        skillLabel: null,
        attribute: 'perception',
        attributeLabel: 'Perception',
        label: 'Initiative (Perception)',
        dcType: 'static',
        dcValue: 0,
        dcDiceCount: null,
        dcDiceResults: null,
      });
      setActiveRequest(res.data);
      setResponses([]);
      setIsInitiativeRoll(true);
    } catch { /* ignore */ }
  };

  // GM Notes
  const [gmNotes, setGmNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);

  const fetchInitiative = async () => {
    try {
      const res = await axios.get(`${API_URL}/initiative`);
      const apiEntries = res.data;
      if (apiEntries.length === 0) return;
      let updated = [...initEntries];
      let changed = false;
      for (const entry of apiEntries) {
        const existing = updated.findIndex(e => e.charId === entry.characterId);
        if (existing >= 0) {
          if (updated[existing].roll !== entry.total) {
            updated[existing] = { ...updated[existing], name: entry.characterName, roll: entry.total };
            changed = true;
          }
        } else {
          updated.push({ id: entry.id, charId: entry.characterId, name: entry.characterName, roll: entry.total, isNPC: entry.isNPC });
          changed = true;
        }
      }
      if (changed) {
        updated.sort((a, b) => b.roll - a.roll);
        saveInitEntries(updated);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchCharacters();
    checkActiveRequest();
    fetchGmNotes();
    fetchInitiative();
    const initInterval = setInterval(fetchInitiative, 5000);
    return () => clearInterval(initInterval);
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

  useEffect(() => {
    if (!isInitiativeRoll || responses.length === 0) return;
    const byChar = {};
    for (const r of responses) {
      if (!byChar[r.characterId] || new Date(r.createdAt) > new Date(byChar[r.characterId].createdAt)) {
        byChar[r.characterId] = r;
      }
    }
    const latest = Object.values(byChar);
    let updated = [...initEntries];
    for (const r of latest) {
      const existing = updated.findIndex(e => e.charId === r.characterId);
      if (existing >= 0) {
        updated[existing] = { ...updated[existing], name: r.characterName, roll: r.total };
      } else {
        updated.push({ id: Date.now().toString() + r.characterId, charId: r.characterId, name: r.characterName, roll: r.total });
      }
    }
    updated.sort((a, b) => b.roll - a.roll);
    saveInitEntries(updated);
    if (initActive >= 0) {
      const activeId = initEntries[initActive]?.id;
      const newIdx = updated.findIndex(e => e.id === activeId);
      setInitActive(newIdx >= 0 ? newIdx : -1);
    }
  }, [responses, isInitiativeRoll]);

  const fetchCharacters = async () => {
    try {
      const res = await axios.get(`${API_URL}/characters`, { params: { isNPC: 'false' } });
      setCharacters(res.data);
    } catch { /* ignore */ }
  };

  const checkActiveRequest = async () => {
    try {
      const res = await axios.get(`${API_URL}/gm-rolls`);
      const active = res.data.find(r => r.status === 'active');
      if (active) {
        setActiveRequest(active);
        if (active.label === 'Initiative (Perception)') setIsInitiativeRoll(true);
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
      setIsInitiativeRoll(false);

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
      setIsInitiativeRoll(false);
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

  const fetchGmNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      setGmNotes(res.data.gmNotes || '');
    } catch { /* ignore */ }
  };

  const saveGmNotes = useCallback(async (text) => {
    try {
      await axios.patch(`${API_URL}/settings`, { gmNotes: text });
      setNotesSaved(true);
    } catch { /* ignore */ }
  }, []);

  const debouncedSaveNotes = useDebounce(saveGmNotes, 800);

  const handleNotesChange = (e) => {
    const text = e.target.value;
    setGmNotes(text);
    setNotesSaved(false);
    debouncedSaveNotes(text);
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
            <h4 style={{ margin: '0 0 0.5rem', color: '#e3b341', fontSize: '0.9rem' }}>Max Dice Cap</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                value={maxDiceInput}
                onChange={e => setMaxDiceInput(e.target.value)}
                min={1}
                placeholder="No limit"
                style={{ width: '80px', padding: '0.4rem', backgroundColor: '#1c2128', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '4px' }}
              />
              <button onClick={handleMaxDiceSave} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Set</button>
              {maxDice && (
                <button onClick={async () => { setMaxDiceInput(''); onMaxDiceChange(null); try { await axios.patch(`${API_URL}/settings`, { maxDice: null }); } catch {} }} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#484f58' }}>Clear</button>
              )}
            </div>
            {maxDice && <div style={{ fontSize: '0.8rem', color: '#e3b341', marginTop: '0.25rem' }}>Active: {maxDice}D6 max</div>}
          </div>

          {/* Generic Roll */}
          <div className="card" style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#3fb950', fontSize: '0.9rem' }}>Quick Roll</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setGenericDiceCount(Math.max(1, genericDiceCount - 1))} className="dice-adjust-btn">-</button>
              <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '40px', textAlign: 'center' }}>{genericDiceCount}D6</span>
              <button onClick={() => setGenericDiceCount(genericDiceCount + 1)} className="dice-adjust-btn">+</button>
              <button onClick={handleGenericRoll} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#3fb950', color: '#0d1117', fontWeight: 700, fontSize: '0.85rem' }}>Roll</button>
            </div>
            {genericResult && (
              <div style={{ marginTop: '0.4rem', padding: '0.4rem', backgroundColor: '#0d1117', borderRadius: '4px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  {genericResult.results.map((val, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '24px', height: '24px', borderRadius: '3px', fontSize: '0.8rem', fontWeight: 700,
                      backgroundColor: '#1c2128',
                      color: '#e6edf3',
                    }}>
                      {val}
                    </span>
                  ))}
                </div>
                <span style={{ color: '#7d8590' }}>Total: </span>
                <strong style={{ color: '#e3b341' }}>{genericResult.total}</strong>
              </div>
            )}
          </div>
        </div>

        {/* GM Roll Initiator */}
        <div className="card" style={{ borderColor: '#818cf8', borderWidth: '2px' }}>
          <h3 style={{ color: '#818cf8' }}>Call for Roll</h3>

          {activeRequest ? (
            <div>
              <div style={{ padding: '0.75rem', backgroundColor: '#0d1117', borderRadius: '6px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e3b341' }}>
                  Active: {activeRequest.label}
                </div>
                <div style={{ color: '#7d8590', fontSize: '0.85rem' }}>
                  DC: {activeRequest.dcValue} ({activeRequest.dcType})
                </div>
              </div>

              <h4 style={{ marginBottom: '0.5rem' }}>Responses ({getLatestResponses().length}/{characters.filter(c => !c.isNPC).length})</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {getLatestResponses().map(resp => (
                  <div key={resp.id} className="gm-response-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#e6edf3' }}>{resp.characterName}</strong>
                      {resp.outcome && (
                        <span className="outcome-badge-sm" style={{ backgroundColor: OUTCOME_COLORS[resp.outcome] || '#7d8590' }}>
                          {OUTCOME_LABELS[resp.outcome] || resp.outcome}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#8b949e', marginTop: '0.25rem' }}>
                      Rolled: {resp.total} vs DC {activeRequest.dcValue}
                      {resp.complication && <span style={{ color: '#f85149' }}> COMPLICATION</span>}
                      {resp.heroPointDelta > 0 && (
                        <span style={{ color: '#3fb950' }}> (+{resp.heroPointDelta} HP)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6e7681', marginTop: '0.15rem' }}>
                      Dice: [{resp.diceRolled?.join(', ')}]
                      {resp.rollFlag && <span> ({resp.rollFlag})</span>}
                    </div>
                  </div>
                ))}
                {getLatestResponses().length === 0 && (
                  <p style={{ color: '#6e7681', fontSize: '0.85rem' }}>Waiting for players to roll...</p>
                )}
              </div>

              <button onClick={handleCloseRoll} style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', backgroundColor: '#f85149' }}>
                Close Roll
              </button>
            </div>
          ) : (
            <div>
              {/* Skill picker */}
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#8b949e' }}>Skill / Attribute:</label>
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
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#8b949e' }}>DC Type:</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  onClick={() => { setDcType('static'); setDcDiceResults(null); setDcDiceTotal(null); }}
                  className={dcType === 'static' ? 'active' : ''}
                  style={{ flex: 1, padding: '0.5rem', backgroundColor: dcType === 'static' ? '#818cf8' : '#161b22', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', cursor: 'pointer' }}
                >
                  Static
                </button>
                <button
                  onClick={() => setDcType('dice')}
                  className={dcType === 'dice' ? 'active' : ''}
                  style={{ flex: 1, padding: '0.5rem', backgroundColor: dcType === 'dice' ? '#818cf8' : '#161b22', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', cursor: 'pointer' }}
                >
                  Dice Roll
                </button>
              </div>

              {/* Static DC */}
              {dcType === 'static' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>DC:</label>
                    <input
                      type="number"
                      value={staticDC}
                      onChange={e => setStaticDC(parseInt(e.target.value) || 0)}
                      min={1}
                      style={{ width: '80px', padding: '0.4rem', backgroundColor: '#1c2128', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '4px' }}
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
                          backgroundColor: staticDC === d.dn ? '#818cf8' : '#161b22',
                          color: '#e6edf3',
                          border: '1px solid #30363d',
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
                    <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Dice:</label>
                    <button onClick={() => setDcDiceCount(Math.max(1, dcDiceCount - 1))} className="dice-adjust-btn">-</button>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{dcDiceCount}D6</span>
                    <button onClick={() => setDcDiceCount(dcDiceCount + 1)} className="dice-adjust-btn">+</button>
                    <button onClick={handleRollDC} style={{ marginLeft: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: '#818cf8' }}>
                      Roll DC
                    </button>
                  </div>
                  {dcDiceResults && (
                    <div style={{ padding: '0.5rem', backgroundColor: '#0d1117', borderRadius: '6px' }}>
                      <span style={{ color: '#7d8590' }}>Rolled: [{dcDiceResults.join(', ')}] = </span>
                      <strong style={{ color: '#e3b341', fontSize: '1.1rem' }}>{dcDiceTotal}</strong>
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
                  backgroundColor: '#3fb950',
                  color: '#0d1117',
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
            <h3 style={{ color: '#e3b341' }}>Recent Calls</h3>
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
                    backgroundColor: selectedSkill === p.selectedSkill && dcType === p.dcType && staticDC === p.staticDC ? '#0d1117' : '#1c2128',
                    border: '1px solid #30363d',
                    borderRadius: '4px',
                    color: '#e6edf3',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{p.label}</span>
                  <span style={{ fontSize: '0.8rem', color: '#7d8590' }}>
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
                <tr key={d.dn}><td style={{ fontWeight: 700, color: '#818cf8' }}>{d.dn}</td><td>{d.label}</td></tr>
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
            <div style={{ marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: '#0d1117', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.8rem', color: '#7d8590', marginBottom: '0.25rem' }}>Hidden ({hiddenCharsList.length}):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {hiddenCharsList.map(char => (
                  <button
                    key={char.id}
                    onClick={() => toggleCharHidden(char.id)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '3px', color: '#7d8590', cursor: 'pointer' }}
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
              <div key={char.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #21262d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleCharExpanded(char.id)}
                      style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #484f58', borderRadius: '3px', color: '#7d8590', cursor: 'pointer' }}
                    >
                      {expandedChars[char.id] ? '▼' : '▶'}
                    </button>
                    <strong style={{ color: '#818cf8' }}>{char.name}</strong>
                  </div>
                  <button
                    onClick={() => toggleCharHidden(char.id)}
                    style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #484f58', borderRadius: '3px', color: '#6e7681', cursor: 'pointer' }}
                    title="Hide character"
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#8b949e', marginTop: '0.25rem' }}>
                  <span>HP: {char.heroPoints}</span>
                  <span>Armor: {char.armor}</span>
                  <span>Dodge: {(char.attributes?.perception?.dice || 0) * 5}</span>
                  <span>Parry: {(char.attributes?.agility?.dice || 0) * 5}</span>
                </div>
                {/* Compressed attribute dice */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: '#7d8590', marginTop: '0.25rem' }}>
                  {Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attrDef]) => (
                    <span key={attrKey}>{attrDef.label}: {char.attributes?.[attrKey]?.dice || 0}D</span>
                  ))}
                </div>

                {/* Expanded: full skill breakdown */}
                {expandedChars[char.id] && char.attributes && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#010409', borderRadius: '4px' }}>
                    {Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attrDef]) => {
                      const attr = char.attributes[attrKey];
                      if (!attr) return null;
                      const skills = Object.entries(attrDef.skills)
                        .map(([sk, sl]) => ({ key: sk, label: sl, dice: attr.skills?.[sk] || 0, total: (attr.dice || 0) + (attr.skills?.[sk] || 0) }))
                        .filter(s => s.dice > 0);
                      return (
                        <div key={attrKey} style={{ marginBottom: '0.4rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>
                            {attrDef.label} ({attr.dice}D)
                          </div>
                          {skills.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingLeft: '0.5rem', fontSize: '0.75rem', color: '#8b949e' }}>
                              {skills.map(s => (
                                <span key={s.key} style={{ backgroundColor: '#161b22', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                                  {s.label} +{s.dice}D = {s.total}D
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: '#484f58', paddingLeft: '0.5rem' }}>No trained skills</div>
                          )}
                        </div>
                      );
                    })}
                    {/* Weapons */}
                    {char.weapons && char.weapons.length > 0 && (
                      <div style={{ marginTop: '0.4rem', borderTop: '1px solid #21262d', paddingTop: '0.4rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e3b341' }}>Weapons</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#8b949e' }}>
                          {char.weapons.map((w, i) => (
                            <span key={i} style={{ backgroundColor: '#161b22', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
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

      {/* Right: Initiative Tracker */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>Initiative Tracker</h2>
          <button
            onClick={callForInitiativeRoll}
            disabled={!!activeRequest}
            style={{ padding: '0.4rem 0.8rem', backgroundColor: activeRequest ? '#484f58' : '#e3b341', color: '#0d1117', fontWeight: 700, fontSize: '0.85rem', borderRadius: '4px', border: 'none', cursor: activeRequest ? 'not-allowed' : 'pointer' }}
          >
            Roll Initiative
          </button>
        </div>

        {/* Add entry */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={initNewName}
              onChange={e => setInitNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addInitEntry()}
              placeholder="Name (player or NPC)"
              style={{ flex: 2, minWidth: '120px', padding: '0.4rem', backgroundColor: '#1c2128', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '4px' }}
            />
            <input
              type="number"
              value={initNewRoll}
              onChange={e => setInitNewRoll(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addInitEntry()}
              placeholder="Roll"
              style={{ width: '70px', padding: '0.4rem', backgroundColor: '#1c2128', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '4px' }}
            />
            <button onClick={addInitEntry} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#3fb950', color: '#0d1117', fontWeight: 700 }}>Add</button>
          </div>
        </div>

        {/* Turn controls */}
        {initEntries.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
            <button onClick={prevTurn} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#161b22', border: '1px solid #30363d', color: '#e6edf3', borderRadius: '4px' }}>Prev</button>
            <button onClick={nextTurn} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#818cf8', fontWeight: 700, fontSize: '1rem', borderRadius: '4px', border: 'none', color: '#e6edf3', cursor: 'pointer' }}>
              Next Turn
            </button>
            <button onClick={() => setInitActive(-1)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#161b22', border: '1px solid #30363d', color: '#7d8590', borderRadius: '4px' }}>Reset</button>
            <button onClick={clearInitiative} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#f85149', borderRadius: '4px', border: 'none', color: '#e6edf3', cursor: 'pointer' }}>Clear</button>
          </div>
        )}

        {/* Initiative list */}
        <div style={{ backgroundColor: '#1c2128', border: '1px solid #30363d', borderRadius: '8px', overflow: 'hidden' }}>
          {initEntries.length === 0 && (
            <p style={{ color: '#7d8590', textAlign: 'center', padding: '2rem' }}>No initiative entries. Add characters and NPCs above.</p>
          )}
          {initEntries.map((entry, idx) => {
            const isActive = idx === initActive;
            const isEditing = initEditId === entry.id;
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem',
                  backgroundColor: isActive ? '#3fb95020' : 'transparent',
                  borderLeft: isActive ? '4px solid #3fb950' : '4px solid transparent',
                  borderBottom: idx < initEntries.length - 1 ? '1px solid #21262d' : 'none',
                  transition: 'background-color 0.2s',
                }}
              >
                {/* Turn marker */}
                <span style={{ width: '20px', textAlign: 'center', fontSize: '0.9rem', color: isActive ? '#3fb950' : 'transparent', fontWeight: 700 }}>
                  {isActive ? '▶' : ''}
                </span>

                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={initEditName}
                      onChange={e => setInitEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEditInit()}
                      style={{ flex: 1, padding: '0.3rem', backgroundColor: '#161b22', color: '#e6edf3', border: '1px solid #484f58', borderRadius: '3px' }}
                    />
                    <input
                      type="number"
                      value={initEditRoll}
                      onChange={e => setInitEditRoll(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEditInit()}
                      style={{ width: '55px', padding: '0.3rem', backgroundColor: '#161b22', color: '#e3b341', border: '1px solid #484f58', borderRadius: '3px', textAlign: 'center' }}
                    />
                    <button onClick={saveEditInit} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#3fb950', color: '#0d1117', border: 'none', borderRadius: '3px' }}>OK</button>
                    <button onClick={() => setInitEditId(null)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#484f58', border: 'none', borderRadius: '3px', color: '#e6edf3' }}>X</button>
                  </>
                ) : (
                  <>
                    {/* Name */}
                    <span style={{ flex: 1, fontWeight: isActive ? 700 : 400, color: isActive ? '#3fb950' : '#e6edf3', fontSize: '0.95rem' }}>
                      {entry.name}
                      {entry.isNPC && <span style={{ color: '#f0883e', fontSize: '0.75rem', marginLeft: '0.35rem' }}>[NPC]</span>}
                    </span>

                    {/* Roll value */}
                    <span style={{ fontWeight: 700, color: '#e3b341', fontSize: '1rem', minWidth: '30px', textAlign: 'center' }}>
                      {entry.roll}
                    </span>

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <button onClick={() => moveInitEntry(idx, -1)} disabled={idx === 0} style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #484f58', borderRadius: '3px', color: idx === 0 ? '#21262d' : '#7d8590', cursor: idx === 0 ? 'default' : 'pointer' }} title="Move up">&#9650;</button>
                      <button onClick={() => moveInitEntry(idx, 1)} disabled={idx === initEntries.length - 1} style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #484f58', borderRadius: '3px', color: idx === initEntries.length - 1 ? '#21262d' : '#7d8590', cursor: idx === initEntries.length - 1 ? 'default' : 'pointer' }} title="Move down">&#9660;</button>
                      <button onClick={() => startEditInit(entry)} style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #484f58', borderRadius: '3px', color: '#7d8590', cursor: 'pointer' }} title="Edit">&#9998;</button>
                      <button onClick={() => removeInitEntry(entry.id)} style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem', backgroundColor: 'transparent', border: '1px solid #f85149', borderRadius: '3px', color: '#f85149', cursor: 'pointer' }} title="Remove">&#10005;</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* GM Notes */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3>GM Notes</h3>
            <span style={{ fontSize: '0.75rem', color: notesSaved ? '#3fb950' : '#e3b341' }}>
              {notesSaved ? 'Saved' : 'Saving...'}
            </span>
          </div>
          <textarea
            value={gmNotes}
            onChange={handleNotesChange}
            placeholder="Track chase progress, encounter notes, session reminders..."
            rows={8}
            style={{
              width: '100%',
              backgroundColor: '#1c2128',
              color: '#e6edf3',
              border: '1px solid #30363d',
              borderRadius: '4px',
              padding: '0.5rem',
              resize: 'vertical',
              fontSize: '0.9rem',
              lineHeight: '1.5',
            }}
          />
        </div>

        {/* Hacking Reference */}
        <div className="card" style={{ marginTop: '1rem', borderColor: '#484f58' }}>
          <h3 style={{ color: '#7d8590' }}>Hacking Reference</h3>
          <p style={{ color: '#8b949e', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
            Skill: <strong style={{ color: '#e6edf3' }}>Computers</strong> vs. target&apos;s <strong style={{ color: '#e6edf3' }}>Firewall</strong> (Technical &times; 5 for player devices).
          </p>
          <table className="weapon-table" style={{ fontSize: '0.82rem' }}>
            <thead><tr><th>Result</th><th>Outcome</th></tr></thead>
            <tbody>
              <tr><td style={{ color: '#f85149', fontWeight: 700 }}>Fail by 10+</td><td>Identity revealed &mdash; traced immediately, counter-attack possible</td></tr>
              <tr><td style={{ color: '#f85149', fontWeight: 700 }}>Fail by 5-9</td><td>Traced &mdash; location pinpointed, target alerted</td></tr>
              <tr><td style={{ color: '#818cf8', fontWeight: 700 }}>Fail by 1-4</td><td>Locked out &mdash; cannot retry this session</td></tr>
              <tr><td style={{ color: '#3fb950', fontWeight: 700 }}>Beat DC</td><td>Access gained &mdash; can read/copy data</td></tr>
              <tr><td style={{ color: '#3fb950', fontWeight: 700 }}>Beat DC by 5+</td><td>Full control &mdash; lock/unlock doors, fry equipment, plant false data</td></tr>
              <tr><td style={{ color: '#3fb950', fontWeight: 700 }}>Beat DC by 10+</td><td>Ghost access &mdash; no logs, backdoor installed for future use</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#6e7681' }}>
            Firewall examples: Personal device 10 &bull; Corporate terminal 20 &bull; Military system 30 &bull; AI core 40
          </div>
        </div>

        {/* Environmental Hazards Reference */}
        <div className="card" style={{ marginTop: '1rem', borderColor: '#484f58' }}>
          <h3 style={{ color: '#7d8590' }}>Environmental Hazards</h3>
          <p style={{ color: '#8b949e', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
            Skill: <strong style={{ color: '#e6edf3' }}>Stamina</strong> (Brawn) at the listed interval. Failure causes wound escalation.
          </p>
          <table className="weapon-table" style={{ fontSize: '0.82rem' }}>
            <thead><tr><th>Hazard</th><th>Difficulty</th><th>Interval</th><th>Damage / Effect</th></tr></thead>
            <tbody>
              <tr><td style={{ fontWeight: 700, color: '#e3b341' }}>Extreme Heat</td><td>15</td><td>Every 10 min</td><td>Fail: +1 wound level. Protective gear gives +2D.</td></tr>
              <tr><td style={{ fontWeight: 700, color: '#58a6ff' }}>Extreme Cold</td><td>15</td><td>Every 10 min</td><td>Fail: +1 wound level. Cold weather gear gives +1D.</td></tr>
              <tr><td style={{ fontWeight: 700, color: '#58a6ff' }}>Drowning</td><td>5, +5 each round</td><td>Every round</td><td>Fail: Incapacitated, then Mortally Wounded next round.</td></tr>
              <tr><td style={{ fontWeight: 700, color: '#3fb950' }}>Toxic Gas / Poison</td><td>15-25</td><td>Per exposure</td><td>Fail: 3D-5D damage (resisted by Stamina). Gas mask gives +2D.</td></tr>
              <tr><td style={{ fontWeight: 700, color: '#818cf8' }}>Vacuum / Decompression</td><td>20</td><td>Every round</td><td>Fail: +1 wound level. Enviro-suit required. Without suit: automatic 4D damage/round.</td></tr>
              <tr><td style={{ fontWeight: 700, color: '#818cf8' }}>Fire / Burns</td><td>&mdash;</td><td>Per exposure</td><td>Light fire 2D, heavy fire 4D, inferno 6D damage. Stamina to resist.</td></tr>
              <tr><td style={{ fontWeight: 700, color: '#e3b341' }}>Radiation</td><td>20</td><td>Every hour</td><td>Fail: +1 wound level. Cumulative; protective shielding required.</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#6e7681' }}>
            Wound penalties from hazard damage stack normally. Characters at Incapacitated+ cannot act without help.
          </div>
        </div>
      </div>
    </div>
  );
}
