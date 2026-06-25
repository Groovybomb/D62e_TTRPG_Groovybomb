import { useState, useEffect } from 'react';
import axios from 'axios';
import { ATTRIBUTE_DEFINITIONS, getDicePool } from '../data/attributes';
import { DIFFICULTY_TABLE } from '../data/attributes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function GameMasterPage({ userId }) {
  const [characters, setCharacters] = useState([]);
  const [rolls, setRolls] = useState([]);

  useEffect(() => {
    fetchCharacters();
    fetchRolls();
  }, []);

  const fetchCharacters = async () => {
    try {
      const res = await axios.get(`${API_URL}/characters`);
      setCharacters(res.data);
    } catch { /* ignore */ }
  };

  const fetchRolls = async () => {
    try {
      const res = await axios.get(`${API_URL}/rolls`);
      setRolls(res.data.slice(-30).reverse());
    } catch { /* ignore */ }
  };

  return (
    <div className="page" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Left: Characters overview */}
      <div>
        <h2>Game Master</h2>

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

        {/* All characters */}
        <div className="card">
          <h3>All Characters ({characters.length})</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {characters.map(char => (
              <div key={char.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #333' }}>
                <strong style={{ color: '#e94560' }}>{char.name}</strong>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#aaa', marginTop: '0.25rem' }}>
                  <span>Hero Pts: {char.heroPoints}</span>
                  <span>Armor: {char.armor}</span>
                  <span>Dodge: {(char.attributes?.perception?.dice || 0) * 5}</span>
                  <span>Parry: {(char.attributes?.agility?.dice || 0) * 5}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                  {char.attributes && Object.entries(ATTRIBUTE_DEFINITIONS).map(([attrKey, attrDef]) => (
                    <span key={attrKey}>{attrDef.label}: {char.attributes[attrKey]?.dice || 0}D</span>
                  ))}
                </div>
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
                    <div>{roll.skill} — <strong style={{ color: resultClass === 'critical' ? '#ffd60a' : resultClass === 'success' ? '#06d6a0' : '#ef476f' }}>{roll.resultLevel}</strong></div>
                    <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                      Dice: [{roll.diceRolled.join(', ')}] | {roll.baseSuccesses} successes, {roll.wildCount} wild
                    </div>
                  </>
                )}
                {roll.rollType === 'ATTACK' && (
                  <div>Attack: {roll.attackHits ? 'HIT' : 'MISS'}</div>
                )}
                {roll.rollType === 'DAMAGE' && (
                  <div>Damage: {roll.finalDamage} ({roll.weaponName})</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
