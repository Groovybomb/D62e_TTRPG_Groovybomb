import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { ATTRIBUTE_DEFINITIONS, ADVANCED_SKILL_DEFINITIONS, SPECIAL_SKILLS, getDicePool, getAdvancedDicePool, parseSkillValue } from '../data/attributes';
import { WOUND_LEVELS, STUN_STATES, getWoundPenalty } from '../data/wounds';
import { TALENTS, PERKS, FLAWS, CYBERNETICS, ITEMS, WEAPONS, getRollHints } from '../data/characterOptions';
import RollModal from '../components/RollModal';

export default function CharacterPage({ userId, maxDice, refreshKey, selectedCharacterId, onSelectCharacter, isNPC }) {
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState(selectedCharacterId || null);
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
      if (res.data.length > 0 && !selectedId) {
        const initial = res.data[0].id;
        setSelectedId(initial);
        onSelectCharacter?.(initial);
      }
    } catch { setError('Failed to load characters'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/characters`, { userId, name: newName, isNPC: isNPC || false });
      setCharacters([...characters, res.data]);
      setSelectedId(res.data.id);
      onSelectCharacter?.(res.data.id);
      setNewName('');
      setShowCreate(false);
    } catch { setError('Failed to create character'); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/characters/${id}`);
      const updated = characters.filter(c => c.id !== id);
      setCharacters(updated);
      if (selectedId === id) {
        const newId = updated[0]?.id || null;
        setSelectedId(newId);
        onSelectCharacter?.(newId);
      }
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
    const val = Math.max(1, parseInt(value) || 0);
    setEditData({ ...editData, attributes: { ...editData.attributes, [attrKey]: { ...editData.attributes[attrKey], dice: val } } });
  };

  const updateSkillDice = (attrKey, skillKey, field, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    const currentSkill = editData.attributes[attrKey].skills[skillKey];
    const parsed = parseSkillValue(currentSkill);
    const updated = { ...parsed, [field]: val };
    setEditData({
      ...editData,
      attributes: {
        ...editData.attributes,
        [attrKey]: {
          ...editData.attributes[attrKey],
          skills: { ...editData.attributes[attrKey].skills, [skillKey]: updated },
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
    try {
      await axios.patch(`${API_URL}/characters/${char.id}`, { heroPoints: newPoints });
      setCharacters(characters.map(c => c.id === char.id ? { ...c, heroPoints: newPoints } : c));
    } catch { /* ignore */ }
  };

  const handleDuplicate = async () => {
    if (!char) return;
    try {
      const clone = JSON.parse(JSON.stringify(char));
      delete clone.id;
      delete clone.createdAt;
      delete clone.updatedAt;
      const res = await axios.post(`${API_URL}/characters`, { userId, name: `${char.name} (copy)`, isNPC: isNPC || false });
      const created = res.data;
      await axios.patch(`${API_URL}/characters/${created.id}`, {
        heroPoints: clone.heroPoints,
        armor: clone.armor,
        attributes: clone.attributes,
        advancedSkills: clone.advancedSkills,
        weapons: clone.weapons,
        talents: clone.talents,
        flaws: clone.flaws,
        perks: clone.perks,
        cybernetics: clone.cybernetics,
        items: clone.items,
        notes: clone.notes,
      });
      await fetchCharacters();
      setSelectedId(created.id);
      onSelectCharacter?.(created.id);
    } catch { setError('Failed to duplicate'); }
  };

  const handleInitiativeRoll = () => {
    if (!char) return;
    const percAttr = char.attributes?.perception;
    const percDice = percAttr?.dice || 2;
    setRollModal({
      label: 'Initiative (Perception)',
      attrKey: 'perception',
      attrLabel: 'Perception',
      attrDice: percDice,
      skillKey: null,
      skillLabel: null,
      skillDice: 0,
      baseDice: percDice,
      isInitiative: true,
    });
  };

  const handleInitiativeComplete = async (total, diceValues) => {
    if (!char) return;
    try {
      await axios.post(`${API_URL}/initiative`, {
        characterId: char.id,
        characterName: char.name,
        total,
        diceResults: diceValues,
        isNPC: char.isNPC || false,
      });
    } catch { /* ignore */ }
  };

  const handleWoundChange = async (field, value) => {
    if (!char) return;
    try {
      await axios.patch(`${API_URL}/characters/${char.id}`, { [field]: value });
      setCharacters(characters.map(c => c.id === char.id ? { ...c, [field]: value } : c));
      if (editing) setEditData(prev => prev ? { ...prev, [field]: value } : prev);
    } catch { /* ignore */ }
  };

  return (
    <div className="page">
      {error && <div className="error">{error}</div>}

      {/* Character selector bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600 }}>{isNPC ? 'NPC:' : 'Character:'}</label>
        {characters.length > 0 && (
          <select
            value={selectedId || ''}
            onChange={(e) => { setSelectedId(e.target.value); onSelectCharacter?.(e.target.value); setEditing(false); }}
            className="select-input"
          >
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {!showCreate && <button onClick={() => setShowCreate(true)}>+ New</button>}
        {char && !editing && (
          <>
            <button onClick={startEdit}>Edit</button>
            <button onClick={handleDuplicate} style={{ background: '#e3b341', color: '#0d1117' }}>Duplicate</button>
            <button onClick={handleInitiativeRoll} style={{ background: '#58a6ff', color: '#0d1117' }}>Initiative</button>
            <button onClick={() => handleDelete(char.id)} style={{ background: '#f85149' }}>Delete</button>
          </>
        )}
        {editing && (
          <>
            <button onClick={saveEdit} style={{ background: '#3fb950' }}>Save</button>
            <button onClick={cancelEdit} style={{ background: '#484f58' }}>Cancel</button>
          </>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <h3>{isNPC ? 'Create NPC' : 'Create Character'}</h3>
          <div className="form-group">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={isNPC ? 'NPC name' : 'Character name'} required />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: '#484f58' }}>Cancel</button>
          </div>
        </form>
      )}

      {!char && !showCreate && (
        <div className="card"><p>{isNPC ? 'No NPCs yet. Create one to get started!' : 'No characters yet. Create one to get started!'}</p></div>
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
          onWoundChange={handleWoundChange}
        />
      )}

      {rollModal && char && (
        <RollModal
          rollInfo={rollModal}
          character={char}
          onClose={() => setRollModal(null)}
          onHeroPointChange={handleHeroPointChange}
          maxDice={maxDice}
          isNPC={isNPC}
          onRollComplete={rollModal.isInitiative ? handleInitiativeComplete : undefined}
        />
      )}

      {damageRoll && char && (
        <DamageRollModal
          damageInfo={damageRoll}
          character={char}
          onClose={() => setDamageRoll(null)}
          onHeroPointChange={handleHeroPointChange}
          maxDice={maxDice}
          isNPC={isNPC}
        />
      )}
    </div>
  );
}

function CharacterSheet({ char, editing, onAttrChange, onSkillChange, onAdvancedSkillChange, onFieldChange, onRoll, onDamageRoll, onWoundChange }) {
  const isProne = !!char.isProne;
  const baseDodge = (char.attributes.perception?.dice || 0) * 5 + (char.dodgePips || 0);
  const baseParry = (char.attributes.agility?.dice || 0) * 5 + (char.parryPips || 0);
  const dodge = isProne ? baseDodge + 10 : baseDodge;
  const parry = isProne ? Math.min(baseParry, 10) : baseParry;

  const acrobaticsData = parseSkillValue(char.attributes.agility?.skills?.acrobatics);
  const meleeData = parseSkillValue(char.attributes.agility?.skills?.melee);
  const acrobatics = acrobaticsData.dice + acrobaticsData.bonusDice;
  const melee = meleeData.dice + meleeData.bonusDice;
  const fullDefDodge = baseDodge + (acrobatics * 5);
  const fullDefParry = baseParry + (melee * 5);

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
                : <span className="stat-value">{char.armor}D</span>}
            </div>
          </div>
          <div className="sheet-stat-row">
            <div className="sheet-stat">
              <span className="stat-label">Dodge{isProne ? ' (Prone)' : ''}</span>
              <span className="stat-value computed" style={isProne ? { color: '#f0883e' } : {}}>{dodge}</span>
              {editing
                ? <span className="stat-note" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Pips: <input type="number" value={char.dodgePips || 0} onChange={e => onFieldChange('dodgePips', parseInt(e.target.value) || 0)} className="stat-input" style={{ width: '3rem' }} />
                  </span>
                : <span className="stat-note">{isProne ? `Base ${baseDodge} + 10 ranged` : `Perception × 5${char.dodgePips ? ` + ${char.dodgePips}` : ''}`}</span>}
            </div>
            <div className="sheet-stat">
              <span className="stat-label">Parry{isProne ? ' (Prone)' : ''}</span>
              <span className="stat-value computed" style={isProne ? { color: '#f0883e' } : {}}>{parry}</span>
              {editing
                ? <span className="stat-note" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Pips: <input type="number" value={char.parryPips || 0} onChange={e => onFieldChange('parryPips', parseInt(e.target.value) || 0)} className="stat-input" style={{ width: '3rem' }} />
                  </span>
                : <span className="stat-note">{isProne ? `Max 10 vs melee` : `Agility × 5${char.parryPips ? ` + ${char.parryPips}` : ''}`}</span>}
            </div>
          </div>
          {(fullDefDodge > baseDodge || fullDefParry > baseParry) && !isProne && (
            <div style={{ fontSize: '0.75rem', color: '#7d8590', marginTop: '0.25rem' }}>
              Full Defense: Dodge {fullDefDodge} (+Acrobatics {acrobatics}D) &bull; Parry {fullDefParry} (+Melee {melee}D)
            </div>
          )}
        </div>
      </div>

      {/* Wound Tracker */}
      <div className="wound-tracker">
        <div className="wound-track-section">
          <span className="wound-track-label">Wound Level</span>
          <div className="wound-track-buttons">
            {WOUND_LEVELS.map(wl => (
              <button
                key={wl.key}
                className={`wound-state-btn ${(char.woundLevel || 'healthy') === wl.key ? 'active' : ''}`}
                style={(char.woundLevel || 'healthy') === wl.key ? { color: wl.color, borderColor: wl.color, backgroundColor: wl.color + '20' } : {}}
                onClick={() => onWoundChange('woundLevel', wl.key)}
              >
                {wl.label}
              </button>
            ))}
          </div>
        </div>
        <div className="wound-track-section">
          <span className="wound-track-label">Condition</span>
          <div className="wound-track-buttons">
            {STUN_STATES.map(ss => (
              <button
                key={ss.key}
                className={`wound-state-btn ${(char.stunState || 'none') === ss.key ? 'active' : ''}`}
                style={(char.stunState || 'none') === ss.key ? { color: ss.color, borderColor: ss.color, backgroundColor: ss.color + '20' } : {}}
                onClick={() => onWoundChange('stunState', ss.key)}
              >
                {ss.label}
              </button>
            ))}
            <button
              className={`wound-state-btn ${isProne ? 'active' : ''}`}
              style={isProne
                ? { color: '#f0883e', borderColor: '#f0883e', backgroundColor: '#f0883e20', marginLeft: '0.5rem' }
                : { marginLeft: '0.5rem' }}
              onClick={() => onWoundChange('isProne', !isProne)}
            >
              Prone
            </button>
          </div>
        </div>
        {(() => {
          const { penalty, reasons, canAct } = getWoundPenalty(char);
          return (
            <>
              {penalty > 0 && (
                <div className="wound-penalty-summary">
                  Penalty: &minus;{penalty}D to all skill &amp; attribute rolls ({reasons.join(', ')})
                </div>
              )}
              {!canAct && (
                <div className="wound-cant-act">
                  Character cannot normally act in this state
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Attributes and Skills grid */}
      {editing && (
        <div style={{ marginBottom: '0.5rem', fontSize: '0.78rem', color: '#7d8590', textAlign: 'center' }}>
          Skill fields: <span style={{ color: '#e6edf3' }}>Skill Dice</span> &bull; <span style={{ color: '#3fb950' }}>Bonus Dice</span> &bull; <span style={{ color: '#e3b341' }}>Bonus Pips</span>
        </div>
      )}
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
                    ? <input type="number" min="1" value={attr.dice} onChange={e => onAttrChange(attrKey, e.target.value)} className="dice-input" />
                    : <span className="dice-badge">{attr.dice}D</span>}
                  {!editing && (
                    <button
                      className="roll-btn"
                      title={`Roll ${attrDef.label} (${attr.dice}D6)`}
                      onClick={() => onRoll({
                        label: attrDef.label,
                        attrKey,
                        attrLabel: attrDef.label,
                        attrDice: attr.dice,
                        skillKey: null,
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
                  const special = SPECIAL_SKILLS[skillKey];
                  let skillDice, bonusDice, bonusPips;
                  if (special) {
                    skillDice = char[special.sourceField] || 0;
                    bonusDice = 0;
                    bonusPips = 0;
                  } else {
                    const parsed = parseSkillValue(attr.skills[skillKey]);
                    skillDice = parsed.dice;
                    bonusDice = parsed.bonusDice;
                    bonusPips = parsed.bonusPips;
                  }
                  const totalDice = attr.dice + skillDice + bonusDice;
                  const displayLabel = special ? special.sourceLabel : skillLabel;
                  return (
                    <div key={skillKey} className="skill-row">
                      <span className="skill-name">
                        {skillLabel}
                        {special && <span style={{ color: '#7d8590', fontSize: '0.75rem', marginLeft: '0.35rem' }}>({special.sourceLabel})</span>}
                      </span>
                      {special ? (
                        <span className="skill-dice" title={`From ${special.sourceLabel}`}>{skillDice > 0 ? skillDice : '-'}</span>
                      ) : editing ? (
                        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                          <input type="number" min="0" value={skillDice} onChange={e => onSkillChange(attrKey, skillKey, 'dice', e.target.value)} className="dice-input" title="Skill Dice" />
                          <input type="number" min="0" value={bonusDice} onChange={e => onSkillChange(attrKey, skillKey, 'bonusDice', e.target.value)} className="dice-input" title="Bonus Dice" style={{ borderColor: '#3fb950' }} />
                          <input type="number" min="0" value={bonusPips} onChange={e => onSkillChange(attrKey, skillKey, 'bonusPips', e.target.value)} className="dice-input" title="Bonus Pips" style={{ borderColor: '#e3b341' }} />
                        </div>
                      ) : (
                        <span className="skill-dice">
                          {skillDice > 0 ? skillDice : '-'}
                          {bonusDice > 0 && <span style={{ color: '#3fb950', fontSize: '0.8rem' }}> +{bonusDice}D</span>}
                          {bonusPips > 0 && <span style={{ color: '#e3b341', fontSize: '0.8rem' }}> +{bonusPips}</span>}
                        </span>
                      )}
                      <span className="total-dice" title={`${attrDef.label} ${attr.dice}D + ${displayLabel} ${skillDice}D${bonusDice > 0 ? ` + Bonus ${bonusDice}D` : ''}${bonusPips > 0 ? ` + ${bonusPips} pips` : ''}`}>
                        {totalDice}D{bonusPips > 0 ? `+${bonusPips}` : ''}
                      </span>
                      {!editing && (
                        <button
                          className="roll-btn roll-btn-sm"
                          onClick={() => onRoll({
                            label: `${skillLabel} (${attrDef.label})`,
                            attrKey,
                            attrLabel: attrDef.label,
                            attrDice: attr.dice,
                            skillKey,
                            skillLabel: displayLabel,
                            skillDice: skillDice + bonusDice,
                            baseDice: totalDice,
                            bonusPips,
                            ...(special?.skipWoundPenalty && { skipWoundPenalty: true }),
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
        <p style={{ color: '#7d8590', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          Cannot be used untrained. Roll = advanced skill + base skill + attribute.
        </p>
        <div className="skill-list">
          {Object.entries(ADVANCED_SKILL_DEFINITIONS).map(([advKey, advDef]) => {
            const advDice = char.advancedSkills?.[advKey] || 0;
            const attr = char.attributes[advDef.baseAttribute];
            const attrDice = attr?.dice || 0;
            const baseSkillParsed = parseSkillValue(attr?.skills?.[advDef.baseSkill]);
            const baseSkillDice = baseSkillParsed.dice + baseSkillParsed.bonusDice;
            const baseSkillPips = baseSkillParsed.bonusPips;
            const totalDice = advDice > 0 ? advDice + baseSkillDice + attrDice : 0;
            const baseAttrDef = ATTRIBUTE_DEFINITIONS[advDef.baseAttribute];
            const baseSkillLabel = baseAttrDef.skills[advDef.baseSkill];
            return (
              <div key={advKey} className="skill-row">
                <span className="skill-name">
                  {advDef.label}
                  <span style={{ color: '#7d8590', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
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
                      bonusPips: baseSkillPips,
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
      <WeaponSection weapons={char.weapons || []} editing={editing} onChange={w => onFieldChange('weapons', w)} character={char} onDamageRoll={onDamageRoll} referenceData={WEAPONS} />

      {/* Talents, Flaws, Perks, Cybernetics, Items in a grid */}
      <div className="extras-grid">
        <ListSection title="Talents" items={char.talents || []} editing={editing} onChange={v => onFieldChange('talents', v)} fields={['name', 'rank', 'description']} referenceData={TALENTS} />
        <ListSection title="Flaws" items={char.flaws || []} editing={editing} onChange={v => onFieldChange('flaws', v)} fields={['name', 'rank', 'description']} referenceData={FLAWS} />
        <ListSection title="Perks" items={char.perks || []} editing={editing} onChange={v => onFieldChange('perks', v)} fields={['name', 'rank', 'description']} referenceData={PERKS} />
        <ListSection title="Cybernetics" items={char.cybernetics || []} editing={editing} onChange={v => onFieldChange('cybernetics', v)} fields={['name', 'rank', 'description']} referenceData={CYBERNETICS} />
        <ListSection title="Items" items={char.items || []} editing={editing} onChange={v => onFieldChange('items', v)} fields={['name', 'description']} referenceData={ITEMS} referenceGrouped={true} onArmorUpdate={(val) => onFieldChange('armor', val)} currentArmor={char.armor} />
      </div>

      {/* Notes */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Notes</h3>
        {editing
          ? <textarea value={char.notes || ''} onChange={e => onFieldChange('notes', e.target.value)} rows={4} style={{ width: '100%', backgroundColor: '#1c2128', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '4px', padding: '0.5rem', resize: 'vertical' }} />
          : <p style={{ color: '#8b949e', whiteSpace: 'pre-wrap' }}>{char.notes || 'No notes.'}</p>}
      </div>

      {/* Dice Modifier Reminders */}
      {!editing && (
        <div className="card" style={{ marginTop: '1rem', borderColor: '#484f58' }}>
          <h3 style={{ color: '#7d8590' }}>Dice Modifier Reminders</h3>
          <ul style={{ color: '#8b949e', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: '1.8', margin: 0 }}>
            <li><strong style={{ color: '#f85149' }}>Hero Points</strong> &mdash; No more than one Hero Point can be spent on a roll.</li>
            <li><strong style={{ color: '#818cf8' }}>Running</strong> &mdash; &minus;1D to all actions this round (use Extra Dice: &minus;1)</li>
            <li><strong style={{ color: '#818cf8' }}>Multi-Action</strong> &mdash; &minus;1D per extra action this round (use Extra Dice: &minus;1 per extra action)</li>
            <li><strong style={{ color: '#818cf8' }}>Tiebreaker</strong> &mdash; PC vs PC ties are broken by comparing wild die values</li>
            <li><strong style={{ color: '#3fb950' }}>Preparing / Aiming</strong> &mdash; spend a full round to gain +1D on the next action (use Extra Dice: +1)</li>
            <li><strong style={{ color: '#3fb950' }}>Full Defense</strong> &mdash; sacrifice all actions to add Melee to Parry and Acrobatics to Dodge for the round</li>
          </ul>
          <h4 style={{ color: '#7d8590', marginTop: '0.75rem', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Scale Bonuses (Person vs. Vehicle)</h4>
          <ul style={{ color: '#8b949e', fontSize: '0.85rem', paddingLeft: '1.2rem', lineHeight: '1.8', margin: 0 }}>
            <li><strong style={{ color: '#3fb950' }}>Smaller Size Attack Bonus</strong> &mdash; +1D per size category (use Extra Dice)</li>
            <li><strong style={{ color: '#3fb950' }}>Smaller Size Dodge Bonus</strong> &mdash; +3 per size category (add to Dodge, not dice)</li>
            <li><strong style={{ color: '#f85149' }}>Larger Size Damage Bonus</strong> &mdash; +1D per size category to damage (use Extra Dice on damage roll)</li>
            <li><strong style={{ color: '#f85149' }}>Larger Size Resist Bonus</strong> &mdash; +1D per size category to resist damage (use Extra Dice)</li>
          </ul>
          <div style={{ color: '#6e7681', fontSize: '0.78rem', marginTop: '0.35rem', paddingLeft: '1.2rem' }}>
            Scale tiers: Person (+0) &rarr; Speeder (+1) &rarr; Tank (+2) &rarr; Light Freighter (+3) &rarr; Heavy Freighter (+4) &rarr; Capital Ship (+5)
          </div>
        </div>
      )}
    </div>
  );
}

function WeaponSection({ weapons, editing, onChange, character, onDamageRoll, referenceData }) {
  const [showPicker, setShowPicker] = useState(false);

  const addWeapon = () => onChange([...weapons, { name: '', damage: '', ammo: '', shortRange: '', mediumRange: '', longRange: '' }]);
  const addFromReference = (ref) => {
    onChange([...weapons, { name: ref.name, damage: ref.damage || '', ammo: ref.ammo || '', shortRange: ref.shortRange || '', mediumRange: ref.mediumRange || '', longRange: ref.longRange || '' }]);
    setShowPicker(false);
  };
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
        {editing && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {referenceData && <button onClick={() => setShowPicker(!showPicker)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', backgroundColor: showPicker ? '#818cf8' : '#3fb950', color: '#0d1117', fontWeight: 600 }}>{showPicker ? 'Cancel' : '+ Book'}</button>}
            <button onClick={addWeapon} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>+ Custom</button>
          </div>
        )}
      </div>
      {editing && showPicker && referenceData && (
        <div style={{ marginBottom: '0.75rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #30363d', borderRadius: '4px', background: '#161b22' }}>
          {Object.entries(referenceData).map(([category, refs]) => (
            <div key={category}>
              <div style={{ padding: '0.3rem 0.6rem', background: '#0d1117', color: '#e3b341', fontSize: '0.8rem', fontWeight: 700, position: 'sticky', top: 0 }}>{category}</div>
              {refs.map((ref, i) => (
                <div key={i} onClick={() => addFromReference(ref)} style={{ padding: '0.35rem 0.6rem 0.35rem 1rem', cursor: 'pointer', borderBottom: '1px solid #21262d', fontSize: '0.85rem' }}
                  onMouseOver={e => e.currentTarget.style.background = '#1c2128'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <strong style={{ color: '#3fb950' }}>{ref.name}</strong>
                  <span style={{ color: '#8b949e', marginLeft: '0.5rem' }}>{ref.damage}{ref.ammo ? `, Ammo ${ref.ammo}` : ''}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {weapons.length === 0 && <p style={{ color: '#7d8590' }}>No weapons.</p>}
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
                    <td><button onClick={() => removeWeapon(i)} style={{ background: '#f85149', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>X</button></td>
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

function ListSection({ title, items, editing, onChange, fields, referenceData, referenceGrouped, onArmorUpdate, currentArmor }) {
  const [showPicker, setShowPicker] = useState(false);
  const [expandedEffect, setExpandedEffect] = useState({});
  const [armorPrompt, setArmorPrompt] = useState(null);

  const isGrouped = referenceGrouped && referenceData && !Array.isArray(referenceData);
  const flatRef = isGrouped ? Object.values(referenceData).flat() : referenceData;

  const addItem = () => {
    const blank = {};
    fields.forEach(f => blank[f] = '');
    onChange([...items, blank]);
  };
  const addFromReference = (ref) => {
    const entry = { name: ref.name, description: ref.description || ref.effect || '' };
    if (fields.includes('rank') && ref.rank) entry.rank = '1';
    else if (fields.includes('rank')) entry.rank = '';
    onChange([...items, entry]);
    setShowPicker(false);
    if (ref.armorValue != null && onArmorUpdate && ref.armorValue !== currentArmor) {
      setArmorPrompt({ name: ref.name, value: ref.armorValue });
    }
  };
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const getRefEffect = (name) => {
    if (!flatRef) return null;
    const ref = flatRef.find(r => r.name.toLowerCase() === name?.toLowerCase());
    return ref?.effect || null;
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3>{title}</h3>
        {editing && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {referenceData && <button onClick={() => setShowPicker(!showPicker)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', backgroundColor: showPicker ? '#818cf8' : '#3fb950', color: '#0d1117', fontWeight: 600 }}>{showPicker ? 'Cancel' : '+ Book'}</button>}
            <button onClick={addItem} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>+ Custom</button>
          </div>
        )}
      </div>
      {editing && showPicker && referenceData && (
        <div style={{ marginBottom: '0.75rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #30363d', borderRadius: '4px', background: '#161b22' }}>
          {isGrouped ? (
            Object.entries(referenceData).map(([category, refs]) => (
              <div key={category}>
                <div style={{ padding: '0.3rem 0.6rem', background: '#0d1117', color: '#e3b341', fontSize: '0.8rem', fontWeight: 700, position: 'sticky', top: 0 }}>{category}</div>
                {refs.map((ref, i) => (
                  <div key={i} onClick={() => addFromReference(ref)} style={{ padding: '0.35rem 0.6rem 0.35rem 1rem', cursor: 'pointer', borderBottom: '1px solid #21262d', fontSize: '0.85rem' }}
                    onMouseOver={e => e.currentTarget.style.background = '#1c2128'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <strong style={{ color: '#3fb950' }}>{ref.name}</strong>
                    <span style={{ color: '#8b949e', marginLeft: '0.5rem' }}>{ref.description}</span>
                  </div>
                ))}
              </div>
            ))
          ) : (
            flatRef.map((ref, i) => (
              <div key={i} onClick={() => addFromReference(ref)} style={{ padding: '0.4rem 0.6rem', cursor: 'pointer', borderBottom: '1px solid #21262d', fontSize: '0.85rem' }}
                onMouseOver={e => e.currentTarget.style.background = '#1c2128'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <strong style={{ color: '#3fb950' }}>{ref.name}</strong>
                {ref.cost != null && <span style={{ color: '#e3b341', marginLeft: '0.5rem' }}>({ref.cost} pts{ref.rank ? '/rank' : ''})</span>}
                <div style={{ color: '#8b949e', fontSize: '0.8rem', marginTop: '0.15rem' }}>{ref.effect}</div>
              </div>
            ))
          )}
        </div>
      )}
      {armorPrompt && (
        <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#122117', border: '1px solid #3fb950', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#b1bac4' }}>Set armor to <strong style={{ color: '#3fb950' }}>{armorPrompt.value}D</strong> for {armorPrompt.name}?</span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button onClick={() => { onArmorUpdate(armorPrompt.value); setArmorPrompt(null); }} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#3fb950', color: '#0d1117', fontWeight: 600, border: 'none', borderRadius: '3px' }}>Yes</button>
            <button onClick={() => setArmorPrompt(null)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#484f58', color: '#e6edf3', border: 'none', borderRadius: '3px' }}>No</button>
          </div>
        </div>
      )}
      {items.length === 0 && !showPicker && !armorPrompt && <p style={{ color: '#7d8590' }}>None.</p>}
      {items.map((item, i) => {
        const refEffect = getRefEffect(item.name);
        const isExpanded = expandedEffect[i];
        return (
          <div key={i} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#1c2128', borderRadius: '4px' }}>
            {editing ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {fields.map(f => (
                  <input key={f} value={item[f] || ''} onChange={e => updateItem(i, f, e.target.value)} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} style={{ flex: f === 'description' ? 2 : f === 'rank' ? 0 : 1, width: f === 'rank' ? '50px' : undefined, minWidth: f === 'rank' ? '50px' : '60px', padding: '0.3rem', backgroundColor: '#161b22', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '3px' }} />
                ))}
                <button onClick={() => removeItem(i)} style={{ background: '#f85149', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>X</button>
              </div>
            ) : (
              <div>
                <span style={{ cursor: refEffect ? 'pointer' : 'default' }} onClick={() => refEffect && setExpandedEffect(prev => ({ ...prev, [i]: !prev[i] }))}>
                  <strong>{item.name}</strong>
                  {item.rank && <span style={{ color: '#818cf8' }}> (Rank {item.rank})</span>}
                  {item.description && !refEffect && <span style={{ color: '#8b949e' }}> — {item.description}</span>}
                  {refEffect && <span style={{ color: '#484f58', marginLeft: '0.4rem', fontSize: '0.8rem' }}>{isExpanded ? '▾' : '▸'}</span>}
                </span>
                {refEffect && isExpanded && (
                  <div style={{ color: '#8b949e', fontSize: '0.8rem', marginTop: '0.3rem', paddingLeft: '0.5rem', borderLeft: '2px solid #818cf8' }}>{refEffect}</div>
                )}
                {!refEffect && !item.description && <span style={{ color: '#6e7681' }}> (custom)</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DamageRollModal({ damageInfo, character, onClose, onHeroPointChange, maxDice, isNPC }) {
  const [phase, setPhase] = useState('setup');
  const [extraDice, setExtraDice] = useState(0);
  const [extraPips, setExtraPips] = useState(0);
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
    const diceTotal = results.reduce((a, b) => a + b, 0);
    const total = diceTotal + extraPips;

    setDiceResults(results);
    setRollTotal({ total, results, pips: extraPips });
    setPhase('result');

    try {
      await axios.post(`${API_URL}/rolls/damage`, {
        characterId: character.id,
        characterName: character.name,
        isNPC: isNPC || false,
        weaponName: damageInfo.weaponName,
        damageFormula: damageInfo.damageFormula,
        diceCount: count,
        diceRolled: results,
        total,
        doubled,
        extraDice,
        extraPips,
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ borderColor: '#f85149' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #f85149', marginBottom: '1rem', color: '#f85149', fontWeight: 700 }}>
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
                <button type="button" onClick={() => setExtraDice(extraDice - 1)} className="dice-adjust-btn">-</button>
                <span className="extra-dice-value">{extraDice}</span>
                <button type="button" onClick={() => setExtraDice(extraDice + 1)} className="dice-adjust-btn">+</button>
              </div>
            </div>

            <div className="extra-dice-row">
              <label>Extra Pips:</label>
              <div className="extra-dice-controls">
                <button type="button" onClick={() => setExtraPips(extraPips - 1)} className="dice-adjust-btn">-</button>
                <span className="extra-dice-value">{extraPips}</span>
                <button type="button" onClick={() => setExtraPips(extraPips + 1)} className="dice-adjust-btn">+</button>
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
              <div style={{ color: '#e3b341', fontSize: '0.85rem', padding: '0.4rem 0.6rem', backgroundColor: '#0d1117', borderRadius: '4px', marginBottom: '0.5rem', textAlign: 'center' }}>
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
                <div key={i} className="die-face" style={{ backgroundColor: '#f85149' }}>
                  <span className="die-number">{die}</span>
                </div>
              ))}
            </div>

            <div className="vs-display" style={{ marginTop: '1.5rem' }}>
              <span className="vs-total" style={{ color: '#f85149', fontSize: '2em' }}>{rollTotal?.total}</span>
              <span className="vs-label" style={{ color: '#7d8590' }}>Damage</span>
              {rollTotal?.pips !== 0 && rollTotal?.pips != null && <span style={{ color: '#e3b341', fontSize: '0.85rem' }}>({rollTotal.pips > 0 ? '+' : ''}{rollTotal.pips} pips)</span>}
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
