import { arrayAdd } from "../../utils.js";
import { TravelState } from "./states.js";
import { DIRECTIONS, DOWN, getDirectionString, LEFT, RIGHT, UP } from "./utils.js";

var currentID = 0;
export class Dot {
  constructor(interpreter, x = 0, y = 0, dir = undefined) {
    this._id = currentID++;
    this._ = interpreter;
    this.pos = [x, y];
    this._spawnPos = [...this.pos]; // Save starting position
    this.dir = dir || this._calcDirection();
    this.halted = false;
    this.value = 0;
    this.alive = true; // If alive=false, then this Dot will be removed by _
    this.state = new TravelState(this);
  }

  /**
   * Calculate dot's direction from surrounding paths
   */
  _calcDirection() {
    let x = /[\\\/\*^v<>\+]/;
    for (let dir of DIRECTIONS) {
      let loc = arrayAdd(this.pos, dir), char = this._.get(...loc);
      if (char === undefined) continue;
      if (char === '-' && (dir === RIGHT || dir === LEFT)) return dir;
      if (char === '|' && (dir === UP || dir === DOWN)) return dir;
      if (x.test(char)) return dir;
    }
  }

  move() {
    if (!this.halted) {
      this.pos[0] += this.dir[0];
      this.pos[1] += this.dir[1];
      return true;
    } else return false;
  }

  toDisplayString() {
    return `"${this.value}" (${this.pos}) ${getDirectionString(this.dir)}`;
  }

  toString() {
    return `<Dot pos=(${this.pos}) dir=(${this.dir})>`;
  }

  next() {
    if (this.alive) {
      const char = this._.get(...this.pos);

      if (char === undefined) {
        this._.debugWarn(`${this.toString()} : position out of bounds`);
        this.alive = false;
        return;
      }

      this.state = this.state.next(char);

      // if (char === ' ' && !(this.state instanceof PrintState)) {
      //   this._.debugWarn(`${this.toString()} : whitespace in non-print state`);
      //   this.alive = false;
      // }
    }
  }

  /** Execute dot. Return: are we still alive? */
  run() {
    if (this.alive) {
      let char = this._.get(...this.pos);

      if (char === undefined) {
        this._.debugWarn(`${this.toString()} : position out of bounds`);
        this.alive = false;
        return;
      }

      this.state.run(char);

      char = this._.get(...this.pos);
      if (char === undefined) {
        this._.debugWarn(`${this.toString()} : position out of bounds`);
        this.alive = false;
        return;
      }
      // else if (char === ' ' && !(this.state instanceof PrintState)) {
      //   this._.debugWarn(`${this.toString()} : whitespace in non-print state`);
      //   this.alive = false;
      // }
    }
  }

}

export default Dot;