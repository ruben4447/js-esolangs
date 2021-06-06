export const UP = [0, -1];
export const DOWN = [0, 1];
export const LEFT = [-1, 0];
export const RIGHT = [1, 0];
export const DIRECTIONS = [UP, RIGHT, DOWN, LEFT];

export const isMovingHorizontally = a => a[0] !== 0 && a[1] === 0;
export const isMovingVertically = a => a[0] === 0 && a[1] !== 0;

export function getDirectionString(a) {
  if (a[0] === 0 && a[1] < 0) return "UP";
  if (a[0] === 0 && a[1] > 0) return "DOWN";
  if (a[0] < 0 && a[1] === 0) return "LEFT";
  if (a[0] > 0 && a[1] === 0) return "RIGHT";
  return "?";
}

export const positionsEqual = (a, b) => a[0] === b[0] && a[1] === b[1];