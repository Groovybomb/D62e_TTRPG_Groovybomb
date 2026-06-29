export const WOUND_LEVELS = [
  { key: 'healthy', label: 'Healthy', penalty: 0, color: '#3fb950', canAct: true },
  { key: 'wounded', label: 'Wounded', penalty: 1, color: '#e3b341', canAct: true },
  { key: 'incapacitated', label: 'Incapacitated', penalty: 0, color: '#818cf8', canAct: false },
  { key: 'mortallyWounded', label: 'Mortally Wounded', penalty: 0, color: '#c70039', canAct: false },
  { key: 'dead', label: 'Dead', penalty: 0, color: '#6e7681', canAct: false },
];

export const STUN_STATES = [
  { key: 'none', label: 'Clear', penalty: 0, color: '#3fb950' },
  { key: 'staggered', label: 'Staggered', penalty: 1, color: '#e3b341' },
  { key: 'stunned', label: 'Stunned', penalty: 0, color: '#818cf8' },
];

export function getWoundPenalty(character) {
  const woundLevel = character?.woundLevel || 'healthy';
  const stunState = character?.stunState || 'none';

  let penalty = 0;
  const reasons = [];

  const wl = WOUND_LEVELS.find(w => w.key === woundLevel);
  const ss = STUN_STATES.find(s => s.key === stunState);

  if (wl && wl.penalty > 0) {
    penalty += wl.penalty;
    reasons.push(wl.label);
  }
  if (ss && ss.penalty > 0) {
    penalty += ss.penalty;
    reasons.push(ss.label);
  }

  const canAct = (wl?.canAct !== false) && (ss?.key !== 'stunned');

  return { penalty, reasons, canAct };
}
