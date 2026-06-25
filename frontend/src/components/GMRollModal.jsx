import { useState } from 'react';
import axios from 'axios';
import { rollDice, calculateTotal, evaluateGMRollOutcome } from '../utils/dice';
import { getDicePool } from '../data/attributes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OUTCOME_LABELS = {
  EXCEPTIONAL_SUCCESS: 'Exceptional Success',
  SUCCESS: 'Success',
  PARTIAL_SUCCESS: 'Partial Success',
  FAIL: 'Fail',
  CRITICAL_FAIL: 'Critical Fail',
  PENDING_CHOICE: 'Choose Outcome',
};

const OUTCOME_COLORS = {
  EXCEPTIONAL_SUCCESS: '#ffd60a',
  SUCCESS: '#06d6a0',
  PARTIAL_SUCCESS: '#f9a825',
  FAIL: '#ef476f',
  CRITICAL_FAIL: '#b71c1c',
  PENDING_CHOICE: '#06d6a0',
};

export default function GMRollModal({ request, character, onClose, onHeroPointChange }) {
  const [phase, setPhase] = useState('setup');
  const [extraDice, setExtraDice] = useState(0);
  const [doubled, setDoubled] = useState(false);
  const [doubleSource, setDoubleSource] = useState(null);
  const [diceResults, setDiceResults] = useState([]);
  const [rollTotal, setRollTotal] = useState(null);
  const [outcomeInfo, setOutcomeInfo] = useState(null);
  const [rollFlag, setRollFlag] = useState(null);
  const [responseId, setResponseId] = useState(null);
  const [finalOutcome, setFinalOutcome] = useState(null);

  const baseDice = (request.attribute && request.skill)
    ? getDicePool(character, request.attribute, request.skill)
    : request.attribute
      ? (character.attributes?.[request.attribute]?.dice || 2)
      : 2;

  const effectiveDice = doubled ? (baseDice + extraDice) * 2 : baseDice + extraDice;
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

    const results = rollDice(count);
    const { total, complication, removedDie } = calculateTotal(results);
    const wildDie = results[0];
    const evaluation = evaluateGMRollOutcome(total, wildDie, request.dcValue);

    setDiceResults(results);
    setRollTotal({ total, complication, removedDie });
    setOutcomeInfo(evaluation);
    setRollFlag(flag);
    setPhase('result');

    const hpDelta = evaluation.hasChoice ? 0 : evaluation.heroPointDelta;
    const outcome = evaluation.hasChoice ? evaluation.outcome : evaluation.outcome;

    try {
      const res = await axios.post(`${API_URL}/gm-rolls/${request.id}/respond`, {
        characterId: character.id,
        characterName: character.name,
        userId: character.userId,
        diceCount: count,
        diceRolled: results.map(d => d.value),
        wildDie: {
          rolls: wildDie.rolls,
          total: wildDie.value,
          rawFirst: wildDie.rawFirst,
          exploded: wildDie.exploded,
        },
        total,
        complication,
        removedDie,
        doubled,
        extraDice,
        rollFlag: flag,
        linkedResponseId: responseId,
        outcome,
        outcomeChoice: null,
        heroPointDelta: hpDelta,
        neededExplosion: evaluation.neededExplosion,
      });
      setResponseId(res.data.id);

      if (!evaluation.hasChoice && hpDelta > 0) {
        onHeroPointChange(heroPoints + hpDelta);
      }
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

  const handleChoice = async (choice) => {
    if (!responseId || !outcomeInfo) return;

    let chosenOutcome, hpDelta;

    if (outcomeInfo.choiceType === 'wild6_beat') {
      if (choice === 'exceptional') {
        chosenOutcome = 'EXCEPTIONAL_SUCCESS';
        hpDelta = 1;
      } else {
        chosenOutcome = 'SUCCESS';
        hpDelta = outcomeInfo.neededExplosion ? 1 : 2;
      }
    } else if (outcomeInfo.choiceType === 'wild1_beat') {
      if (choice === 'partial') {
        chosenOutcome = 'PARTIAL_SUCCESS';
        hpDelta = 1;
      } else {
        chosenOutcome = 'FAIL';
        hpDelta = 2;
      }
    }

    try {
      await axios.patch(`${API_URL}/gm-rolls/${request.id}/respond/${responseId}`, {
        outcomeChoice: choice,
        outcome: chosenOutcome,
        heroPointDelta: hpDelta,
      });
      onHeroPointChange(heroPoints + hpDelta);
    } catch { /* ignore */ }

    setFinalOutcome({ outcome: chosenOutcome, hpDelta });
    setPhase('done');
  };

  const handleAccept = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content gm-roll-modal">
        <div className="gm-roll-banner">
          GM Roll Request
        </div>

        <h2 className="modal-title">{request.label}</h2>

        <div className="dc-display">
          DC: <span className="dc-value">{request.dcValue}</span>
          {request.dcType === 'dice' && (
            <span className="dc-dice-note"> (rolled {request.dcDiceCount}D6)</span>
          )}
        </div>

        {phase === 'setup' && (
          <div className="roll-setup">
            <div className="dice-breakdown">
              <span className="breakdown-total">{baseDice}D6</span>
              {request.skillLabel && (
                <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                  ({request.skillLabel} + {request.attributeLabel})
                </span>
              )}
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
                    Double Dice ({effectiveDice * 2}D6) — costs 1 Hero Point
                  </button>
                  <button onClick={handleExceptionalDouble} className="double-btn exceptional-double-btn">
                    Exceptional Success ({effectiveDice * 2}D6) — free
                  </button>
                </>
              ) : (
                <div className="doubled-indicator">
                  <span>Doubled! Rolling {effectiveDice}D6 {doubleSource === 'exceptional' ? '(Exceptional Success)' : ''}</span>
                  <button onClick={handleUndoDouble} className="undo-double-btn">Undo</button>
                </div>
              )}
            </div>

            <div className="hero-points-display">
              Hero Points: <strong>{character.heroPoints}</strong>
            </div>

            <button onClick={() => executeRoll(null)} className="roll-execute-btn" disabled={effectiveDice < 1}>
              Roll {effectiveDice}D6 vs DC {request.dcValue}
            </button>
          </div>
        )}

        {(phase === 'result' || phase === 'done') && (
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

            <div className="vs-display">
              <span className="vs-total">{rollTotal?.total}</span>
              <span className="vs-label">vs</span>
              <span className="vs-dc">DC {request.dcValue}</span>
            </div>

            {/* Outcome display */}
            {phase === 'result' && outcomeInfo && !outcomeInfo.hasChoice && (
              <div className="outcome-section">
                <div className="outcome-badge" style={{ backgroundColor: OUTCOME_COLORS[outcomeInfo.outcome] }}>
                  {OUTCOME_LABELS[outcomeInfo.outcome]}
                </div>
                {outcomeInfo.heroPointDelta > 0 && (
                  <div className="hp-delta">+{outcomeInfo.heroPointDelta} Hero Point{outcomeInfo.heroPointDelta > 1 ? 's' : ''}</div>
                )}
                {outcomeInfo.complication && (
                  <div className="outcome-complication">A complication occurs!</div>
                )}
              </div>
            )}

            {/* Choice: wild die 6 and beat DC */}
            {phase === 'result' && outcomeInfo?.choiceType === 'wild6_beat' && (
              <div className="outcome-section">
                <p className="choice-prompt">Your wild die rolled a 6 and you beat the DC! Choose your outcome:</p>
                <div className="choice-buttons">
                  <button onClick={() => handleChoice('exceptional')} className="choice-btn exceptional">
                    <strong>Exceptional Success</strong>
                    <span>+1 Hero Point</span>
                  </button>
                  <button onClick={() => handleChoice('success')} className="choice-btn success">
                    <strong>Success</strong>
                    <span>+{outcomeInfo.neededExplosion ? 1 : 2} Hero Point{outcomeInfo.neededExplosion ? '' : 's'}</span>
                    {outcomeInfo.neededExplosion && <span className="choice-note">(needed explosion to beat DC)</span>}
                  </button>
                </div>
              </div>
            )}

            {/* Choice: wild die 1 and beat DC */}
            {phase === 'result' && outcomeInfo?.choiceType === 'wild1_beat' && (
              <div className="outcome-section">
                <p className="choice-prompt">You beat the DC but rolled a 1 on the wild die! A complication occurs. Choose:</p>
                <div className="choice-buttons">
                  <button onClick={() => handleChoice('partial')} className="choice-btn partial">
                    <strong>Partial Success</strong>
                    <span>+1 Hero Point (with complication)</span>
                  </button>
                  <button onClick={() => handleChoice('choose_fail')} className="choice-btn choose-fail">
                    <strong>Choose to Fail</strong>
                    <span>+2 Hero Points</span>
                  </button>
                </div>
              </div>
            )}

            {/* Final outcome after choice */}
            {phase === 'done' && finalOutcome && (
              <div className="outcome-section">
                <div className="outcome-badge" style={{ backgroundColor: OUTCOME_COLORS[finalOutcome.outcome] }}>
                  {OUTCOME_LABELS[finalOutcome.outcome]}
                </div>
                <div className="hp-delta">+{finalOutcome.hpDelta} Hero Point{finalOutcome.hpDelta > 1 ? 's' : ''}</div>
                {outcomeInfo?.complication && (
                  <div className="outcome-complication">A complication occurs!</div>
                )}
              </div>
            )}

            {doubled && <div className="doubled-note">{doubleSource === 'exceptional' ? 'Doubled dice (Exceptional Success)' : 'Doubled dice (Hero Point spent)'}</div>}

            {/* Action buttons — only show during result phase before choice is made */}
            {phase === 'result' && (
              <div className="result-actions">
                <button onClick={handleReroll} disabled={character.heroPoints < 1} className="reroll-btn">
                  Re-Roll (costs 1 Hero Point)
                </button>
                <button onClick={handleDoubleDown} className="doubledown-btn">
                  Double Down (free, complication on 2nd fail)
                </button>
                {!outcomeInfo?.hasChoice && (
                  <button onClick={handleAccept} className="close-result-btn">
                    Accept Result
                  </button>
                )}
              </div>
            )}

            {phase === 'done' && (
              <div className="result-actions">
                <button onClick={handleAccept} className="close-result-btn">
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
