export const VEHICLE_WOUND_LEVELS = [
  { key: 'undamaged', label: 'Undamaged', penalty: 0, color: '#06d6a0', canOperate: true },
  { key: 'light', label: 'Light', penalty: 1, color: '#ffd60a', canOperate: true },
  { key: 'heavy', label: 'Heavy', penalty: 2, color: '#ff8c00', canOperate: true },
  { key: 'severe', label: 'Severe', penalty: 3, color: '#e94560', canOperate: false },
  { key: 'destroyed', label: 'Destroyed', penalty: 0, color: '#666', canOperate: false },
];

export function getVehicleWoundPenalty(vehicle) {
  const level = VEHICLE_WOUND_LEVELS.find(l => l.key === (vehicle.woundLevel || 'undamaged')) || VEHICLE_WOUND_LEVELS[0];
  return { penalty: level.penalty, label: level.label, canOperate: level.canOperate };
}
