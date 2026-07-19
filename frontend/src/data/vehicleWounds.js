// Per the rulebook, vehicles "take damage the same way characters do, and their damage
// levels are the same" — same wound track and stagger/stun track as characters. Only the
// terminal wound state's name differs (Destroyed vs Dead).
export const VEHICLE_WOUND_LEVELS = [
  { key: 'healthy', label: 'Healthy', penalty: 0, color: '#3fb950', canOperate: true },
  { key: 'wounded', label: 'Wounded', penalty: 1, color: '#e3b341', canOperate: true },
  { key: 'incapacitated', label: 'Incapacitated', penalty: 0, color: '#818cf8', canOperate: false },
  { key: 'mortallyWounded', label: 'Mortally Wounded', penalty: 0, color: '#c70039', canOperate: false },
  { key: 'destroyed', label: 'Destroyed', penalty: 0, color: '#6e7681', canOperate: false },
];

export const VEHICLE_STUN_STATES = [
  { key: 'none', label: 'Clear', penalty: 0, color: '#3fb950' },
  { key: 'staggered', label: 'Staggered', penalty: 1, color: '#e3b341' },
  { key: 'stunned', label: 'Stunned', penalty: 0, color: '#818cf8' },
];

export function getVehicleWoundPenalty(vehicle) {
  const woundLevel = vehicle?.woundLevel || 'healthy';
  const stunState = vehicle?.stunState || 'none';

  let penalty = 0;
  const reasons = [];

  const wl = VEHICLE_WOUND_LEVELS.find(w => w.key === woundLevel);
  const ss = VEHICLE_STUN_STATES.find(s => s.key === stunState);

  if (wl && wl.penalty > 0) {
    penalty += wl.penalty;
    reasons.push(wl.label);
  }
  if (ss && ss.penalty > 0) {
    penalty += ss.penalty;
    reasons.push(ss.label);
  }

  const canOperate = (wl?.canOperate !== false) && (ss?.key !== 'stunned');

  return { penalty, reasons, canOperate };
}
