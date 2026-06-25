import { useState, useEffect } from 'react';
import axios from 'axios';
import { ATTRIBUTE_DEFINITIONS, getDicePool } from '../data/attributes';
import RollModal from '../components/RollModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CharacterPage({ userId }) {
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [rollModal, setRollModal] = useState(null);

  useEffect(() => { fetchCharacters(); }, [userId]);

  const fetchCharacters = async () => {
    try {
      const res = await axios.get(`${API_URL}/characters`);
      const mine = res.data.filter(c => c.userId === userId);
      setCharacters(mine);
      if (mine.length > 0 && !selectedId) setSelectedId(mine[0].id);
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
    setEditData(JSON.parse(JSON.stringify(char)));
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

  const char = editing ? editData : characters.find(c => c.id === selectedId);

  const openRollModal = (rollInfo) => {
    if (editing) return;
    setRollModal(rollInfo);
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
          onFieldChange={(field, val) => setEditData({ ...editData, [field]: val })}
          onRoll={openRollModal}
        />
      )}

      {rollModal && char && (
        <RollModal
          rollInfo={rollModal}
          character={char}
          onClose={() => setRollModal(null)}
          onHeroPointChange={handleHeroPointChange}
        />
      )}
    </div>
  );
}

function CharacterSheet({ char, editing, onAttrChange, onSkillChange, onFieldChange, onRoll }) {
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

      {/* Weapons */}
      <WeaponSection weapons={char.weapons || []} editing={editing} onChange={w => onFieldChange('weapons', w)} />

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

function WeaponSection({ weapons, editing, onChange }) {
  const addWeapon = () => onChange([...weapons, { name: '', damage: '', ammo: '', shortRange: '', mediumRange: '', longRange: '' }]);
  const removeWeapon = (i) => onChange(weapons.filter((_, idx) => idx !== i));
  const updateWeapon = (i, field, value) => onChange(weapons.map((w, idx) => idx === i ? { ...w, [field]: value } : w));

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
                    <td>{w.damage}</td>
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
