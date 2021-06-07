import { TravelState } from "./states.js";
import { regexNumber } from "../../utils.js";

export const UP = [0, -1];
export const DOWN = [0, 1];
export const LEFT = [-1, 0];
export const RIGHT = [1, 0];
export const DIRECTIONS = [UP, RIGHT, DOWN, LEFT];

/**
 * Maps operator symbols to a function
 * Functions take two numerical values
 */
export const operatorMap = (function() {
  const symbols = {
    "+": (x, y) => x + y, // Addition
    "-": (x, y) => x - y, // Subtraction
    "*": (x, y) => x * y, // Multiply
    "/": (x, y) => x / y, // Division
    "^": (x, y) => Math.pow(x, y), // Exponent
    "%": (x, y) => x % y, // Modulus

    "o": (x, y) => x | y, // Logical OR
    "x": (x, y) => x ^ y, // Logical XOR
    "&": (x, y) => x & y, // Logical AND

    "=": (x, y) => x === y, // x equal y?
    "!": (x, y) => x !== y, // x not equal y?
    ">": (x, y) => x > y, // x greater than y?
    "G": (x, y) => x >= y, // x greater than or equal to y?
    "<": (x, y) => x < y, // x less than y?
    "L": (x, y) => x <= y, // x less than or equal to y?
  };
  symbols["÷"] = symbols['/'];
  symbols["≠"] = symbols['!'];
  symbols["≤"] = symbols.L;
  symbols["≥"] = symbols.G;
  return symbols;
})();

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

/** Detect next state from character */
export const getNextState = (dot, char) => new TravelState(dot).next(char);

/** Is the given character an inversion character?
 * @param {Char} char
*/
export function isInversionChar(char) {
  if (typeof char !== 'object') return false;
  if (char.value !== '!') return false;
  if (char.isOperator) return false;
  return true;
}