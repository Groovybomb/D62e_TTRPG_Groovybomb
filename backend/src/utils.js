import { v4 as uuidv4 } from 'uuid';

export function generateId() {
  return uuidv4();
}

export function findById(array, id) {
  return array.find(item => item.id === id);
}

export function findIndexById(array, id) {
  return array.findIndex(item => item.id === id);
}
