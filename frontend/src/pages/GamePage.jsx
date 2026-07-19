import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { ATTRIBUTE_DEFINITIONS, getDicePool, SPECIAL_SKILLS, parseSkillValue, getSkillBonusPips } from '../data/attributes';
import { OUTCOME_LABELS, OUTCOME_COLORS } from '../data/outcomes';
import { OPPOSED_PRESETS, VEHICLE_OPPOSED_PRESETS, getStaticDefense, getVehicleDefense, getSkillLabel, determineWinner, parseDamageFormula } from '../data/opposedPresets';
import { rollDice, calculateTotal } from '../utils/dice';
import { getWoundPenalty } from '../data/wounds';
import RollModal from '../components/RollModal';

export default function GamePage({ userId, displayName, isGM, maxDice, refreshKey }) {
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
  const [oppWeaponIdx, setOppWeaponIdx] = useState('');
  const [oppPhase, setOppPhase] = useState('setup');
  const [oppResult, setOppResult] = useState(null);

  // Vehicle opposed roll state
  const [allVehicles, setAllVehicles] = useState([]);
  const [voppOpen, setVoppOpen] = useState(false);
  const [voppAtkVehicleId, setVoppAtkVehicleId] = useState('');
  const [voppAtkCrewId, setVoppAtkCrewId] = useState('');
  const [voppDefVehicleId, setVoppDefVehicleId] = useState('');
  const [voppDefCrewId, setVoppDefCrewId] = useState('');
  const [voppPreset, setVoppPreset] = useState(null);
  const [voppWeaponIdx, setVoppWeaponIdx] = useState('');
  const [voppPhase, setVoppPhase] = useState('setup');
  const [voppResult, setVoppResult] = useState(null);

  useEffect(() => {
    fetchCharacters();
    fetchVehicles();
    fetchRolls();
    fetchMessages();
    fetchOpposedRolls();
    const rollInterval = setInterval(fetchRolls, 5000);
    const msgInterval = setInterval(fetchMessages, 3000);
    const oppInterval = setInterval(fetchOpposedRolls, 5000);
    return () => { clearInterval(rollInterval); clearInterval(msgInterval); clearInterval(oppInterval); };
  }, [userId]);

  // Re-fetch characters when a globally-mounted modal (GM Roll, Opposed Roll) spends a
  // Hero Point elsewhere — those update App.jsx's state, not this page's own.
  useEffect(() => { fetchCharacters(); }, [refreshKey]);

  const fetchCharacters = async () => {
    try {
      const [allRes, mineRes] = await Promise.all([
        axios.get(`${API_URL}/characters`),
        axios.get(`${API_URL}/characters`, { params: { userId } }),
      ]);
      setAllCharacters(allRes.data);
      setCharacters(mineRes.data);
      setSelectedCharacter(prev => {
        if (!prev) return mineRes.data[0] || null;
        return mineRes.data.find(c => c.id === prev.id) || prev;
      });
    } catch { /* ignore */ }
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${API_URL}/vehicles`);
      setAllVehicles(res.data);
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
    const parsed = parseSkillValue(attr.skills[skillKey]);
    const skillDice = parsed.dice + parsed.bonusDice;
    setRollModal({
      label: `${skillLabel} (${attrDef.label})`,
      attrKey, attrLabel: attrDef.label, attrDice: attr.dice,
      skillKey, skillLabel, skillDice, baseDice: attr.dice + skillDice,
      bonusPips: parsed.bonusPips,
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
    setOppWeaponIdx('');
  };

  const startOpposedRoll = () => {
    if (!initiatorChar || !defenderChar || !oppPreset) return;

    if (oppPreset.attacker.type === 'damage') {
      const weapon = initiatorChar.weapons?.[parseInt(oppWeaponIdx)];
      if (!weapon) return;
      const diceCount = parseDamageFormula(weapon.damage);
      if (!diceCount) return;
      setRollModal({
        label: `Damage — ${weapon.name} (${weapon.damage})`,
        attrKey: null, attrLabel: 'Damage', attrDice: 0,
        skillKey: null, skillLabel: null, skillDice: 0,
        baseDice: diceCount,
        weaponName: weapon.name,
        damageFormula: weapon.damage,
        isOpposedInitiator: true,
        isDamageOpposed: true,
      });
      setOppPhase('rolling_initiator');
      return;
    }

    const { attr, skill } = oppPreset.attacker;
    const attrDef = ATTRIBUTE_DEFINITIONS[attr];
    const attrData = initiatorChar.attributes?.[attr];
    if (!attrDef || !attrData) return;

    const skillLabel = attrDef.skills[skill];
    const special = SPECIAL_SKILLS[skill];
    let skillDice, bonusPips = 0;
    if (special) {
      skillDice = initiatorChar[special.sourceField] || 0;
    } else {
      const parsed = parseSkillValue(attrData.skills[skill]);
      skillDice = parsed.dice + parsed.bonusDice;
      bonusPips = parsed.bonusPips;
    }
    const baseDice = attrData.dice + skillDice;

    setRollModal({
      label: `${skillLabel} (${attrDef.label})`,
      attrKey: attr, attrLabel: attrDef.label, attrDice: attrData.dice,
      skillKey: skill, skillLabel, skillDice, baseDice, bonusPips,
      skipWoundPenalty: special?.skipWoundPenalty,
      isOpposedInitiator: true,
    });
    setOppPhase('rolling_initiator');
  };

  const handleInitiatorRollComplete = async (total, diceValues) => {
    if (!initiatorChar || !defenderChar || !oppPreset) return;

    const isDamage = oppPreset.attacker.type === 'damage';
    const initiatorSkillLabel = isDamage
      ? `Damage — ${initiatorChar.weapons?.[parseInt(oppWeaponIdx)]?.name || 'Weapon'}`
      : getSkillLabel(oppPreset.attacker.attr, oppPreset.attacker.skill);
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
    setOppWeaponIdx('');
  };

  useEffect(() => {
    if (oppPhase !== 'waiting' || !oppResult) return;
    const updated = opposedRolls.find(r => r.id === oppResult.id);
    if (updated && updated.status === 'complete') {
      setOppResult(updated);
      setOppPhase('complete');
    }
  }, [opposedRolls, oppPhase, oppResult]);

  // --- Vehicle Opposed Roll Logic ---
  const voppAtkVehicle = allVehicles.find(v => v.id === voppAtkVehicleId);
  const voppDefVehicle = allVehicles.find(v => v.id === voppDefVehicleId);
  const voppAtkCrew = allCharacters.find(c => c.id === voppAtkCrewId);
  const voppDefCrew = allCharacters.find(c => c.id === voppDefCrewId);

  useEffect(() => {
    if (!voppAtkVehicle || !voppPreset) return;
    if (voppPreset.attacker.type === 'crew_skill') {
      const tacticalId = voppAtkVehicle.crew?.tactical;
      if (tacticalId && allCharacters.some(c => c.id === tacticalId)) setVoppAtkCrewId(tacticalId);
    }
  }, [voppAtkVehicleId, voppPreset]);

  useEffect(() => {
    if (!voppDefVehicle || !voppPreset) return;
    if (voppPreset.defender.type === 'vehicle_evade') {
      const helmId = voppDefVehicle.crew?.helm;
      if (helmId && allCharacters.some(c => c.id === helmId)) setVoppDefCrewId(helmId);
    } else if (voppPreset.defender.type === 'vehicle_resist') {
      const opsId = voppDefVehicle.crew?.operations;
      if (opsId && allCharacters.some(c => c.id === opsId)) setVoppDefCrewId(opsId);
    }
  }, [voppDefVehicleId, voppPreset]);

  const getVehicleGunneryDice = (char) => {
    if (!char) return 0;
    const perc = char.attributes?.perception;
    const gunnery = parseSkillValue(perc?.skills?.gunnery);
    return (perc?.dice || 0) + gunnery.dice + gunnery.bonusDice;
  };

  const getVehiclePilotingSkill = (char) => {
    if (!char) return 0;
    const pilot = parseSkillValue(char.attributes?.mechanical?.skills?.piloting);
    return pilot.dice + pilot.bonusDice;
  };

  const getVehicleEvadeDice = (char, vehicle) => {
    return getVehiclePilotingSkill(char) + (vehicle?.stats?.maneuverability || 0);
  };

  const getVehicleResistDice = (vehicle) => {
    return (vehicle?.stats?.hull || 0) + (vehicle?.stats?.shield || 0);
  };

  const startVehicleOpposed = () => {
    if (!voppAtkVehicle || !voppDefVehicle || !voppPreset) return;

    if (voppPreset.attacker.type === 'vehicle_damage') {
      const weapon = voppAtkVehicle.weapons?.[parseInt(voppWeaponIdx)];
      if (!weapon) return;
      const diceCount = parseDamageFormula(weapon.damage);
      if (!diceCount) return;
      setRollModal({
        label: `Vehicle Damage — ${weapon.name} (${weapon.damage})`,
        attrKey: null, attrLabel: 'Damage', attrDice: 0,
        skillKey: null, skillLabel: null, skillDice: 0,
        baseDice: diceCount,
        weaponName: weapon.name,
        damageFormula: weapon.damage,
        isVehicleOpposedInitiator: true,
        isDamageOpposed: true,
      });
      setVoppPhase('rolling_initiator');
      return;
    }

    if (voppPreset.attacker.type === 'crew_skill') {
      if (!voppAtkCrew) return;
      const { attr, skill } = voppPreset.attacker;
      const attrDef = ATTRIBUTE_DEFINITIONS[attr];
      const attrData = voppAtkCrew.attributes?.[attr];
      if (!attrDef || !attrData) return;
      const skillLabel = attrDef.skills[skill];
      const parsed = parseSkillValue(attrData.skills[skill]);
      const skillDice = parsed.dice + parsed.bonusDice;
      const baseDice = attrData.dice + skillDice;
      setRollModal({
        label: `${skillLabel} (${attrDef.label}) — ${voppAtkVehicle.name}`,
        attrKey: attr, attrLabel: attrDef.label, attrDice: attrData.dice,
        skillKey: skill, skillLabel, skillDice, baseDice,
        bonusPips: parsed.bonusPips,
        isVehicleOpposedInitiator: true,
      });
      setVoppPhase('rolling_initiator');
    }
  };

  const handleVehicleInitiatorComplete = async (total, diceValues) => {
    if (!voppAtkVehicle || !voppDefVehicle || !voppPreset) return;

    const isDamage = voppPreset.attacker.type === 'vehicle_damage';
    const weapon = isDamage ? voppAtkVehicle.weapons?.[parseInt(voppWeaponIdx)] : null;
    const initiatorSkillLabel = isDamage
      ? `Damage — ${weapon?.name || 'Weapon'}`
      : getSkillLabel(voppPreset.attacker.attr, voppPreset.attacker.skill);
    const initiatorIsNPC = voppAtkCrew?.isNPC || voppAtkVehicle.isNPC || false;
    const defenderIsNPC = voppDefCrew?.isNPC || voppDefVehicle.isNPC || false;

    if (voppPreset.defender.type === 'vehicle_static') {
      const defenseVal = getVehicleDefense(voppDefVehicle);
      const winner = determineWinner(total, defenseVal, initiatorIsNPC, defenderIsNPC);
      const margin = Math.abs(total - defenseVal);
      try {
        const res = await axios.post(`${API_URL}/opposed-rolls`, {
          type: 'vehicle',
          initiatorUserId: voppAtkCrew?.userId || userId,
          initiatorCharacterId: voppAtkCrew?.id || null,
          initiatorCharacterName: voppAtkCrew?.name || 'Crew',
          initiatorIsNPC,
          initiatorVehicleId: voppAtkVehicle.id,
          initiatorVehicleName: voppAtkVehicle.name,
          preset: voppPreset.key,
          initiatorSkillLabel,
          initiatorDiceCount: diceValues.length,
          initiatorDiceRolled: diceValues,
          initiatorWildDie: null,
          initiatorTotal: total,
          initiatorComplication: false,
          defenderUserId: voppDefCrew?.userId || voppDefVehicle.userId,
          defenderCharacterId: voppDefCrew?.id || null,
          defenderCharacterName: voppDefCrew?.name || 'Crew',
          defenderIsNPC,
          defenderVehicleId: voppDefVehicle.id,
          defenderVehicleName: voppDefVehicle.name,
          defenderSkillLabel: `Defense (${defenseVal})`,
          defenderIsStatic: true,
          defenderTotal: defenseVal,
          winner,
          margin,
        });
        setVoppResult(res.data);
        setVoppPhase('complete');
        fetchOpposedRolls();
      } catch { /* ignore */ }
    } else {
      let defenderSkillLabel, defenderBaseDice, defenderFlatBonus;
      if (voppPreset.defender.type === 'vehicle_evade') {
        const evadeDice = getVehicleEvadeDice(voppDefCrew, voppDefVehicle);
        const defense = getVehicleDefense(voppDefVehicle);
        defenderSkillLabel = `Evade (Piloting + Maneuverability)`;
        defenderBaseDice = evadeDice;
        defenderFlatBonus = defense;
      } else if (voppPreset.defender.type === 'vehicle_resist') {
        const resistDice = getVehicleResistDice(voppDefVehicle);
        defenderSkillLabel = `Resist Damage (Hull + Shield)`;
        defenderBaseDice = resistDice;
        defenderFlatBonus = 0;
      }
      try {
        const res = await axios.post(`${API_URL}/opposed-rolls`, {
          type: 'vehicle',
          initiatorUserId: voppAtkCrew?.userId || userId,
          initiatorCharacterId: voppAtkCrew?.id || null,
          initiatorCharacterName: voppAtkCrew?.name || 'Crew',
          initiatorIsNPC,
          initiatorVehicleId: voppAtkVehicle.id,
          initiatorVehicleName: voppAtkVehicle.name,
          preset: voppPreset.key,
          initiatorSkillLabel,
          initiatorDiceCount: diceValues.length,
          initiatorDiceRolled: diceValues,
          initiatorWildDie: null,
          initiatorTotal: total,
          initiatorComplication: false,
          defenderUserId: voppDefCrew?.userId || voppDefVehicle.userId,
          defenderCharacterId: voppDefCrew?.id || null,
          defenderCharacterName: voppDefCrew?.name || 'Crew',
          defenderIsNPC,
          defenderVehicleId: voppDefVehicle.id,
          defenderVehicleName: voppDefVehicle.name,
          defenderSkillLabel,
          defenderIsStatic: false,
          defenderTotal: null,
          defenderBaseDice,
          defenderFlatBonus,
          winner: null,
          margin: null,
        });
        setVoppResult(res.data);
        setVoppPhase('waiting');
        fetchOpposedRolls();
      } catch { /* ignore */ }
    }
  };

  const resetVehicleOpposed = () => {
    setVoppPhase('setup');
    setVoppResult(null);
    setVoppPreset(null);
    setVoppWeaponIdx('');
  };

  useEffect(() => {
    if (voppPhase !== 'waiting' || !voppResult) return;
    const updated = opposedRolls.find(r => r.id === voppResult.id);
    if (updated && updated.status === 'complete') {
      setVoppResult(updated);
      setVoppPhase('complete');
    }
  }, [opposedRolls, voppPhase, voppResult]);

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
              <div style={{ fontSize: '0.85rem', color: '#7d8590' }}>
                Hero Points: <strong style={{ color: '#818cf8' }}>{selectedCharacter?.heroPoints || 0}</strong>
              </div>
            </div>

            <div className="card">
              <h3>Quick Roll</h3>
              <p style={{ fontSize: '0.85rem', color: '#7d8590', marginBottom: '0.75rem' }}>Select a skill to open the roll popup:</p>
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
            <h3 style={{ margin: 0, color: '#818cf8' }}>Character Opposed Rolls</h3>
            <span style={{ fontSize: '1.2rem', color: '#7d8590' }}>{opposedOpen ? '▾' : '▸'}</span>
          </div>

          {opposedOpen && (
            <div style={{ marginTop: '0.75rem' }}>
              {oppPhase === 'setup' && (
                <>
                  {/* Initiator selector */}
                  <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Initiator:</label>
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
                  <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Defender:</label>
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
                          <div style={{ fontSize: '0.75rem', color: '#7d8590', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{cat}</div>
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
                                    background: isSelected ? '#818cf8' : '#161b22',
                                    border: `1px solid ${isSelected ? '#818cf8' : '#30363d'}`,
                                    color: isSelected ? '#fff' : '#b1bac4',
                                    borderRadius: '4px', cursor: 'pointer',
                                  }}
                                >
                                  {p.label.split(' vs. ')[0]}
                                  {initiatorPool && <span style={{ color: isSelected ? '#ffd' : '#3fb950', marginLeft: '0.3rem' }}>{initiatorPool}</span>}
                                  <span style={{ color: '#7d8590', margin: '0 0.2rem' }}>vs</span>
                                  {defenderInfo && <span style={{ color: isSelected ? '#ffd' : '#e3b341' }}>{defenderInfo}</span>}
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
                                  background: isSelected ? '#818cf8' : '#161b22',
                                  border: `1px solid ${isSelected ? '#818cf8' : '#30363d'}`,
                                  color: isSelected ? '#fff' : '#b1bac4',
                                  borderRadius: '4px', cursor: 'pointer',
                                }}
                              >
                                Damage vs Resistance
                                <span style={{ color: '#7d8590', margin: '0 0.2rem' }}>vs</span>
                                <span style={{ color: isSelected ? '#ffd' : '#e3b341' }}>{defPool}D</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Weapon picker for damage preset */}
                      {oppPreset?.attacker.type === 'damage' && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Weapon ({initiatorChar.name}):</label>
                          <select
                            value={oppWeaponIdx}
                            onChange={e => setOppWeaponIdx(e.target.value)}
                            className="select-input"
                            style={{ width: '100%', marginBottom: '0.25rem' }}
                          >
                            <option value="">Select weapon...</option>
                            {(initiatorChar.weapons || []).map((w, i) => {
                              const dc = parseDamageFormula(w.damage);
                              return dc ? <option key={i} value={i}>{w.name} — {w.damage}</option> : null;
                            })}
                          </select>
                        </div>
                      )}

                      {oppPreset && (
                        <button
                          onClick={startOpposedRoll}
                          disabled={oppPreset.attacker.type === 'damage' && !oppWeaponIdx}
                          style={{ width: '100%', padding: '0.6rem', background: '#818cf8', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', marginTop: '0.25rem', opacity: (oppPreset.attacker.type === 'damage' && !oppWeaponIdx) ? 0.5 : 1 }}
                        >
                          {oppPreset.attacker.type === 'damage'
                            ? (oppWeaponIdx ? `Start: ${initiatorChar.name} rolls ${initiatorChar.weapons?.[parseInt(oppWeaponIdx)]?.name} damage` : 'Select a weapon above')
                            : `Start: ${initiatorChar.name} rolls ${oppPreset.label.split(' vs. ')[0]}`}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {oppPhase === 'rolling_initiator' && (
                <div style={{ textAlign: 'center', color: '#e3b341', padding: '1rem 0' }}>
                  Rolling for {initiatorChar?.name}...
                </div>
              )}

              {oppPhase === 'waiting' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ color: '#e3b341', marginBottom: '0.5rem' }}>
                    Waiting for {defenderChar?.name} to roll {oppPreset?.label.split(' vs. ')[1]}...
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7d8590' }}>
                    {initiatorChar?.name} rolled <strong style={{ color: '#3fb950' }}>{oppResult?.initiatorTotal}</strong>
                  </div>
                  <button onClick={resetOpposed} style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Cancel</button>
                </div>
              )}

              {oppPhase === 'complete' && oppResult && (
                <div style={{ padding: '0.5rem 0' }}>
                  <div style={{
                    padding: '0.6rem', borderRadius: '6px', textAlign: 'center',
                    backgroundColor: oppResult.winner === 'initiator' ? '#122117' : oppResult.winner === 'defender' ? '#2a1215' : '#1c1c2a',
                    border: `2px solid ${oppResult.winner === 'initiator' ? '#3fb950' : oppResult.winner === 'defender' ? '#f85149' : '#e3b341'}`,
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#b1bac4' }}>
                      {oppResult.initiatorCharacterName}: <strong style={{ color: '#3fb950' }}>{oppResult.initiatorTotal}</strong>
                      <span style={{ color: '#7d8590', margin: '0 0.5rem' }}>vs.</span>
                      {oppResult.defenderCharacterName}: <strong style={{ color: '#e3b341' }}>{oppResult.defenderTotal}</strong>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.3rem',
                      color: oppResult.winner === 'initiator' ? '#3fb950' : oppResult.winner === 'defender' ? '#f85149' : '#e3b341'
                    }}>
                      {oppResult.winner === 'initiator' ? `${oppResult.initiatorCharacterName} wins!` :
                       oppResult.winner === 'defender' ? `${oppResult.defenderCharacterName} wins!` : 'Tie!'}
                      {oppResult.margin > 0 && <span style={{ fontSize: '0.85rem', color: '#b1bac4', marginLeft: '0.5rem' }}>by {oppResult.margin}</span>}
                    </div>
                    {oppResult.damageApplied && (
                      <div style={{ fontSize: '0.85rem', color: '#f85149', marginTop: '0.3rem', fontWeight: 600 }}>
                        {oppResult.damageApplied.message}
                      </div>
                    )}
                  </div>
                  <button onClick={resetOpposed} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}>New Opposed Roll</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vehicle Opposed Roll Panel */}
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <div
            onClick={() => setVoppOpen(!voppOpen)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <h3 style={{ margin: 0, color: '#3fb950' }}>Vehicle Opposed Rolls</h3>
            <span style={{ fontSize: '1.2rem', color: '#7d8590' }}>{voppOpen ? '▾' : '▸'}</span>
          </div>

          {voppOpen && (
            <div style={{ marginTop: '0.75rem' }}>
              {voppPhase === 'setup' && (
                <>
                  <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Attacker Vehicle:</label>
                  <select value={voppAtkVehicleId} onChange={e => setVoppAtkVehicleId(e.target.value)} className="select-input" style={{ width: '100%', marginBottom: '0.25rem' }}>
                    <option value="">Select vehicle...</option>
                    {allVehicles.map(v => <option key={v.id} value={v.id}>{v.name}{v.isNPC ? ' [NPC]' : ''}</option>)}
                  </select>

                  <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Attacker Crew:</label>
                  <select value={voppAtkCrewId} onChange={e => setVoppAtkCrewId(e.target.value)} className="select-input" style={{ width: '100%', marginBottom: '0.5rem' }}>
                    <option value="">Select crew member...</option>
                    {allCharacters.map(c => <option key={c.id} value={c.id}>{c.name}{c.isNPC ? ' [NPC]' : ''}</option>)}
                  </select>

                  <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Defender Vehicle:</label>
                  <select value={voppDefVehicleId} onChange={e => setVoppDefVehicleId(e.target.value)} className="select-input" style={{ width: '100%', marginBottom: '0.25rem' }}>
                    <option value="">Select vehicle...</option>
                    {allVehicles.filter(v => v.id !== voppAtkVehicleId).map(v => <option key={v.id} value={v.id}>{v.name}{v.isNPC ? ' [NPC]' : ''}</option>)}
                  </select>

                  <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Defender Crew:</label>
                  <select value={voppDefCrewId} onChange={e => setVoppDefCrewId(e.target.value)} className="select-input" style={{ width: '100%', marginBottom: '0.75rem' }}>
                    <option value="">Select crew member...</option>
                    {allCharacters.map(c => <option key={c.id} value={c.id}>{c.name}{c.isNPC ? ' [NPC]' : ''}</option>)}
                  </select>

                  {voppAtkVehicle && voppDefVehicle && (
                    <>
                      {['Attack', 'Damage'].map(cat => (
                        <div key={cat} style={{ marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#7d8590', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{cat}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {VEHICLE_OPPOSED_PRESETS.filter(p => p.category === cat).map(p => {
                              const isSelected = voppPreset?.key === p.key;
                              let atkInfo = '';
                              if (p.attacker.type === 'crew_skill' && voppAtkCrew) {
                                atkInfo = `${getVehicleGunneryDice(voppAtkCrew)}D`;
                              }
                              let defInfo = '';
                              if (p.defender.type === 'vehicle_static') {
                                defInfo = `${getVehicleDefense(voppDefVehicle)}`;
                              } else if (p.defender.type === 'vehicle_evade' && voppDefCrew) {
                                defInfo = `${getVehicleEvadeDice(voppDefCrew, voppDefVehicle)}D+${getVehicleDefense(voppDefVehicle)}`;
                              } else if (p.defender.type === 'vehicle_resist') {
                                defInfo = `${getVehicleResistDice(voppDefVehicle)}D`;
                              }

                              return (
                                <button
                                  key={p.key}
                                  onClick={() => { setVoppPreset(p); setVoppWeaponIdx(''); }}
                                  style={{
                                    padding: '0.3rem 0.5rem', fontSize: '0.78rem',
                                    background: isSelected ? '#3fb950' : '#161b22',
                                    border: `1px solid ${isSelected ? '#3fb950' : '#30363d'}`,
                                    color: isSelected ? '#000' : '#b1bac4',
                                    borderRadius: '4px', cursor: 'pointer',
                                  }}
                                >
                                  {p.label.split(' vs. ')[0]}
                                  {atkInfo && <span style={{ color: isSelected ? '#003' : '#3fb950', marginLeft: '0.3rem' }}>{atkInfo}</span>}
                                  <span style={{ color: '#7d8590', margin: '0 0.2rem' }}>vs</span>
                                  {defInfo && <span style={{ color: isSelected ? '#003' : '#e3b341' }}>{defInfo}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Vehicle weapon picker for damage */}
                      {voppPreset?.attacker.type === 'vehicle_damage' && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#8b949e' }}>Weapon ({voppAtkVehicle.name}):</label>
                          <select
                            value={voppWeaponIdx}
                            onChange={e => setVoppWeaponIdx(e.target.value)}
                            className="select-input"
                            style={{ width: '100%', marginBottom: '0.25rem' }}
                          >
                            <option value="">Select weapon...</option>
                            {(voppAtkVehicle.weapons || []).map((w, i) => {
                              const dc = parseDamageFormula(w.damage);
                              return dc ? <option key={i} value={i}>{w.name} — {w.damage}</option> : null;
                            })}
                          </select>
                        </div>
                      )}

                      {voppPreset && (
                        <button
                          onClick={startVehicleOpposed}
                          disabled={(voppPreset.attacker.type === 'vehicle_damage' && !voppWeaponIdx) || (voppPreset.attacker.type === 'crew_skill' && !voppAtkCrew)}
                          style={{ width: '100%', padding: '0.6rem', background: '#3fb950', border: 'none', color: '#000', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', marginTop: '0.25rem', opacity: ((voppPreset.attacker.type === 'vehicle_damage' && !voppWeaponIdx) || (voppPreset.attacker.type === 'crew_skill' && !voppAtkCrew)) ? 0.5 : 1 }}
                        >
                          {voppPreset.attacker.type === 'vehicle_damage'
                            ? (voppWeaponIdx ? `Start: ${voppAtkVehicle.name} fires ${voppAtkVehicle.weapons?.[parseInt(voppWeaponIdx)]?.name}` : 'Select a weapon above')
                            : (voppAtkCrew ? `Start: ${voppAtkCrew.name} fires from ${voppAtkVehicle.name}` : 'Select attacker crew above')}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {voppPhase === 'rolling_initiator' && (
                <div style={{ textAlign: 'center', color: '#3fb950', padding: '1rem 0' }}>
                  Rolling for {voppAtkVehicle?.name}...
                </div>
              )}

              {voppPhase === 'waiting' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ color: '#3fb950', marginBottom: '0.5rem' }}>
                    Waiting for {voppDefVehicle?.name} ({voppDefCrew?.name}) to roll...
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7d8590' }}>
                    {voppAtkVehicle?.name} rolled <strong style={{ color: '#3fb950' }}>{voppResult?.initiatorTotal}</strong>
                  </div>
                  <button onClick={resetVehicleOpposed} style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Cancel</button>
                </div>
              )}

              {voppPhase === 'complete' && voppResult && (
                <div style={{ padding: '0.5rem 0' }}>
                  <div style={{
                    padding: '0.6rem', borderRadius: '6px', textAlign: 'center',
                    backgroundColor: voppResult.winner === 'initiator' ? '#122117' : voppResult.winner === 'defender' ? '#2a1215' : '#1c1c2a',
                    border: `2px solid ${voppResult.winner === 'initiator' ? '#3fb950' : voppResult.winner === 'defender' ? '#f85149' : '#e3b341'}`,
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#b1bac4' }}>
                      {voppResult.initiatorVehicleName || voppResult.initiatorCharacterName}: <strong style={{ color: '#3fb950' }}>{voppResult.initiatorTotal}</strong>
                      <span style={{ color: '#7d8590', margin: '0 0.5rem' }}>vs.</span>
                      {voppResult.defenderVehicleName || voppResult.defenderCharacterName}: <strong style={{ color: '#e3b341' }}>{voppResult.defenderTotal}</strong>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.3rem',
                      color: voppResult.winner === 'initiator' ? '#3fb950' : voppResult.winner === 'defender' ? '#f85149' : '#e3b341'
                    }}>
                      {voppResult.winner === 'initiator' ? `${voppResult.initiatorVehicleName || voppResult.initiatorCharacterName} wins!` :
                       voppResult.winner === 'defender' ? `${voppResult.defenderVehicleName || voppResult.defenderCharacterName} wins!` : 'Tie!'}
                      {voppResult.margin > 0 && <span style={{ fontSize: '0.85rem', color: '#b1bac4', marginLeft: '0.5rem' }}>by {voppResult.margin}</span>}
                    </div>
                    {voppResult.damageApplied && (
                      <div style={{ fontSize: '0.85rem', color: '#f85149', marginTop: '0.3rem', fontWeight: 600 }}>
                        {voppResult.damageApplied.message}
                      </div>
                    )}
                  </div>
                  <button onClick={resetVehicleOpposed} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}>New Vehicle Opposed Roll</button>
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
            {isGM && <button onClick={clearLog} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#f85149' }}>Clear Log</button>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1c2128', border: '1px solid #444', borderRadius: '8px 8px 0 0', padding: '1rem' }}>
          {combined.length === 0 && (
            <p style={{ color: '#7d8590', textAlign: 'center', marginTop: '2rem' }}>
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
              const winColor = o.winner === 'initiator' ? '#3fb950' : o.winner === 'defender' ? '#f85149' : '#e3b341';
              return (
                <div key={`opp-${o.id}`} className="message system" style={{ borderLeft: `3px solid ${isComplete ? winColor : '#e3b341'}` }}>
                  <div className="message-author">
                    <span style={{ color: '#818cf8', fontSize: '0.8rem' }}>[Opposed Roll]</span>
                  </div>
                  <div className="message-text">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                      <span>
                        <strong>{o.initiatorVehicleName ? `${o.initiatorVehicleName} (${o.initiatorCharacterName})` : o.initiatorCharacterName}</strong>
                        {o.initiatorIsNPC && <span style={{ color: '#f0883e', fontSize: '0.8rem' }}> [NPC]</span>}
                        {' '}{o.initiatorSkillLabel}
                        {' = '}<strong style={{ color: '#3fb950' }}>{o.initiatorTotal}</strong>
                      </span>
                      <span style={{ color: '#7d8590' }}>vs.</span>
                      <span>
                        <strong>{o.defenderVehicleName ? `${o.defenderVehicleName} (${o.defenderCharacterName})` : o.defenderCharacterName}</strong>
                        {o.defenderIsNPC && <span style={{ color: '#f0883e', fontSize: '0.8rem' }}> [NPC]</span>}
                        {' '}{o.defenderSkillLabel}
                        {' = '}<strong style={{ color: '#e3b341' }}>{o.defenderTotal ?? '...'}</strong>
                      </span>
                    </div>
                  </div>
                  {isComplete && (
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: winColor, marginTop: '0.2rem' }}>
                      {o.winner === 'initiator' ? `${o.initiatorVehicleName || o.initiatorCharacterName} wins` :
                       o.winner === 'defender' ? `${o.defenderVehicleName || o.defenderCharacterName} wins` : 'Tie'}
                      {o.margin > 0 && ` by ${o.margin}`}
                      {o.winner === 'tie' && ' — PC wins ties vs NPC'}
                    </div>
                  )}
                  {isComplete && o.damageApplied && (
                    <div style={{ fontSize: '0.82rem', color: '#f85149', fontWeight: 600, marginTop: '0.2rem', padding: '0.2rem 0.4rem', backgroundColor: '#3d1a1a', borderRadius: '4px' }}>
                      {o.damageApplied.message}
                    </div>
                  )}
                  {!isComplete && (
                    <div style={{ fontSize: '0.85rem', color: '#e3b341', fontStyle: 'italic', marginTop: '0.2rem' }}>
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
              const outcomeColor = OUTCOME_COLORS[roll.outcome] || '#7d8590';
              const outcomeLabel = OUTCOME_LABELS[roll.outcome] || roll.outcome;
              return (
                <div key={roll.id} className="message system" style={{ borderLeft: `3px solid ${outcomeColor}` }}>
                  <div className="message-author">{charName} {rollIsNPC && <span style={{ color: '#f0883e', fontSize: '0.8rem' }}>[NPC]</span>} <span style={{ color: '#e3b341', fontSize: '0.8rem' }}>[GM Roll]</span></div>
                  <div className="message-text">
                    <strong>{roll.skill}</strong> — {roll.total} vs DC {roll.dcValue}{' '}
                    <span style={{ color: outcomeColor, fontWeight: 700 }}>{outcomeLabel}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7d8590', marginTop: '0.2rem' }}>
                    Dice: [{roll.diceRolled?.join(', ')}]
                    {roll.extraPips !== 0 && roll.extraPips != null && <span style={{ color: '#e3b341' }}> +{roll.extraPips} pips</span>}
                    {roll.complication && <span style={{ color: '#f85149', fontWeight: 700 }}> COMPLICATION</span>}
                    {roll.heroPointDelta > 0 && <span style={{ color: '#3fb950' }}> +{roll.heroPointDelta} HP</span>}
                  </div>
                  <div className="message-time">{new Date(roll.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            }

            if (roll.rollType === 'GM_ROLL_DECLINED') {
              return (
                <div key={roll.id} className="message system" style={{ borderLeft: '3px solid #888' }}>
                  <div className="message-author">{charName} <span style={{ color: '#7d8590', fontSize: '0.8rem' }}>[GM Roll — Declined]</span></div>
                  <div className="message-text">
                    <strong>{roll.skill}</strong> — <span style={{ color: '#7d8590', fontStyle: 'italic' }}>Declined</span>
                  </div>
                  <div className="message-time">{new Date(roll.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            }

            if (roll.rollType === 'DAMAGE') {
              return (
                <div key={roll.id} className="message system" style={{ borderLeft: '3px solid #f85149' }}>
                  <div className="message-author">{charName} {rollIsNPC && <span style={{ color: '#f0883e', fontSize: '0.8rem' }}>[NPC]</span>} <span style={{ color: '#f85149', fontSize: '0.8rem' }}>[Damage]</span></div>
                  <div className="message-text">
                    <strong>{roll.weaponName}</strong> ({roll.diceCount}D6) — <strong style={{ color: '#f85149', fontSize: '1.1em' }}>{roll.total}</strong> damage
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7d8590', marginTop: '0.2rem' }}>
                    Dice: [{roll.diceRolled?.join(', ')}]
                    {roll.extraPips !== 0 && roll.extraPips != null && <span style={{ color: '#e3b341' }}> +{roll.extraPips} pips</span>}
                    {roll.rollFlag && <span style={{ color: '#e3b341' }}> {roll.rollFlag === 'REROLL' ? 'RE-ROLL' : 'DOUBLE DOWN'}</span>}
                  </div>
                  <div className="message-time">{new Date(roll.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            }

            return (
              <div key={roll.id} className="message system">
                <div className="message-author">
                  {charName}
                  {rollIsNPC && <span style={{ color: '#f0883e', fontSize: '0.8rem', marginLeft: '0.3rem' }}>[NPC]</span>}
                  {roll.rollFlag && (
                    <span className={`roll-flag-inline ${roll.rollFlag === 'REROLL' ? 'reroll' : 'doubledown'}`}>
                      {roll.rollFlag === 'REROLL' ? 'RE-ROLL' : 'DOUBLE DOWN'}
                    </span>
                  )}
                  {roll.doubled && <span className="roll-flag-inline doubled">DOUBLED</span>}
                </div>
                <div className="message-text">
                  <strong>{roll.skill}</strong>
                  {roll.attribute && roll.attribute !== roll.skill && <span style={{ color: '#7d8590' }}> ({roll.attribute})</span>}
                  {' — '}{roll.diceCount}D6 = <strong style={{ color: '#3fb950', fontSize: '1.1em' }}>{roll.total}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#7d8590', marginTop: '0.2rem' }}>
                  Dice: [{roll.diceRolled?.join(', ')}]
                  {roll.extraPips !== 0 && roll.extraPips != null && <span style={{ color: '#e3b341' }}> +{roll.extraPips} pips</span>}
                  {wildDie && (
                    <span>
                      {' | Wild: '}
                      <span style={{ color: wildDie.rawFirst === 6 ? '#3fb950' : wildDie.rawFirst === 1 ? '#f85149' : '#b1bac4', fontWeight: 700 }}>
                        {wildDie.rolls?.join(' + ')} = {wildDie.total}
                      </span>
                      {wildDie.exploded && <span style={{ color: '#e3b341' }}> EXPLODING!</span>}
                    </span>
                  )}
                  {roll.complication && <span style={{ color: '#f85149', fontWeight: 700 }}> COMPLICATION!</span>}
                </div>
                <div className="message-time">{new Date(roll.createdAt).toLocaleTimeString()}</div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleChat} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#161b22', border: '1px solid #444', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '0.6rem', backgroundColor: '#1c2128', color: '#e6edf3', border: '1px solid #444', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '0.6rem 1.25rem' }}>Send</button>
        </form>
      </div>

      {rollModal && (() => {
        const isVoppInit = rollModal.isVehicleOpposedInitiator;
        const isOppInit = rollModal.isOpposedInitiator;
        const isDmgOpp = rollModal.isDamageOpposed;
        const char = isVoppInit ? voppAtkCrew : isOppInit ? initiatorChar : selectedCharacter;
        if (!char) return null;
        return (
          <RollModal
            rollInfo={rollModal}
            character={char}
            onClose={() => {
              setRollModal(null);
              if (isOppInit && oppPhase === 'rolling_initiator') resetOpposed();
              if (isVoppInit && voppPhase === 'rolling_initiator') resetVehicleOpposed();
              fetchRolls();
            }}
            onHeroPointChange={handleHeroPointChange}
            maxDice={maxDice}
            isNPC={char.isNPC || false}
            isDamageMode={isDmgOpp || false}
            onRollComplete={isVoppInit ? handleVehicleInitiatorComplete : isOppInit ? handleInitiatorRollComplete : undefined}
          />
        );
      })()}
    </div>
  );
}
