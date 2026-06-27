import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import VehicleRollModal from '../components/VehicleRollModal';
import { VEHICLE_WOUND_LEVELS, getVehicleWoundPenalty } from '../data/vehicleWounds';

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

export default function VehiclePage({ userId, maxDice, isNPC }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [characters, setCharacters] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [vehicleRoll, setVehicleRoll] = useState(null);
  const [damageRoll, setDamageRoll] = useState(null);

  useEffect(() => { fetchVehicles(); fetchCharacters(); }, [userId]);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${API_URL}/vehicles`, { params: { userId } });
      setVehicles(res.data);
      if (res.data.length > 0 && !selectedId) setSelectedId(res.data[0].id);
    } catch { setError('Failed to load vehicles'); }
  };

  const fetchCharacters = async () => {
    try {
      const res = await axios.get(`${API_URL}/characters`, { params: { userId } });
      setCharacters(res.data);
      if (res.data.length > 0 && !selectedCharId) setSelectedCharId(res.data[0].id);
    } catch { /* ignore */ }
  };

  const selectedChar = characters.find(c => c.id === selectedCharId) || null;

  const handleHeroPointChange = async (newPoints) => {
    if (!selectedChar) return;
    try {
      await axios.patch(`${API_URL}/characters/${selectedChar.id}`, { heroPoints: newPoints });
      setCharacters(prev => prev.map(c => c.id === selectedChar.id ? { ...c, heroPoints: newPoints } : c));
    } catch { /* ignore */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/vehicles`, { userId, name: newName, isNPC: isNPC || false });
      setVehicles([...vehicles, res.data]);
      setSelectedId(res.data.id);
      setNewName('');
      setShowCreate(false);
    } catch { setError('Failed to create vehicle'); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/vehicles/${id}`);
      const updated = vehicles.filter(v => v.id !== id);
      setVehicles(updated);
      if (selectedId === id) setSelectedId(updated[0]?.id || null);
    } catch { setError('Failed to delete vehicle'); }
  };

  const startEdit = () => {
    const vehicle = vehicles.find(v => v.id === selectedId);
    setEditData(JSON.parse(JSON.stringify(vehicle)));
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      const res = await axios.patch(`${API_URL}/vehicles/${editData.id}`, editData);
      setVehicles(vehicles.map(v => v.id === res.data.id ? res.data : v));
      setEditing(false);
      setEditData(null);
    } catch { setError('Failed to save vehicle'); }
  };

  const cancelEdit = () => { setEditing(false); setEditData(null); };

  const vehicle = editing ? editData : vehicles.find(v => v.id === selectedId);

  const updateStat = (key, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    setEditData({ ...editData, stats: { ...editData.stats, [key]: val } });
  };

  const updateCrew = (key, value) => {
    setEditData({ ...editData, crew: { ...editData.crew, [key]: value } });
  };

  const updateField = (field, val) => setEditData({ ...editData, [field]: val });

  const getDefense = (stats) => (stats.hull || 0) * 5 + (stats.shield || 0);
  const getJupiterDriveDice = () => {
    if (!selectedChar) return 0;
    const jd = selectedChar.advancedSkills?.jupiterDrive || 0;
    if (jd === 0) return 0;
    const mech = selectedChar.attributes?.mechanical;
    return jd + (mech?.dice || 0) + (mech?.skills?.navigation || 0);
  };
  const getPilotingSkillOnly = () => {
    if (!selectedChar) return 0;
    return selectedChar.attributes?.mechanical?.skills?.piloting || 0;
  };
  const getGunneryDice = () => {
    if (!selectedChar) return 0;
    const perc = selectedChar.attributes?.perception;
    return (perc?.dice || 0) + (perc?.skills?.gunnery || 0);
  };

  const getRepairDice = () => {
    if (!selectedChar) return 0;
    const mech = selectedChar.attributes?.mechanical;
    return (mech?.dice || 0) + (mech?.skills?.useRepairMech || 0);
  };

  const handleWoundChange = async (value) => {
    if (!vehicle) return;
    try {
      await axios.patch(`${API_URL}/vehicles/${vehicle.id}`, { woundLevel: value });
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, woundLevel: value } : v));
      if (editing) setEditData(prev => prev ? { ...prev, woundLevel: value } : prev);
    } catch { /* ignore */ }
  };

  const vwp = vehicle ? getVehicleWoundPenalty(vehicle) : { penalty: 0, label: 'Undamaged', canOperate: true };
  const woundRollProps = vwp.penalty > 0 || !vwp.canOperate
    ? { woundPenalty: vwp.penalty, woundLabel: `${vwp.label} Damage`, canOperate: vwp.canOperate }
    : {};

  const openMovementRoll = () => {
    if (!vehicle || editing) return;
    const engines = vehicle.stats.engines || 0;
    setVehicleRoll({
      label: 'Movement',
      vehicleName: vehicle.name,
      breakdownParts: [{ label: 'Engines', dice: engines }],
      baseDice: engines,
      ...woundRollProps,
    });
  };

  const openNavigateRoll = () => {
    if (!vehicle || !selectedChar || editing) return;
    const jdDice = getJupiterDriveDice();
    const navicomp = vehicle.stats.navicomp || 0;
    setVehicleRoll({
      label: 'Navigate',
      vehicleName: vehicle.name,
      breakdownParts: [
        { label: 'Jupiter Drive', dice: jdDice },
        { label: 'Navicomp', dice: navicomp },
      ],
      baseDice: jdDice + navicomp,
      ...woundRollProps,
    });
  };

  const openAttackRoll = () => {
    if (!vehicle || !selectedChar || editing) return;
    const gunneryDice = getGunneryDice();
    setVehicleRoll({
      label: 'Attack',
      vehicleName: vehicle.name,
      breakdownParts: [{ label: 'Gunnery', dice: gunneryDice }],
      baseDice: gunneryDice,
      sizeBonus: { label: 'Smaller Size Attack Bonus', type: 'dice', rate: 1 },
      ...woundRollProps,
    });
  };

  const openEvadeRoll = () => {
    if (!vehicle || !selectedChar || editing) return;
    const piloting = getPilotingSkillOnly();
    const maneuv = vehicle.stats.maneuverability || 0;
    const defense = getDefense(vehicle.stats);
    setVehicleRoll({
      label: 'Evade',
      vehicleName: vehicle.name,
      breakdownParts: [
        { label: 'Piloting', dice: piloting },
        { label: 'Maneuverability', dice: maneuv },
      ],
      baseDice: piloting + maneuv,
      flatBonus: defense,
      flatBonusLabel: 'Defense',
      sizeBonus: { label: 'Smaller Size Dodge Bonus', type: 'flat', rate: 3 },
      ...woundRollProps,
    });
  };

  const openResistRoll = () => {
    if (!vehicle || editing) return;
    const hull = vehicle.stats.hull || 0;
    const shield = vehicle.stats.shield || 0;
    setVehicleRoll({
      label: 'Resist Damage',
      vehicleName: vehicle.name,
      breakdownParts: [
        { label: 'Hull', dice: hull },
        { label: 'Shield', dice: shield },
      ],
      baseDice: hull + shield,
      sizeBonus: { label: 'Larger Size Resist Bonus', type: 'dice', rate: 1 },
      ...woundRollProps,
    });
  };

  const openRepairRoll = () => {
    if (!vehicle || !selectedChar || editing) return;
    const repairDice = getRepairDice();
    setVehicleRoll({
      label: 'Repair',
      vehicleName: vehicle.name,
      breakdownParts: [{ label: 'Mech. Use/Repair', dice: repairDice }],
      baseDice: repairDice,
    });
  };

  const parseDamage = (damageStr) => {
    const match = damageStr.match(/(\d+)D/i);
    return match ? parseInt(match[1]) : null;
  };

  const openWeaponDamage = (weapon) => {
    if (editing) return;
    const diceCount = parseDamage(weapon.damage);
    if (!diceCount) return;
    setDamageRoll({ weaponName: weapon.name, damageFormula: weapon.damage, diceCount });
  };

  return (
    <div className="page">
      {error && <div className="error">{error}</div>}

      {/* Vehicle selector bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600 }}>{isNPC ? 'NPC Vehicle:' : 'Vehicle:'}</label>
        {vehicles.length > 0 && (
          <select
            value={selectedId || ''}
            onChange={(e) => { setSelectedId(e.target.value); setEditing(false); }}
            className="select-input"
          >
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}
        {!showCreate && <button onClick={() => setShowCreate(true)}>+ New</button>}
        {vehicle && !editing && (
          <>
            <button onClick={startEdit}>Edit</button>
            <button onClick={() => handleDelete(vehicle.id)} style={{ background: '#ef476f' }}>Delete</button>
          </>
        )}
        {editing && (
          <>
            <button onClick={saveEdit} style={{ background: '#06d6a0' }}>Save</button>
            <button onClick={cancelEdit} style={{ background: '#555' }}>Cancel</button>
          </>
        )}
      </div>

      {/* Character selector */}
      {characters.length > 0 && !editing && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, color: '#aaa' }}>Crew Member:</label>
          <select
            value={selectedCharId || ''}
            onChange={(e) => setSelectedCharId(e.target.value)}
            className="select-input"
          >
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedChar && (
            <span style={{ color: '#888', fontSize: '0.85rem' }}>
              Gunnery {getGunneryDice()}D | Jupiter Drive {getJupiterDriveDice()}D | Piloting {getPilotingSkillOnly()}D | Repair {getRepairDice()}D | HP: {selectedChar.heroPoints || 0}
            </span>
          )}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <h3>{isNPC ? 'New NPC Vehicle' : 'New Vehicle'}</h3>
          <div className="form-group">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Vehicle name" required />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: '#555' }}>Cancel</button>
          </div>
        </form>
      )}

      {!vehicle && !showCreate && (
        <div className="card"><p>{isNPC ? 'No NPC vehicles yet. Create one to get started!' : 'No vehicles yet. Create one to get started!'}</p></div>
      )}

      {vehicle && (
        <div className="character-sheet">
          {/* Vehicle name */}
          <div className="sheet-stat" style={{ marginBottom: '1.5rem' }}>
            <span className="stat-label">Vehicle Name</span>
            {editing
              ? <input type="text" value={vehicle.name} onChange={e => updateField('name', e.target.value)} className="stat-input stat-input-wide" />
              : <span className="stat-value" style={{ fontSize: '1.5rem' }}>{vehicle.name}</span>}
          </div>

          {/* Stats grid */}
          <div className="vehicle-stats-grid">
            {STAT_DEFS.map(stat => (
              <div key={stat.key} className="vehicle-stat-block">
                <div className="attribute-header">
                  <span className="attribute-name">{stat.label}</span>
                  {editing
                    ? <input type="number" min="0" value={vehicle.stats[stat.key]} onChange={e => updateStat(stat.key, e.target.value)} className="dice-input" />
                    : <span className="dice-badge">{vehicle.stats[stat.key]}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Vehicle Wound Tracker */}
          <div className="wound-tracker">
            <div className="wound-track-section">
              <span className="wound-track-label">Damage State</span>
              <div className="wound-track-buttons">
                {VEHICLE_WOUND_LEVELS.map(wl => (
                  <button
                    key={wl.key}
                    className={`wound-state-btn ${(vehicle.woundLevel || 'undamaged') === wl.key ? 'active' : ''}`}
                    style={(vehicle.woundLevel || 'undamaged') === wl.key ? { color: wl.color, borderColor: wl.color, backgroundColor: wl.color + '20' } : {}}
                    onClick={() => handleWoundChange(wl.key)}
                  >
                    {wl.label}
                  </button>
                ))}
              </div>
            </div>
            {vwp.penalty > 0 && (
              <div className="wound-penalty-summary">
                Penalty: &minus;{vwp.penalty}D to all vehicle action rolls ({vwp.label} Damage)
              </div>
            )}
            {!vwp.canOperate && (
              <div className="wound-cant-act">
                Vehicle cannot normally operate in this state
              </div>
            )}
          </div>

          {/* Vehicle Actions */}
          {!editing && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <h3>Vehicle Actions</h3>
              <div className="vehicle-actions-grid">
                <VehicleActionRow
                  label="Movement"
                  description="Opposed Engine checks"
                  dice={`${vehicle.stats.engines || 0}D6`}
                  detail={`Engines ${vehicle.stats.engines || 0}D`}
                  onClick={openMovementRoll}
                  disabled={!vehicle.stats.engines}
                />
                <VehicleActionRow
                  label="Navigate"
                  description="Jupiter Drive + Navicomp"
                  dice={`${getJupiterDriveDice() + (vehicle.stats.navicomp || 0)}D6`}
                  detail={`Jupiter Drive ${getJupiterDriveDice()}D + Navicomp ${vehicle.stats.navicomp || 0}D`}
                  onClick={openNavigateRoll}
                  disabled={!selectedChar || getJupiterDriveDice() === 0}
                  disabledNote={!selectedChar ? 'Select a crew member' : getJupiterDriveDice() === 0 ? 'Requires Jupiter Drive' : null}
                />
                <VehicleActionRow
                  label="Attack"
                  description="Gunnery skill"
                  dice={`${getGunneryDice()}D6`}
                  detail={`Gunnery ${getGunneryDice()}D`}
                  onClick={openAttackRoll}
                  disabled={!selectedChar}
                  disabledNote={!selectedChar ? 'Select a crew member' : null}
                />
                <VehicleActionRow
                  label="Evade"
                  description="Piloting + Maneuverability + Defense"
                  dice={`${getPilotingSkillOnly() + (vehicle.stats.maneuverability || 0)}D6 + ${getDefense(vehicle.stats)}`}
                  detail={`Piloting ${getPilotingSkillOnly()}D + Maneuv. ${vehicle.stats.maneuverability || 0}D + Defense ${getDefense(vehicle.stats)}`}
                  onClick={openEvadeRoll}
                  disabled={!selectedChar}
                  disabledNote={!selectedChar ? 'Select a crew member' : null}
                />
                <VehicleActionRow
                  label="Resist Damage"
                  description="Hull + Shield dice"
                  dice={`${(vehicle.stats.hull || 0) + (vehicle.stats.shield || 0)}D6`}
                  detail={`Hull ${vehicle.stats.hull || 0}D + Shield ${vehicle.stats.shield || 0}D`}
                  onClick={openResistRoll}
                  disabled={!(vehicle.stats.hull || vehicle.stats.shield)}
                />
                <VehicleActionRow
                  label="Repair"
                  description="Mechanical Use/Repair skill"
                  dice={`${getRepairDice()}D6`}
                  detail={`Mech. Use/Repair ${getRepairDice()}D`}
                  onClick={openRepairRoll}
                  disabled={!selectedChar}
                  disabledNote={!selectedChar ? 'Select a crew member' : null}
                />
              </div>
            </div>
          )}

          {/* Computed stats */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Computed Stats</h3>
            <div className="computed-stats-row">
              <div className="computed-stat">
                <span className="stat-label">Defense</span>
                <span className="stat-value computed">{getDefense(vehicle.stats)}</span>
                <span className="stat-note">Hull &times; 5 + Shield</span>
              </div>
              <div className="computed-stat">
                <span className="stat-label">Resist Damage</span>
                <span className="stat-value computed">{(vehicle.stats.hull || 0) + (vehicle.stats.shield || 0)}D</span>
                <span className="stat-note">Hull + Shield dice</span>
              </div>
              <div className="computed-stat">
                <span className="stat-label">Evasion Bonus</span>
                <span className="stat-value computed">Piloting + {vehicle.stats.maneuverability || 0} + Def</span>
                <span className="stat-note">Piloting skill + Maneuverability + Defense</span>
              </div>
            </div>
          </div>

          {/* Weapons */}
          <VehicleWeaponSection weapons={vehicle.weapons || []} editing={editing} onChange={w => updateField('weapons', w)} onDamageRoll={openWeaponDamage} />

          {/* Crew assignments */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Crew Stations</h3>
            <div className="crew-grid">
              {CREW_ROLES.map(role => (
                <div key={role.key} className="crew-slot">
                  <div className="crew-role">{role.label}</div>
                  <div className="crew-duty">{role.duty}</div>
                  {editing
                    ? <input type="text" value={vehicle.crew?.[role.key] || ''} onChange={e => updateCrew(role.key, e.target.value)} placeholder="Unassigned" className="crew-input" />
                    : <div className="crew-name">{vehicle.crew?.[role.key] || 'Unassigned'}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="card">
              <h3>Navigation</h3>
              <ul style={{ color: '#aaa', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Jupiter Drive roll: Difficulty 15 (25 if rushed)</li>
                <li>Then Computers roll: Difficulty 15</li>
                <li><strong>Mishaps:</strong> 1D6 days off course, wrong planet, or interstellar collision (4D damage)</li>
              </ul>
            </div>

            <div className="card">
              <h3>Vehicle Combat</h3>
              <ul style={{ color: '#aaa', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li><strong>Ranges:</strong> Start at Long; close to Medium, Short</li>
                <li><strong>Movement:</strong> Opposed Engine checks</li>
                <li><strong>Attacking:</strong> Gunnery skill</li>
                <li><strong>Evading:</strong> Piloting + Maneuverability + Defense</li>
                <li><strong>Resist Damage:</strong> Hull + Shield dice vs Damage</li>
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
              ? <textarea value={vehicle.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={4} style={{ width: '100%', backgroundColor: '#0f3460', color: '#eee', border: '1px solid #444', borderRadius: '4px', padding: '0.5rem', resize: 'vertical' }} />
              : <p style={{ color: '#aaa', whiteSpace: 'pre-wrap' }}>{vehicle.notes || 'No notes.'}</p>}
          </div>
        </div>
      )}

      {vehicleRoll && (
        <VehicleRollModal
          rollInfo={vehicleRoll}
          character={selectedChar}
          onClose={() => setVehicleRoll(null)}
          onHeroPointChange={handleHeroPointChange}
          maxDice={maxDice}
        />
      )}

      {damageRoll && (
        <VehicleDamageModal
          damageInfo={damageRoll}
          vehicleName={vehicle?.name}
          character={selectedChar}
          onClose={() => setDamageRoll(null)}
          onHeroPointChange={handleHeroPointChange}
          maxDice={maxDice}
        />
      )}
    </div>
  );
}

function VehicleActionRow({ label, description, dice, detail, onClick, disabled, disabledNote }) {
  return (
    <div className="vehicle-action-row">
      <div className="vehicle-action-info">
        <span className="vehicle-action-label">{label}</span>
        <span className="vehicle-action-desc">{description}</span>
      </div>
      <div className="vehicle-action-dice">
        <span className="vehicle-action-detail">{detail}</span>
        <span className="vehicle-action-total">{dice}</span>
      </div>
      {disabledNote ? (
        <span style={{ color: '#888', fontSize: '0.8rem', fontStyle: 'italic' }}>{disabledNote}</span>
      ) : (
        <button className="roll-btn" onClick={onClick} disabled={disabled}>Roll</button>
      )}
    </div>
  );
}

function VehicleWeaponSection({ weapons, editing, onChange, onDamageRoll }) {
  const addWeapon = () => onChange([...weapons, { name: '', damage: '', count: 1, notes: '' }]);
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
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#e94560', fontWeight: 600 }}>{w.damage}</span>
                      {w.damage && parseDamage(w.damage) && onDamageRoll && (
                        <button className="roll-btn roll-btn-sm" title={`Roll damage for ${w.name}`} onClick={() => onDamageRoll(w)}>Roll</button>
                      )}
                    </td>
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

function VehicleDamageModal({ damageInfo, vehicleName, character, onClose, onHeroPointChange, maxDice }) {
  const [phase, setPhase] = useState('setup');
  const [extraDice, setExtraDice] = useState(0);
  const [sizeAdv, setSizeAdv] = useState(0);
  const [doubled, setDoubled] = useState(false);
  const [doubleSource, setDoubleSource] = useState(null);
  const [diceResults, setDiceResults] = useState([]);
  const [rollTotal, setRollTotal] = useState(null);

  const baseDice = damageInfo.diceCount || 2;
  const rawDice = doubled ? (baseDice + extraDice + sizeAdv) * 2 : baseDice + extraDice + sizeAdv;
  const effectiveDice = maxDice ? Math.min(rawDice, maxDice) : rawDice;
  const isCapped = maxDice && rawDice > maxDice;
  const doubledPreview = maxDice ? Math.min((baseDice + extraDice + sizeAdv) * 2, maxDice) : (baseDice + extraDice + sizeAdv) * 2;
  const heroPoints = character?.heroPoints || 0;

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
    if (doubleSource === 'heroPoint') onHeroPointChange(heroPoints + 1);
    setDoubled(false);
    setDoubleSource(null);
  };

  const executeRoll = async (flag = null) => {
    const count = effectiveDice;
    if (count < 1) return;

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
        characterId: character?.id,
        characterName: character?.name || vehicleName,
        weaponName: `${damageInfo.weaponName} (${vehicleName})`,
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

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ borderColor: '#e94560' }}>
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #e94560', marginBottom: '1rem', color: '#e94560', fontWeight: 700 }}>
          DAMAGE ROLL — {damageInfo.weaponName} ({vehicleName})
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
                <button type="button" onClick={() => setExtraDice(extraDice - 1)} className="dice-adjust-btn">-</button>
                <span className="extra-dice-value">{extraDice}</span>
                <button type="button" onClick={() => setExtraDice(extraDice + 1)} className="dice-adjust-btn">+</button>
              </div>
            </div>

            <div className="extra-dice-row">
              <label>Larger Size Damage Bonus:</label>
              <div className="extra-dice-controls">
                <button type="button" onClick={() => setSizeAdv(Math.max(0, sizeAdv - 1))} className="dice-adjust-btn">-</button>
                <span className="extra-dice-value">{sizeAdv}</span>
                <button type="button" onClick={() => setSizeAdv(sizeAdv + 1)} className="dice-adjust-btn">+</button>
              </div>
              {sizeAdv > 0 && (
                <span style={{ color: '#06d6a0', fontSize: '0.8rem', marginLeft: '0.5rem' }}>+{sizeAdv}D</span>
              )}
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

            {character && (
              <div className="hero-points-display">
                Hero Points: <strong>{character.heroPoints}</strong>
              </div>
            )}

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
              <button onClick={handleReroll} disabled={!character || heroPoints < 1} className="reroll-btn">
                Re-Roll (costs 1 Hero Point)
              </button>
              <button onClick={() => executeRoll('DOUBLE_DOWN')} className="doubledown-btn">
                Double Down (free, complication on 2nd fail)
              </button>
              <button onClick={onClose} className="close-result-btn">
                Accept Result
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
