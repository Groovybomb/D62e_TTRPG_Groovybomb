import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { rollDice, calculateTotal } from '../utils/dice';
import { getWoundPenalty } from '../data/wounds';
import { getRollHints } from '../data/characterOptions';

export default function RollModal({ rollInfo, character, onClose, onHeroPointChange, maxDice, isNPC }) {
  const { label, attrKey, attrLabel, attrDice, skillKey, skillLabel, skillDice, baseDice } = rollInfo;
  const rollHints = getRollHints(character, attrKey, skillKey);

  const [phase, setPhase] = useState('setup'); // 'setup' | 'result'
  const [extraDice, setExtraDice] = useState(0);
  const [doubled, setDoubled] = useState(false);
  const [doubleSource, setDoubleSource] = useState(null); // 'heroPoint' | 'exceptional' | null
  const [diceResults, setDiceResults] = useState([]);
  const [rollTotal, setRollTotal] = useState(null);
  const [rollFlag, setRollFlag] = useState(null); // null | 'REROLL' | 'DOUBLE_DOWN'
  const [linkedRollId, setLinkedRollId] = useState(null);
  const [savedRollId, setSavedRollId] = useState(null);

  const { penalty: woundPenalty, reasons: woundReasons, canAct } = getWoundPenalty(character);
  const applyWoundPenalty = !rollInfo.skipWoundPenalty;
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

    const results = rollDice(count);
    const { total, complication, removedDie } = calculateTotal(results);

    setDiceResults(results);
    setRollTotal({ total, complication, removedDie });
    setRollFlag(flag);
    setPhase('result');

    // Save to backend
    try {
      const res = await axios.post(`${API_URL}/rolls/skill`, {
        characterId: character.id,
        characterName: character.name,
        isNPC: isNPC || false,
        skill: skillLabel || attrLabel,
        attribute: attrLabel,
        diceCount: count,
        diceRolled: results.map(d => d.value),
        wildDie: {
          rolls: results[0].rolls,
          total: results[0].value,
          rawFirst: results[0].rawFirst,
          exploded: results[0].exploded,
        },
        total,
        complication,
        removedDie,
        doubled,
        extraDice,
        rollFlag: flag,
        linkedRollId: savedRollId,
      });
      setSavedRollId(res.data.id);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <h2 className="modal-title">{label}</h2>

        {phase === 'setup' && (
          <div className="roll-setup">
            {/* Dice breakdown */}
            <div className="dice-breakdown">
              <span className="breakdown-attr">{attrLabel} {attrDice}D</span>
              {skillLabel && (
                <>
                  <span className="breakdown-plus">+</span>
                  <span className="breakdown-skill">{skillLabel} {skillDice}D</span>
                </>
              )}
              <span className="breakdown-plus">=</span>
              <span className="breakdown-total">{baseDice}D6</span>
            </div>

            {!canAct && (
              <div className="wound-cant-act-notice">
                Character cannot normally act in this state — check with your GM before rolling
              </div>
            )}

            {applyWoundPenalty && woundPenalty > 0 && (
              <div className="wound-penalty-notice">
                <span className="wound-penalty-icon">!</span>
                &minus;{woundPenalty}D wound penalty ({woundReasons.join(', ')}) — base reduced to {penalizedBase}D
              </div>
            )}

            {/* Extra dice */}
            <div className="extra-dice-row">
              <label>Extra Dice:</label>
              <div className="extra-dice-controls">
                <button type="button" onClick={() => setExtraDice(extraDice - 1)} className="dice-adjust-btn">-</button>
                <span className="extra-dice-value">{extraDice}</span>
                <button type="button" onClick={() => setExtraDice(extraDice + 1)} className="dice-adjust-btn">+</button>
              </div>
            </div>

            {/* Double dice */}
            <div className="double-section">
              {!doubled ? (
                <>
                  <button onClick={handleDouble} disabled={!canDouble} className="double-btn">
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
              {!canDouble && !doubled && (
                <p className="no-hero-note">No Hero Points available to double</p>
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

            <p className="roll-info-text">
              The first die is the <strong>Wild Die</strong>. If it rolls a 6, it explodes — roll again and add the result.
              If the wild die rolls a 1, it's a <strong>Complication</strong> — the wild die counts as 0 and the highest other die is removed.
            </p>

            {/* Hero points display */}
            <div className="hero-points-display">
              Hero Points: <strong>{character.heroPoints}</strong>
            </div>

            {/* Roll button */}
            <button onClick={() => executeRoll(null)} className="roll-execute-btn" disabled={effectiveDice < 1}>
              Roll {effectiveDice}D6
            </button>
          </div>
        )}

        {phase === 'result' && (
          <div className="roll-result-display">
            {/* Roll flag */}
            {rollFlag && (
              <div className={`roll-flag ${rollFlag === 'REROLL' ? 'reroll' : 'doubledown'}`}>
                {rollFlag === 'REROLL' ? 'Re-Roll' : 'Double Down'}
              </div>
            )}

            {/* Dice display */}
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

            {/* Complication notice */}
            {rollTotal?.complication && (
              <div className="complication-notice">
                COMPLICATION — Wild die rolled 1! Wild die = 0, highest other die ({rollTotal.removedDie}) removed.
              </div>
            )}

            {/* Total */}
            <div className="roll-total">
              Total: <span className="total-number">{rollTotal?.total}</span>
            </div>

            {doubled && <div className="doubled-note">{doubleSource === 'exceptional' ? 'Doubled dice (Exceptional Success)' : 'Doubled dice (Hero Point spent)'}</div>}

            <div className="hero-points-display">
              Hero Points: <strong>{character.heroPoints}</strong>
            </div>

            {/* Action buttons */}
            <div className="result-actions">
              <button onClick={handleReroll} disabled={character.heroPoints < 1} className="reroll-btn">
                Re-Roll (costs 1 Hero Point)
              </button>
              <button onClick={handleDoubleDown} className="doubledown-btn">
                Double Down (free, but complication on 2nd failure)
              </button>
              <button onClick={onClose} className="close-result-btn">
                Close
              </button>
            </div>

            <p className="result-info-text">
              <strong>Re-Roll:</strong> Spend a Hero Point to roll again.<br />
              <strong>Double Down:</strong> Roll again for free — but if you fail a second time, a complication is added. You must roll <em>greater than</em> the difficulty (not equal).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
