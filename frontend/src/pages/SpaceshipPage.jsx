import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STAT_DEFS = [
  { key: 'navicomp', label: 'Navicomp' },
  { key: 'maneuverability', label: 'Maneuverability' },
  { key: 'engines', label: 'Engines' },
  { key: 'hull', label: 'Hull' },
  { key: 'shield', label: 'Shield' },
];

const CREW_ROLES = [
  { key: 'captain', label: 'Captain', duty: 'Moving' },
  { key: 'helm', label: 'Helm', duty: 'Evading' },
  { key: 'tactical', label: 'Tactical', duty: 'Attacking' },
  { key: 'operations', label: 'Operations', duty: 'Resist Damage' },
  { key: 'engineer', label: 'Engineer', duty: 'Repairs' },
];

export default function SpaceshipPage({ userId }) {
  const [ships, setShips] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchShips(); }, [userId]);

  const fetchShips = async () => {
    try {
      const res = await axios.get(`${API_URL}/spaceships`);
      const mine = res.data.filter(s => s.userId === userId);
      setShips(mine);
      if (mine.length > 0 && !selectedId) setSelectedId(mine[0].id);
    } catch { setError('Failed to load spaceships'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/spaceships`, { userId, name: newName });
      setShips([...ships, res.data]);
      setSelectedId(res.data.id);
      setNewName('');
      setShowCreate(false);
    } catch { setError('Failed to create spaceship'); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/spaceships/${id}`);
      const updated = ships.filter(s => s.id !== id);
      setShips(updated);
      if (selectedId === id) setSelectedId(updated[0]?.id || null);
    } catch { setError('Failed to delete spaceship'); }
  };

  const startEdit = () => {
    const ship = ships.find(s => s.id === selectedId);
    setEditData(JSON.parse(JSON.stringify(ship)));
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      const res = await axios.patch(`${API_URL}/spaceships/${editData.id}`, editData);
      setShips(ships.map(s => s.id === res.data.id ? res.data : s));
      setEditing(false);
      setEditData(null);
    } catch { setError('Failed to save spaceship'); }
  };

  const cancelEdit = () => { setEditing(false); setEditData(null); };

  const ship = editing ? editData : ships.find(s => s.id === selectedId);

  const updateStat = (key, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    setEditData({ ...editData, stats: { ...editData.stats, [key]: val } });
  };

  const updateCrew = (key, value) => {
    setEditData({ ...editData, crew: { ...editData.crew, [key]: value } });
  };

  const updateField = (field, val) => setEditData({ ...editData, [field]: val });

  return (
    <div className="page">
      {error && <div className="error">{error}</div>}

      {/* Ship selector bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600 }}>Spacecraft:</label>
        {ships.length > 0 && (
          <select
            value={selectedId || ''}
            onChange={(e) => { setSelectedId(e.target.value); setEditing(false); }}
            className="select-input"
          >
            {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {!showCreate && <button onClick={() => setShowCreate(true)}>+ New</button>}
        {ship && !editing && (
          <>
            <button onClick={startEdit}>Edit</button>
            <button onClick={() => handleDelete(ship.id)} style={{ background: '#ef476f' }}>Delete</button>
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
          <h3>New Spacecraft</h3>
          <div className="form-group">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ship name" required />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: '#555' }}>Cancel</button>
          </div>
        </form>
      )}

      {!ship && !showCreate && (
        <div className="card"><p>No spacecraft yet. Create one to get started!</p></div>
      )}

      {ship && (
        <div className="character-sheet">
          {/* Ship name */}
          <div className="sheet-stat" style={{ marginBottom: '1.5rem' }}>
            <span className="stat-label">Ship Name</span>
            {editing
              ? <input type="text" value={ship.name} onChange={e => updateField('name', e.target.value)} className="stat-input stat-input-wide" />
              : <span className="stat-value" style={{ fontSize: '1.5rem' }}>{ship.name}</span>}
          </div>

          {/* Stats grid */}
          <div className="ship-stats-grid">
            {STAT_DEFS.map(stat => (
              <div key={stat.key} className="ship-stat-block">
                <div className="attribute-header">
                  <span className="attribute-name">{stat.label}</span>
                  {editing
                    ? <input type="number" min="0" value={ship.stats[stat.key]} onChange={e => updateStat(stat.key, e.target.value)} className="dice-input" />
                    : <span className="dice-badge">{ship.stats[stat.key]}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Computed stats */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Computed Stats</h3>
            <div className="computed-stats-row">
              <div className="computed-stat">
                <span className="stat-label">Defense</span>
                <span className="stat-value computed">{(ship.stats.hull || 0) * 5}</span>
                <span className="stat-note">Hull &times; 5</span>
              </div>
              <div className="computed-stat">
                <span className="stat-label">Resist Damage</span>
                <span className="stat-value computed">{(ship.stats.hull || 0) + (ship.stats.shield || 0)}</span>
                <span className="stat-note">Hull + Shield</span>
              </div>
              <div className="computed-stat">
                <span className="stat-label">Evasion Bonus</span>
                <span className="stat-value computed">Piloting + {ship.stats.maneuverability || 0}</span>
                <span className="stat-note">Piloting skill + Maneuverability</span>
              </div>
            </div>
          </div>

          {/* Weapons */}
          <ShipWeaponSection weapons={ship.weapons || []} editing={editing} onChange={w => updateField('weapons', w)} />

          {/* Crew assignments */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Crew Stations</h3>
            <div className="crew-grid">
              {CREW_ROLES.map(role => (
                <div key={role.key} className="crew-slot">
                  <div className="crew-role">{role.label}</div>
                  <div className="crew-duty">{role.duty}</div>
                  {editing
                    ? <input type="text" value={ship.crew?.[role.key] || ''} onChange={e => updateCrew(role.key, e.target.value)} placeholder="Unassigned" className="crew-input" />
                    : <div className="crew-name">{ship.crew?.[role.key] || 'Unassigned'}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="card">
              <h3>Navigation</h3>
              <ul style={{ color: '#aaa', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Navigation roll: Difficulty 15 (25 if rushed)</li>
                <li>Then Computers roll: Difficulty 15</li>
                <li><strong>Mishaps:</strong> 1D6 days off course, wrong planet, or interstellar collision (4D damage)</li>
              </ul>
            </div>

            <div className="card">
              <h3>Starship Combat</h3>
              <ul style={{ color: '#aaa', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li><strong>Ranges:</strong> Start at Long; close to Medium, Short</li>
                <li><strong>Movement:</strong> Opposed Engine checks</li>
                <li><strong>Attacking:</strong> Gunnery skill</li>
                <li><strong>Evading:</strong> Piloting + Maneuverability added to Defense</li>
                <li><strong>Resist Damage:</strong> Hull + Shield vs Damage</li>
              </ul>
            </div>

            <div className="card">
              <h3>Damage &amp; Repair</h3>
              <ul style={{ color: '#aaa', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Repair uses <strong>Mechanical</strong> skill</li>
                <li>Difficulty 10: Remove Stunned</li>
                <li>Difficulty 15: Remove Wounded / Incapacitated</li>
                <li>Difficulty 20: Remove Mortally Wounded</li>
                <li>Hacking uses <strong>Computers</strong> skill</li>
              </ul>
            </div>

            <div className="card">
              <h3>Crew Roles</h3>
              <ul style={{ color: '#aaa', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li><strong>Captain:</strong> Directs movement</li>
                <li><strong>Helm:</strong> Evasion rolls (Piloting + Maneuverability)</li>
                <li><strong>Tactical:</strong> Attack rolls (Gunnery)</li>
                <li><strong>Operations:</strong> Resist damage (Hull + Shield)</li>
                <li><strong>Engineer:</strong> Repairs (Mechanical)</li>
              </ul>
            </div>
          </div>

          {/* Notes */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Notes</h3>
            {editing
              ? <textarea value={ship.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={4} style={{ width: '100%', backgroundColor: '#0f3460', color: '#eee', border: '1px solid #444', borderRadius: '4px', padding: '0.5rem', resize: 'vertical' }} />
              : <p style={{ color: '#aaa', whiteSpace: 'pre-wrap' }}>{ship.notes || 'No notes.'}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ShipWeaponSection({ weapons, editing, onChange }) {
  const addWeapon = () => onChange([...weapons, { name: '', damage: '', count: 1, notes: '' }]);
  const removeWeapon = (i) => onChange(weapons.filter((_, idx) => idx !== i));
  const updateWeapon = (i, field, value) => onChange(weapons.map((w, idx) => idx === i ? { ...w, [field]: value } : w));

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3>Weapons</h3>
        {editing && <button onClick={addWeapon} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>+ Add</button>}
      </div>
      {weapons.length === 0 && <p style={{ color: '#888' }}>No weapons mounted.</p>}
      {weapons.length > 0 && (
        <table className="weapon-table">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Weapon</th>
              <th>Damage</th>
              <th>Notes</th>
              {editing && <th></th>}
            </tr>
          </thead>
          <tbody>
            {weapons.map((w, i) => (
              <tr key={i}>
                {editing ? (
                  <>
                    <td><input value={w.count} onChange={e => updateWeapon(i, 'count', e.target.value)} style={{ width: '40px' }} /></td>
                    <td><input value={w.name} onChange={e => updateWeapon(i, 'name', e.target.value)} /></td>
                    <td><input value={w.damage} onChange={e => updateWeapon(i, 'damage', e.target.value)} style={{ width: '80px' }} /></td>
                    <td><input value={w.notes} onChange={e => updateWeapon(i, 'notes', e.target.value)} /></td>
                    <td><button onClick={() => removeWeapon(i)} style={{ background: '#ef476f', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>X</button></td>
                  </>
                ) : (
                  <>
                    <td>{w.count}&times;</td>
                    <td>{w.name}</td>
                    <td style={{ color: '#e94560', fontWeight: 600 }}>{w.damage}</td>
                    <td style={{ color: '#888' }}>{w.notes}</td>
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
