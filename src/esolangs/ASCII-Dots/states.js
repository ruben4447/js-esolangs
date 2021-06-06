import Dot from "./Dot.js";
import { arrayAdd } from "../../utils.js";
import { DIRECTIONS, DOWN, isMovingHorizontally, isMovingVertically, LEFT, positionsEqual, RIGHT, UP } from "./utils.js";

class State {
  constructor(dot) {
    this._ = dot._;
    this.dot = dot;
  }

  /** Get next state */
  next(char) { throw new Error(`Requires overriding`); }

  /** Run state given a character */
  run(char) { throw new Error(`Requires overriding`); }
}

/** When a dot is travelling (default) */
export class TravelState extends State {
  constructor(dot) {
    super(dot);
  }

  next(char) {
    if (char === ' ') {
      this.dot.alive = false;
    } else if (char === '&') {
      this.dot.alive = false; // Intentional death
    } else {
      return this;
    }
  }

  run(char) {
    // If still on starting pos...
    if (this.dot.pos[0] === this.dot._spawnPos[0] && this.dot.pos[1] === this.dot._spawnPos[1]) {
      this._.debug(`${this.dot.pos} is spawn position`);
    }

    // DOT
    else if (char === '.' || char === '•') {
      throw new Error(`Collision with dot at (${this.dot.pos}) : '${char}'`);
    }

    // PATHS
    else if (char === '-') {
      if (isMovingVertically(this.dot.dir)) throw new Error(`DirectionError: Dot travelling vertically ([${this.dot.dir}]) canot travel horizontally`);
    } else if (char === '|') {
      if (isMovingHorizontally(this.dot.dir)) throw new Error(`DirectionError: Dot travelling horizontally ([${this.dot.dir}]) canot travel vertically`);
    } else if (char === '+') {
      // Continue moving...
    } else if (char === '\\') {
      this.dir = [this.dot.dir[1], this.dot.dir[0]]; // (x,y) -> (y,x)
    } else if (char === '/') {
      this.dir = [-this.dot.dir[1], -this.dot.dir[0]]; // (x,y) -> (-y,-x)
    } else if (char === '>') {
      if (isMovingVertically(this.dot.dir)) this.dot.dir = RIGHT; // Move right if moving vertically
    } else if (char === '<') {
      if (isMovingVertically(this.dot.dir)) this.dot.dir = LEFT; // Move left if moving vertically
    } else if (char === '^') {
      if (isMovingHorizontally(this.dot.dir)) this.dot.dir = UP; // Move up if moving horizontally
    } else if (char === 'v') {
      if (isMovingHorizontally(this.dot.dir)) this.dot.dir = DOWN; // Move down if moving horizontally
    } else if (char === '(') {
      this.dot.dir = RIGHT;
    } else if (char === ')') {
      this.dot.dir = LEFT;
    } else if (char === '*') {
      // Create copies travelling in all directions other than original
      let reverseDir = [-this.dot.dir[0], -this.dot.dir[1]];
      for (let dir of DIRECTIONS) {
        if (positionsEqual(dir, reverseDir)) continue;
        let childPos = arrayAdd(this.dot.pos, dir), char = this._.get(...childPos);
        if (char !== undefined && char !== ' ') {
          let child = new Dot(this._, childPos[0], childPos[1], dir);
          child.move();
          this._._dots.push(child);
        }
      }
    }

    if (this.dot.alive) this.dot.move();
  }
}