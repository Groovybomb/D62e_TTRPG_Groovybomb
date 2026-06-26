import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { ATTRIBUTE_DEFINITIONS, ADVANCED_SKILL_DEFINITIONS, getDicePool, getAdvancedDicePool } from '../data/attributes';
import RollModal from '../components/RollModal';

export default function CharacterPage({ userId, maxDice, refreshKey }) {
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [rollModal, setRollModal] = useState(null);
  const [damageRoll, setDamageRoll] = useState(null);

  useEffect(() => { fetchCharacters(); }, [userId, refreshKey]);

  const fetchCharacters = async () => {
    try {
      const res = await axios.get(`${API_URL}/characters`, { params: { userId } });
      setCharacters(res.data);
      if (res.data.length > 0 && !selectedId) setSelectedId(res.data[0].id);
    } catch { setError('Failed to load characters'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/characters`, { userId, name: newName });
      setCharacters([...characters, res.data]);
      setSelectedId(res.data.id);
      setNewName('');
      setShowCreate(false);
    } catch { setError('Failed to create character'); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/characters/${id}`);
      const updated = characters.filter(c => c.id !== id);
      setCharacters(updated);
      if (selectedId === id) setSelectedId(updated[0]?.id || null);
    } catch { setError('Failed to delete character'); }
  };

  const startEdit = () => {
    const char = characters.find(c => c.id === selectedId);
    const clone = JSON.parse(JSON.stringify(char));
    if (!clone.advancedSkills) {
      clone.advancedSkills = { jupiterDrive: 0, surgery: 0, perform: 0, cryptography: 0 };
    }
    setEditData(clone);
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      const res = await axios.patch(`${API_URL}/characters/${editData.id}`, editData);
      setCharacters(characters.map(c => c.id === res.data.id ? res.data : c));
      setEditing(false);
      setEditData(null);
    } catch { setError('Failed to save character'); }
  };

  const cancelEdit = () => { setEditing(false); setEditData(null); };

  const updateAttrDice = (attrKey, value) => {
    const val = Math.max(1, Math.min(5, parseInt(value) || 0));
    setEditData({ ...editData, attributes: { ...editData.attributes, [attrKey]: { ...editData.attributes[attrKey], dice: val } } });
  };

  const updateSkillDice = (attrKey, skillKey, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    setEditData({
      ...editData,
      attributes: {
        ...editData.attributes,
        [attrKey]: {
          ...editData.attributes[attrKey],
          skills: { ...editData.attributes[attrKey].skills, [skillKey]: val },
        },
      },
    });
  };

  const updateAdvancedSkill = (advKey, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    setEditData({
      ...editData,
      advancedSkills: { ...editData.advancedSkills, [advKey]: val },
    });
  };

  const char = editing ? editData : characters.find(c => c.id === selectedId);

  const openRollModal = (rollInfo) => {
    if (editing) return;
    setRollModal(rollInfo);
  };

  const openDamageRoll = (damageInfo) => {
    if (editing) return;
    setDamageRoll(damageInfo);
  };

  const handleHeroPointChange = async (newPoints) => {
    if (!char) return;
    const updated = { ...char, heroPoints: newPoints };
    try {
      await axios.patch(`${API_URL}/characters/${char.id}`, { heroPoints: newPoints });
      setCharacters(characters.map(c => c.id === char.id ? { ...c, heroPoints: newPoints } : c));
    } catch { /* ignore */ }
  };

  return (
    <div className="page">
      {error && <div className="error">{error}</div>}

      {/* Character selector bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600 }}>Character:</label>
        {characters.length > 0 && (
          <select
            value={selectedId || ''}
            onChange={(e) => { setSelectedId(e.target.value); setEditing(false); }}
            className="select-input"
          >
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {!showCreate && <button onClick={() => setShowCreate(true)}>+ New</button>}
        {char && !editing && (
          <>
            <button onClick={startEdit}>Edit</button>
            <button onClick={() => handleDelete(char.id)} style={{ background: '#ef476f' }}>Delete</button>
          </>
        )}
        {editing && (
          <>
            <button onClick={saveEdit} style={{ background: '#06d6a0' }}>Save</button>
            <button onClick={cancelEdit} style={{ background: '#555' }}>Cancel</button>
          </>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <h3>Create Character</h3>
          <div className="form-group">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Character name" required />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: '#555' }}>Cancel</button>
          </div>
        </form>
      )}

      {!char && !showCreate && (
        <div className="card"><p>No characters yet. Create one to get started!</p></div>
      )}

      {char && (
        <CharacterSheet
          char={char}
          editing={editing}
          onAttrChange={updateAttrDice}
          onSkillChange={updateSkillDice}
          onAdvancedSkillChange={updateAdvancedSkill}
          onFieldChange={(field, val) => setEditData({ ...editData, [field]: val })}
          onRoll={openRollModal}
          onDamageRoll={openDamageRoll}
        />
      )}

      {rollModal && char && (
        <RollModal
          rollInfo={rollModal}
          character={char}
          onClose={() => setRollModal(null)}
          onHeroPointChange={handleHeroPointChange}
          maxDice={maxDice}
        />
      )}

      {damageRoll && char && (
        <DamageRollModal
          damageInfo={damageRoll}
          character={char}
          onClose={() => setDamageRoll(null)}
          onHeroPointChange={handleHeroPointChange}
          maxDice={maxDice}
        />
      )}
    </div>
  );
}

function CharacterSheet({ char, editing, onAttrChange, onSkillChange, onAdvancedSkillChange, onFieldChange, onRoll, onDamageRoll }) {
  const dodge = (char.attributes.perception?.dice || 0) * 5;
  const parry = (char.attributes.agility?.dice || 0) * 5;

  return (
    <div className="character-sheet">
      {/* Header row */}
      <div className="sheet-header">
        <div className="sheet-header-left">
          <div className="sheet-stat">
            <span className="stat-label">Name</span>
            {editing
              ? <input type="text" value={char.name} onChange={e => onFieldChange('name', e.target.value)} className="stat-input stat-input-wide" />
              : <span className="stat-value">{char.name}</span>}
          </div>
          <div className="sheet-stat-row">
            <div className="sheet-stat">
              <span className="stat-label">Hero Points</span>
              {editing
                ? <input type="number" value={char.heroPoints} onChange={e => onFieldChange('heroPoints', parseInt(e.target.value) || 0)} className="stat-input" />
                : <span className="stat-value">{char.heroPoints}</span>}
            </div>
            <div className="sheet-stat">
              <span className="stat-label">Armor</span>
              {editing
                ? <input type="number" value={char.armor} onChange={e => onFieldChange('armor', parseInt(e.target.value) || 0)} className="stat-input" />
                : <span className="stat-value">{char.armor}</span>}
            </div>
          </div>
          <div className="sheet-stat-row">
            <div className="sheet-stat">
              <span className="stat-label">Dodge</span>
              <span className="stat-value computed">{dodge}</span>
              <span className="stat-note">Perception &times; 5</span>
            </div>
            <div className="sheet-stat">
              <span className="stat-label">Parry</span>
              <span className="stat-value computed">{parry}</span>
              <span className="stat-note">Agility &times; 5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes and Skills grid */}
      <div className="attributes-grid">
        {Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attrDef]) => {
          const attr = char.attributes[attrKey];
          if (!attr) return null;
          return (
            <div key={attrKey} className="attribute-block">
              <div className="attribute-header">
                <span className="attribute-name">{attrDef.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editing
                    ? <input type="number" min="1" max="5" value={attr.dice} onChange={e => onAttrChange(attrKey, e.target.value)} className="dice-input" />
                    : <span className="dice-badge">{attr.dice}D</span>}
                  {!editing && (
                    <button
                      className="roll-btn"
                      title={`Roll ${attrDef.label} (${attr.dice}D6)`}
                      onClick={() => onRoll({
                        label: attrDef.label,
                        attrLabel: attrDef.label,
                        attrDice: attr.dice,
                        skillLabel: null,
                        skillDice: 0,
                        baseDice: attr.dice,
                      })}
                    >
                      Roll
                    </button>
                  )}
                </div>
              </div>
              <div className="skill-list">
                {Object.entries(attrDef.skills).map(([skillKey, skillLabel]) => {
                  const skillDice = attr.skills[skillKey] || 0;
                  const totalDice = attr.dice + skillDice;
                  return (
                    <div key={skillKey} className="skill-row">
                      <span className="skill-name">{skillLabel}</span>
                      {editing ? (
                        <input type="number" min="0" value={skillDice} onChange={e => onSkillChange(attrKey, skillKey, e.target.value)} className="dice-input" />
                      ) : (
                        <span className="skill-dice">{skillDice > 0 ? skillDice : '-'}</span>
                      )}
                      <span className="total-dice" title={`${attrDef.label} ${attr.dice}D + ${skillLabel} ${skillDice}D`}>
                        {totalDice}D
                      </span>
                      {!editing && (
                        <button
                          className="roll-btn roll-btn-sm"
                          onClick={() => onRoll({
                            label: `${skillLabel} (${attrDef.label})`,
                            attrLabel: attrDef.label,
                            attrDice: attr.dice,
                            skillLabel,
                            skillDice,
                            baseDice: totalDice,
                          })}
                        >
                          Roll
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Skills */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Advanced</h3>
        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          Cannot be used untrained. Roll = advanced skill + base skill + attribute.
        </p>
        <div className="skill-list">
          {Object.entries(ADVANCED_SKILL_DEFINITIONS).map(([advKey, advDef]) => {
            const advDice = char.advancedSkills?.[advKey] || 0;
            const attr = char.attributes[advDef.baseAttribute];
            const attrDice = attr?.dice || 0;
            const baseSkillDice = attr?.skills?.[advDef.baseSkill] || 0;
            const totalDice = advDice > 0 ? advDice + baseSkillDice + attrDice : 0;
            const baseAttrDef = ATTRIBUTE_DEFINITIONS[advDef.baseAttribute];
            const baseSkillLabel = baseAttrDef.skills[advDef.baseSkill];
            return (
              <div key={advKey} className="skill-row">
                <span className="skill-name">
                  {advDef.label}
                  <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                    ({baseSkillLabel})
                  </span>
                </span>
                {editing ? (
                  <input type="number" min="0" value={advDice} onChange={e => onAdvancedSkillChange(advKey, e.target.value)} className="dice-input" />
                ) : (
                  <span className="skill-dice">{advDice > 0 ? advDice : '-'}</span>
                )}
                <span className="total-dice" title={advDice > 0 ? `${advDef.label} ${advDice}D + ${baseSkillLabel} ${baseSkillDice}D + ${baseAttrDef.label} ${attrDice}D` : 'Untrained'}>
                  {advDice > 0 ? `${totalDice}D` : '-'}
                </span>
                {!editing && (
                  <button
                    className="roll-btn roll-btn-sm"
                    disabled={advDice === 0}
                    title={advDice === 0 ? 'Cannot use untrained' : `Roll ${advDef.label} (${totalDice}D6)`}
                    onClick={() => advDice > 0 && onRoll({
                      label: `${advDef.label} (${baseAttrDef.label})`,
                      attrLabel: baseAttrDef.label,
                      attrDice: attrDice,
                      skillLabel: `${advDef.label} + ${baseSkillLabel}`,
                      skillDice: advDice + baseSkillDice,
                      baseDice: totalDice,
                    })}
                  >
                    Roll
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weapons */}
      <WeaponSection weapons={char.weapons || []} editing={editing} onChange={w => onFieldChange('weapons', w)} character={char} onDamageRoll={onDamageRoll} />

      {/* Talents, Flaws, Perks, Items in a grid */}
      <div className="extras-grid">
        <ListSection title="Talents" items={char.talents || []} editing={editing} onChange={v => onFieldChange('talents', v)} fields={['name', 'rank', 'description']} />
        <ListSection title="Flaws" items={char.flaws || []} editing={editing} onChange={v => onFieldChange('flaws', v)} fields={['name', 'rank', 'description']} />
        <ListSection title="Perks" items={char.perks || []} editing={editing} onChange={v => onFieldChange('perks', v)} fields={['name', 'description']} />
        <ListSection title="Items" items={char.items || []} editing={editing} onChange={v => onFieldChange('items', v)} fields={['name', 'description']} />
      </div>

      {/* Notes */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Notes</h3>
        {editing
          ? <textarea value={char.notes || ''} onChange={e => onFieldChange('notes', e.target.value)} rows={4} style={{ width: '100%', backgroundColor: '#0f3460', color: '#eee', border: '1px solid #444', borderRadius: '4px', padding: '0.5rem', resize: 'vertical' }} />
          : <p style={{ color: '#aaa', whiteSpace: 'pre-wrap' }}>{char.notes || 'No notes.'}</p>}
      </div>
    </div>
  );
}

function WeaponSection({ weapons, editing, onChange, character, onDamageRoll }) {
  const addWeapon = () => onChange([...weapons, { name: '', damage: '', ammo: '', shortRange: '', mediumRange: '', longRange: '' }]);
  const removeWeapon = (i) => onChange(weapons.filter((_, idx) => idx !== i));
  const updateWeapon = (i, field, value) => onChange(weapons.map((w, idx) => idx === i ? { ...w, [field]: value } : w));

  const parseDamage = (damageStr) => {
    const match = damageStr.match(/(\d+)D/i);
    return match ? parseInt(match[1]) : null;
  };

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3>Weapons</h3>
        {editing && <button onClick={addWeapon} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>+ Add</button>}
      </div>
      {weapons.length === 0 && <p style={{ color: '#888' }}>No weapons.</p>}
      {weapons.length > 0 && (
        <table className="weapon-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Damage</th>
              <th>Ammo</th>
              <th>Short</th>
              <th>Medium</th>
              <th>Long</th>
              {editing && <th></th>}
            </tr>
          </thead>
          <tbody>
            {weapons.map((w, i) => (
              <tr key={i}>
                {editing ? (
                  <>
                    <td><input value={w.name} onChange={e => updateWeapon(i, 'name', e.target.value)} /></td>
                    <td><input value={w.damage} onChange={e => updateWeapon(i, 'damage', e.target.value)} style={{ width: '60px' }} /></td>
                    <td><input value={w.ammo} onChange={e => updateWeapon(i, 'ammo', e.target.value)} style={{ width: '50px' }} /></td>
                    <td><input value={w.shortRange} onChange={e => updateWeapon(i, 'shortRange', e.target.value)} style={{ width: '50px' }} /></td>
                    <td><input value={w.mediumRange} onChange={e => updateWeapon(i, 'mediumRange', e.target.value)} style={{ width: '50px' }} /></td>
                    <td><input value={w.longRange} onChange={e => updateWeapon(i, 'longRange', e.target.value)} style={{ width: '50px' }} /></td>
                    <td><button onClick={() => removeWeapon(i)} style={{ background: '#ef476f', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>X</button></td>
                  </>
                ) : (
                  <>
                    <td>{w.name}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {w.damage}
                      {w.damage && onDamageRoll && (
                        <button
                          className="roll-btn roll-btn-sm"
                          title={`Roll damage for ${w.name}`}
                          onClick={() => {
                            const diceCount = parseDamage(w.damage);
                            if (diceCount) {
                              onDamageRoll({ weaponName: w.name, damageFormula: w.damage, diceCount });
                            }
                          }}
                        >
                          Roll
                        </button>
                      )}
                    </td>
                    <td>{w.ammo}</td>
                    <td>{w.shortRange}</td>
                    <td>{w.mediumRange}</td>
                    <td>{w.longRange}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ListSection({ title, items, editing, onChange, fields }) {
  const addItem = () => {
    const blank = {};
    fields.forEach(f => blank[f] = '');
    onChange([...items, blank]);
  };
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3>{title}</h3>
        {editing && <button onClick={addItem} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>+ Add</button>}
      </div>
      {items.length === 0 && <p style={{ color: '#888' }}>None.</p>}
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#0f3460', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {editing ? (
            <>
              {fields.map(f => (
                <input key={f} value={item[f] || ''} onChange={e => updateItem(i, f, e.target.value)} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} style={{ flex: f === 'description' ? 2 : 1, minWidth: '60px', padding: '0.3rem', backgroundColor: '#16213e', color: '#eee', border: '1px solid #444', borderRadius: '3px' }} />
              ))}
              <button onClick={() => removeItem(i)} style={{ background: '#ef476f', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>X</button>
            </>
          ) : (
            <span>
              <strong>{item.name}</strong>
              {item.rank && <span style={{ color: '#e94560' }}> (Rank {item.rank})</span>}
              {item.description && <span style={{ color: '#aaa' }}> — {item.description}</span>}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function DamageRollModal({ damageInfo, character, onClose, onHeroPointChange, maxDice }) {
  const [phase, setPhase] = useState('setup');
  const [extraDice, setExtraDice] = useState(0);
  const [doubled, setDoubled] = useState(false);
  const [doubleSource, setDoubleSource] = useState(null);
  const [diceResults, setDiceResults] = useState([]);
  const [rollTotal, setRollTotal] = useState(null);

  const baseDice = damageInfo.diceCount || 2;
  const rawDice = doubled ? (baseDice + extraDice) * 2 : baseDice + extraDice;
  const effectiveDice = maxDice ? Math.min(rawDice, maxDice) : rawDice;
  const isCapped = maxDice && rawDice > maxDice;
  const doubledPreview = maxDice ? Math.min((baseDice + extraDice) * 2, maxDice) : (baseDice + extraDice) * 2;
  const heroPoints = character.heroPoints || 0;

  const handleDouble = () => {
    if (heroPoints < 1) return;
    setDoubled(true);
    setDoubleSource('heroPoint');
    onHeroPointChange(heroPoints - 1);
  };

  const handleExceptionalDouble = () => {
    setDoubled(true);
    setDoubleSource('exceptional');
  };

  const handleUndoDouble = () => {
    if (doubleSource === 'heroPoint') {
      onHeroPointChange(heroPoints + 1);
    }
    setDoubled(false);
    setDoubleSource(null);
  };

  const executeRoll = async (flag = null) => {
    const count = effectiveDice;
    if (count < 1) return;

    // Roll plain dice (no wild die for damage)
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * 6) + 1);
    }
    const total = results.reduce((a, b) => a + b, 0);

    setDiceResults(results);
    setRollTotal({ total, results });
    setPhase('result');

    try {
      await axios.post(`${API_URL}/rolls/damage`, {
        characterId: character.id,
        characterName: character.name,
        weaponName: damageInfo.weaponName,
        damageFormula: damageInfo.damageFormula,
        diceCount: count,
        diceRolled: results,
        total,
        doubled,
        extraDice,
        rollFlag: flag,
      });
    } catch { /* roll still shows locally */ }
  };

  const handleReroll = () => {
    if (heroPoints < 1) return;
    onHeroPointChange(heroPoints - 1);
    executeRoll('REROLL');
  };

  const handleDoubleDown = () => {
    executeRoll('DOUBLE_DOWN');
  };

  const handleAccept = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ borderColor: '#e94560' }}>
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #e94560', marginBottom: '1rem', color: '#e94560', fontWeight: 700 }}>
          DAMAGE ROLL — {damageInfo.weaponName}
        </div>

        <h2 className="modal-title">{damageInfo.damageFormula}</h2>

        {phase === 'setup' && (
          <div className="roll-setup">
            <div className="dice-breakdown">
              <span className="breakdown-total">{baseDice}D6</span>
            </div>

            <div className="extra-dice-row">
              <label>Extra Dice:</label>
              <div className="extra-dice-controls">
                <button type="button" onClick={() => setExtraDice(Math.max(0, extraDice - 1))} className="dice-adjust-btn">-</button>
                <span className="extra-dice-value">{extraDice}</span>
                <button type="button" onClick={() => setExtraDice(extraDice + 1)} className="dice-adjust-btn">+</button>
              </div>
            </div>

            <div className="double-section">
              {!doubled ? (
                <>
                  <button onClick={handleDouble} disabled={heroPoints < 1} className="double-btn">
                    Double Dice ({doubledPreview}D6) — costs 1 Hero Point
                  </button>
                  <button onClick={handleExceptionalDouble} className="double-btn exceptional-double-btn">
                    Exceptional Success ({doubledPreview}D6) — free
                  </button>
                </>
              ) : (
                <div className="doubled-indicator">
                  <span>Doubled! Rolling {effectiveDice}D6 {doubleSource === 'exceptional' ? '(Exceptional Success)' : ''}</span>
                  <button onClick={handleUndoDouble} className="undo-double-btn">Undo</button>
                </div>
              )}
            </div>

            {isCapped && (
              <div style={{ color: '#ffd60a', fontSize: '0.85rem', padding: '0.4rem 0.6rem', backgroundColor: '#1a1a2e', borderRadius: '4px', marginBottom: '0.5rem', textAlign: 'center' }}>
                Dice capped at {maxDice}D6 (would be {rawDice}D6)
              </div>
            )}

            <div className="hero-points-display">
              Hero Points: <strong>{character.heroPoints}</strong>
            </div>

            <button onClick={() => executeRoll(null)} className="roll-execute-btn" disabled={effectiveDice < 1}>
              Roll {effectiveDice}D6 Damage
            </button>
          </div>
        )}

        {phase === 'result' && (
          <div className="roll-result-display">
            <div className="dice-visual-row">
              {diceResults.map((die, i) => (
                <div key={i} className="die-face" style={{ backgroundColor: '#e94560' }}>
                  <span className="die-number">{die}</span>
                </div>
              ))}
            </div>

            <div className="vs-display" style={{ marginTop: '1.5rem' }}>
              <span className="vs-total" style={{ color: '#e94560', fontSize: '2em' }}>{rollTotal?.total}</span>
              <span className="vs-label" style={{ color: '#888' }}>Damage</span>
            </div>

            {doubled && <div className="doubled-note">{doubleSource === 'exceptional' ? 'Doubled dice (Exceptional Success)' : 'Doubled dice (Hero Point spent)'}</div>}

            <div className="result-actions">
              <button onClick={handleReroll} disabled={heroPoints < 1} className="reroll-btn">
                Re-Roll (costs 1 Hero Point)
              </button>
              <button onClick={handleDoubleDown} className="doubledown-btn">
                Double Down (free, complication on 2nd fail)
              </button>
              <button onClick={handleAccept} className="close-result-btn">
                Accept Result
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
