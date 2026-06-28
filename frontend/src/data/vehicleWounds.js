export const VEHICLE_WOUND_LEVELS = [
  { key: 'undamaged', label: 'Undamaged', penalty: 0, color: '#3fb950', canOperate: true },
  { key: 'light', label: 'Light', penalty: 1, color: '#e3b341', canOperate: true },
  { key: 'heavy', label: 'Heavy', penalty: 2, color: '#f0883e', canOperate: true },
  { key: 'severe', label: 'Severe', penalty: 3, color: '#818cf8', canOperate: false },
  { key: 'destroyed', label: 'Destroyed', penalty: 0, color: '#6e7681', canOperate: false },
];

export function getVehicleWoundPenalty(vehicle) {
  const level = VEHICLE_WOUND_LEVELS.find(l => l.key === (vehicle.woundLevel || 'undamaged')) || VEHICLE_WOUND_LEVELS[0];
  return { penalty: level.penalty, label: level.label, canOperate: level.canOperate };
}
