import { v4 as uuidv4 } from 'uuid';

// Generate unique IDs
export function generateId() {
  return uuidv4();
}

// Find item by ID in array
export function findById(array, id) {
  return array.find(item => item.id === id);
}

// Find item index by ID in array
export function findIndexById(array, id) {
  return array.findIndex(item => item.id === id);
}

// Simulate a dice roll (1-6)
export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

// Roll multiple dice and return array of results
export function rollMultipleDice(count) {
  return Array.from({ length: count }, () => rollD6());
}

// Count wild dice (1s rolled)
export function countWildDice(rolls) {
  return rolls.filter(roll => roll === 1).length;
}

// Count successes (rolls >= 4)
export function countSuccesses(rolls) {
  return rolls.filter(roll => roll >= 4).length;
}
