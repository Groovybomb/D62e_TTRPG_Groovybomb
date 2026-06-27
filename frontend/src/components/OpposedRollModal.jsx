import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { rollDice, calculateTotal } from '../utils/dice';
import { getDicePool, ATTRIBUTE_DEFINITIONS, SPECIAL_SKILLS } from '../data/attributes';
import { getWoundPenalty } from '../data/wounds';
import { getRollHints } from '../data/characterOptions';
import { determineWinner } from '../data/opposedPresets';

export default function OpposedRollModal({ opposedRoll, character, onClose, onHeroPointChange, maxDice }) {
  const [phase, setPhase] = useState('setup');
  const [extraDice, setExtraDice] = useState(0);
  const [doubled, setDoubled] = useState(false);
  const [doubleSource, setDoubleSource] = useState(null);
  const [diceResults, setDiceResults] = useState([]);
  const [rollTotal, setRollTotal] = useState(null);
  const [rollFlag, setRollFlag] = useState(null);
  const [resolved, setResolved] = useState(false);

  const defSkillLabel = opposedRoll.defenderSkillLabel || '';
  const parts = defSkillLabel.match(/^(.+?)\s*\((.+?)\)$/);
  const defSkillName = parts ? parts[1] : defSkillLabel;

  let defAttrKey = null;
  let defSkillKey = null;
  for (const [aKey, aDef] of Object.entries(ATTRIBUTE_DEFINITIONS)) {
    for (const [sKey, sLabel] of Object.entries(aDef.skills)) {
      if (sLabel === defSkillName) { defAttrKey = aKey; defSkillKey = sKey; break; }
    }
    if (defSkillKey) break;
  }

  const baseDice = defAttrKey && defSkillKey
    ? getDicePool(character, defAttrKey, defSkillKey)
    : (character.attributes?.brawn?.dice || 2);

  const rollHints = defAttrKey && defSkillKey ? getRollHints(character, defAttrKey, defSkillKey) : [];

  const { penalty: woundPenalty, reasons: woundReasons, canAct } = getWoundPenalty(character);
  const applyWoundPenalty = defSkillKey ? !SPECIAL_SKILLS[defSkillKey]?.skipWoundPenalty : true;
  const effectivePenalty = applyWoundPenalty ? woundPenalty : 0;
  const penalizedBase = Math.max(1, baseDice - effectivePenalty);
  const rawDice = doubled ? (penalizedBase + extraDice) * 2 : penalizedBase + extraDice;
  const effectiveDice = maxDice ? Math.min(rawDice, maxDice) : rawDice;
  const isCapped = maxDice && rawDice > maxDice;
  const doubledPreview = maxDice ? Math.min((penalizedBase + extraDice) * 2, maxDice) : (penalizedBase + extraDice) * 2;
  const heroPoints = character.heroPoints || 0;
  const canDouble = !doubled && heroPoints > 0;

  const handleDouble = () => {
    if (heroPoints < 1) return;
    setDoubled(true);
    setDoubleSource('heroPoint');
    onHeroPointChange(heroPoints - 1);
  };
  const handleExceptionalDouble = () => { setDoubled(true); setDoubleSource('exceptional'); };
  const handleUndoDouble = () => {
    if (doubleSource === 'heroPoint') onHeroPointChange(heroPoints + 1);
    setDoubled(false);
    setDoubleSource(null);
  };

  const executeRoll = async (flag = null) => {
    const count = effectiveDice;
    if (count < 1) return;
    const results = rollDice(count);
    const { total, complication, removedDie } = calculateTotal(results);

    setDiceResults(results);
    setRollTotal({ total, complication, removedDie });
    setRollFlag(flag);
    setPhase('result');

    const winner = determineWinner(
      opposedRoll.initiatorTotal, total,
      opposedRoll.initiatorIsNPC, opposedRoll.defenderIsNPC
    );
    const margin = Math.abs(opposedRoll.initiatorTotal - total);

    try {
      await axios.post(`${API_URL}/opposed-rolls/${opposedRoll.id}/respond`, {
        diceCount: count,
        diceRolled: results.map(d => d.value),
        wildDie: { rolls: results[0].rolls, total: results[0].value, rawFirst: results[0].rawFirst, exploded: results[0].exploded },
        total,
        complication,
        winner,
        margin,
      });
      setResolved(true);
    } catch { /* ignore */ }
  };

  const handleReroll = () => {
    if (heroPoints < 1) return;
    onHeroPointChange(heroPoints - 1);
    executeRoll('REROLL');
  };

  const winner = rollTotal
    ? determineWinner(opposedRoll.initiatorTotal, rollTotal.total, opposedRoll.initiatorIsNPC, opposedRoll.defenderIsNPC)
    : null;
  const margin = rollTotal ? Math.abs(opposedRoll.initiatorTotal - rollTotal.total) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderColor: '#e94560' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span style={{ color: '#ffd60a', fontSize: '0.9rem', fontWeight: 700 }}>OPPOSED ROLL — DEFEND</span>
        </div>
        <div style={{ background: '#1a1a2e', padding: '0.6rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          <div><strong style={{ color: '#e94560' }}>{opposedRoll.initiatorCharacterName}</strong>{opposedRoll.initiatorIsNPC && <span style={{ color: '#ff8c00' }}> [NPC]</span>} rolled <strong>{opposedRoll.initiatorSkillLabel}</strong></div>
          <div style={{ color: '#06d6a0', fontSize: '1.1rem', fontWeight: 700 }}>Total: {opposedRoll.initiatorTotal}</div>
        </div>

        <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>
          {character.name}: {defSkillLabel}
        </h2>

        {phase === 'setup' && (
          <div className="roll-setup">
            <div className="dice-breakdown">
              <span className="breakdown-total">{baseDice}D6</span>
            </div>

            {!canAct && (
              <div className="wound-cant-act-notice">Character cannot normally act — check with your GM</div>
            )}
            {applyWoundPenalty && woundPenalty > 0 && (
              <div className="wound-penalty-notice">
                <span className="wound-penalty-icon">!</span>
                &minus;{woundPenalty}D wound penalty ({woundReasons.join(', ')}) — base reduced to {penalizedBase}D
              </div>
            )}

            <div className="extra-dice-row">
              <label>Extra Dice:</label>
              <div className="extra-dice-controls">
                <button type="button" onClick={() => setExtraDice(extraDice - 1)} className="dice-adjust-btn">-</button>
                <span className="extra-dice-value">{extraDice}</span>
                <button type="button" onClick={() => setExtraDice(extraDice + 1)} className="dice-adjust-btn">+</button>
              </div>
            </div>

            <div className="double-section">
              {!doubled ? (
                <>
                  <button onClick={handleDouble} disabled={!canDouble} className="double-btn">Double Dice ({doubledPreview}D6) — costs 1 Hero Point</button>
                  <button onClick={handleExceptionalDouble} className="double-btn exceptional-double-btn">Exceptional Success ({doubledPreview}D6) — free</button>
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

            {rollHints.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                {rollHints.map((h, i) => (
                  <div key={i} style={{ padding: '0.35rem 0.6rem', marginBottom: '0.25rem', borderRadius: '4px', fontSize: '0.82rem', backgroundColor: h.isWarning ? '#3d1a1a' : '#1a2e1a', borderLeft: `3px solid ${h.isWarning ? '#ef476f' : '#06d6a0'}` }}>
                    <strong style={{ color: h.isWarning ? '#ef476f' : '#06d6a0' }}>{h.source}: {h.name}</strong>
                    <span style={{ color: '#ccc', marginLeft: '0.4rem' }}>{h.note}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="hero-points-display">Hero Points: <strong>{heroPoints}</strong></div>
            <button onClick={() => executeRoll(null)} className="roll-execute-btn" disabled={effectiveDice < 1}>Roll {effectiveDice}D6</button>
          </div>
        )}

        {phase === 'result' && (
          <div className="roll-result-display">
            {rollFlag && (
              <div className={`roll-flag ${rollFlag === 'REROLL' ? 'reroll' : 'doubledown'}`}>
                {rollFlag === 'REROLL' ? 'Re-Roll' : 'Double Down'}
              </div>
            )}

            <div className="dice-visual-row">
              {diceResults.map((die, i) => (
                <div key={i} className={`die-face ${die.isWild ? 'wild' : ''} ${die.isWild && die.rawFirst === 6 ? 'wild-six' : ''} ${die.isWild && die.rawFirst === 1 ? 'wild-one' : ''}`}>
                  {die.isWild ? (
                    <div className="wild-die-display">
                      <span className="wild-label">WILD</span>
                      {die.rolls.map((r, j) => (
                        <span key={j} className={`wild-roll ${r === 6 ? 'explode' : ''}`}>
                          {r}{j < die.rolls.length - 1 ? ' + ' : ''}
                        </span>
                      ))}
                      {die.exploded && <span className="explode-note">Exploding!</span>}
                      <span className="wild-total">= {die.value}</span>
                    </div>
                  ) : (
                    <span className="die-number">{die.value}</span>
                  )}
                </div>
              ))}
            </div>

            {rollTotal?.complication && (
              <div className="complication-notice">
                COMPLICATION — Wild die rolled 1! Wild die = 0, highest other die ({rollTotal.removedDie}) removed.
              </div>
            )}

            <div className="roll-total">
              Your Total: <span className="total-number">{rollTotal?.total}</span>
              <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '0.5rem' }}>vs. {opposedRoll.initiatorTotal}</span>
            </div>

            {doubled && <div className="doubled-note">{doubleSource === 'exceptional' ? 'Doubled dice (Exceptional Success)' : 'Doubled dice (Hero Point spent)'}</div>}

            {/* Outcome */}
            <div style={{
              padding: '0.75rem', borderRadius: '8px', textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.5rem',
              backgroundColor: winner === 'defender' ? '#1a2e1a' : winner === 'initiator' ? '#3d1a1a' : '#2a2a3e',
              border: `2px solid ${winner === 'defender' ? '#06d6a0' : winner === 'initiator' ? '#e94560' : '#ffd60a'}`,
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: winner === 'defender' ? '#06d6a0' : winner === 'initiator' ? '#e94560' : '#ffd60a' }}>
                {winner === 'defender' ? `${character.name} wins!` : winner === 'initiator' ? `${opposedRoll.initiatorCharacterName} wins!` : 'Tie!'}
              </div>
              {margin > 0 && <div style={{ fontSize: '0.85rem', color: '#ccc' }}>Margin: {margin}</div>}
              {winner === 'tie' && <div style={{ fontSize: '0.8rem', color: '#ffd60a' }}>Both PCs tied — highest wild die wins, or GM decides</div>}
            </div>

            <div className="hero-points-display">Hero Points: <strong>{heroPoints}</strong></div>

            <div className="result-actions">
              {!resolved && (
                <>
                  <button onClick={handleReroll} disabled={heroPoints < 1} className="reroll-btn">Re-Roll (costs 1 Hero Point)</button>
                  <button onClick={() => executeRoll('DOUBLE_DOWN')} className="doubledown-btn">Double Down (free, complication on 2nd failure)</button>
                </>
              )}
              <button onClick={onClose} className="close-result-btn">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
