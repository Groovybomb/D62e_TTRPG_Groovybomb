import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { rollDice, calculateTotal } from '../utils/dice';

export default function VehicleRollModal({ rollInfo, character, onClose, onHeroPointChange, maxDice }) {
  const { label, vehicleName, breakdownParts, baseDice, flatBonus = 0, flatBonusLabel, sizeBonus, woundPenalty = 0, woundLabel, canOperate = true } = rollInfo;

  const [phase, setPhase] = useState('setup');
  const [extraDice, setExtraDice] = useState(0);
  const [sizeAdv, setSizeAdv] = useState(0);
  const [doubled, setDoubled] = useState(false);
  const [doubleSource, setDoubleSource] = useState(null);
  const [diceResults, setDiceResults] = useState([]);
  const [rollTotal, setRollTotal] = useState(null);
  const [rollFlag, setRollFlag] = useState(null);
  const [savedRollId, setSavedRollId] = useState(null);

  const penalizedBase = Math.max(1, baseDice - woundPenalty);
  const sizeBonusDice = sizeBonus?.type === 'dice' ? sizeAdv * (sizeBonus?.rate || 1) : 0;
  const sizeBonusFlat = sizeBonus?.type === 'flat' ? sizeAdv * (sizeBonus?.rate || 3) : 0;
  const totalFlatBonus = flatBonus + sizeBonusFlat;
  const rawDice = doubled ? (penalizedBase + extraDice + sizeBonusDice) * 2 : penalizedBase + extraDice + sizeBonusDice;
  const effectiveDice = maxDice ? Math.min(rawDice, maxDice) : rawDice;
  const isCapped = maxDice && rawDice > maxDice;
  const doubledPreview = maxDice ? Math.min((penalizedBase + extraDice + sizeBonusDice) * 2, maxDice) : (penalizedBase + extraDice + sizeBonusDice) * 2;
  const heroPoints = character?.heroPoints || 0;
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
    if (doubleSource === 'heroPoint') onHeroPointChange(heroPoints + 1);
    setDoubled(false);
    setDoubleSource(null);
  };

  const executeRoll = async (flag = null) => {
    const count = effectiveDice;
    if (count < 1) return;

    const results = rollDice(count);
    const { total: diceTotal, complication, removedDie } = calculateTotal(results);
    const total = diceTotal + totalFlatBonus;

    setDiceResults(results);
    setRollTotal({ total, diceTotal, complication, removedDie, sizeBonusFlat });
    setRollFlag(flag);
    setPhase('result');

    try {
      const res = await axios.post(`${API_URL}/rolls/skill`, {
        characterId: character?.id,
        characterName: character?.name || vehicleName,
        skill: `${label} (${vehicleName})`,
        attribute: '',
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
        <div style={{ textAlign: 'center', color: '#7d8590', fontSize: '0.85rem', marginBottom: '1rem' }}>{vehicleName}</div>

        {phase === 'setup' && (
          <div className="roll-setup">
            <div className="dice-breakdown">
              {breakdownParts.map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className="breakdown-plus">+</span>}
                  <span className={i === 0 ? 'breakdown-attr' : 'breakdown-skill'}>{part.label} {part.dice}D</span>
                </span>
              ))}
              {flatBonus > 0 && (
                <>
                  <span className="breakdown-plus">+</span>
                  <span className="breakdown-skill">{flatBonusLabel} {flatBonus}</span>
                </>
              )}
              <span className="breakdown-plus">=</span>
              <span className="breakdown-total">
                {baseDice}D6{totalFlatBonus > 0 ? ` + ${totalFlatBonus}` : ''}
              </span>
            </div>

            {!canOperate && (
              <div className="wound-cant-act-notice">
                Vehicle cannot normally operate in this state — check with your GM before rolling
              </div>
            )}

            {woundPenalty > 0 && (
              <div className="wound-penalty-notice">
                <span className="wound-penalty-icon">!</span>
                &minus;{woundPenalty}D damage penalty ({woundLabel}) — base reduced to {penalizedBase}D
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

            {sizeBonus && (
              <div className="extra-dice-row">
                <label>{sizeBonus.label}:</label>
                <div className="extra-dice-controls">
                  <button type="button" onClick={() => setSizeAdv(Math.max(0, sizeAdv - 1))} className="dice-adjust-btn">-</button>
                  <span className="extra-dice-value">{sizeAdv}</span>
                  <button type="button" onClick={() => setSizeAdv(sizeAdv + 1)} className="dice-adjust-btn">+</button>
                </div>
                {sizeAdv > 0 && (
                  <span style={{ color: '#3fb950', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    {sizeBonus.type === 'dice' ? `+${sizeBonusDice}D` : `+${sizeBonusFlat}`}
                  </span>
                )}
              </div>
            )}

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
              <div style={{ color: '#e3b341', fontSize: '0.85rem', padding: '0.4rem 0.6rem', backgroundColor: '#0d1117', borderRadius: '4px', marginBottom: '0.5rem', textAlign: 'center' }}>
                Dice capped at {maxDice}D6 (would be {rawDice}D6)
              </div>
            )}

            <p className="roll-info-text">
              The first die is the <strong>Wild Die</strong>. If it rolls a 6, it explodes — roll again and add the result.
              If the wild die rolls a 1, it's a <strong>Complication</strong> — the wild die counts as 0 and the highest other die is removed.
            </p>

            {character && (
              <div className="hero-points-display">
                Hero Points: <strong>{character.heroPoints}</strong>
              </div>
            )}

            <button onClick={() => executeRoll(null)} className="roll-execute-btn" disabled={effectiveDice < 1}>
              Roll {effectiveDice}D6{totalFlatBonus > 0 ? ` + ${totalFlatBonus}` : ''}
            </button>
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
              {(flatBonus > 0 || rollTotal?.sizeBonusFlat > 0) ? (
                <>
                  Dice: {rollTotal?.diceTotal}
                  {flatBonus > 0 && <> + {flatBonusLabel}: {flatBonus}</>}
                  {rollTotal?.sizeBonusFlat > 0 && <> + Size: {rollTotal.sizeBonusFlat}</>}
                  {' = '}
                  <span className="total-number">{rollTotal?.total}</span>
                </>
              ) : (
                <>Total: <span className="total-number">{rollTotal?.total}</span></>
              )}
            </div>

            {doubled && <div className="doubled-note">{doubleSource === 'exceptional' ? 'Doubled dice (Exceptional Success)' : 'Doubled dice (Hero Point spent)'}</div>}

            {character && (
              <div className="hero-points-display">
                Hero Points: <strong>{character.heroPoints}</strong>
              </div>
            )}

            <div className="result-actions">
              <button onClick={handleReroll} disabled={!character || character.heroPoints < 1} className="reroll-btn">
                Re-Roll (costs 1 Hero Point)
              </button>
              <button onClick={handleDoubleDown} className="doubledown-btn">
                Double Down (free, but complication on 2nd failure)
              </button>
              <button onClick={onClose} className="close-result-btn">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
