import { arrayAdd } from "../../utils.js";
import { State, TravelState, PrintState } from "./states.js";
import { DIRECTIONS, getDirectionString, isMovingHorizontally, isMovingVertically } from "./utils.js";

var currentID = 0;
export class Dot {
  constructor(interpreter, x = 0, y = 0, dir = undefined) {
    this._uuid = currentID++; // INTERNAL UNIQUE ID
    this._ = interpreter;

    this.pos = [x, y];
    this._spawnPos = [...this.pos]; // Save starting position
    this.dir = dir || this._calcDirection();
    this.value = 0;
    this.id = 0;
    this.alive = true; // If alive=false, then this Dot will be removed by manager
    this.state = new TravelState(this);
    this.stack = []; // Stack to store teleportation ("warp") position history
  }

  /**
   * Calculate dot's direction from surrounding paths
   */
  _calcDirection() {
    let x = /[\\\/\*^v<>\+]/;
    for (let dir of DIRECTIONS) {
      let loc = arrayAdd(this.pos, dir), char = this._.get(...loc);
      if (char === undefined) continue; // Location does not exist?
      if (char.value === '-' && isMovingHorizontally(dir)) return dir;
      if (char.value === '|' && isMovingVertically(dir)) return dir;
      if (x.test(char.value)) return dir;
    }
    this.alive = false;
  }

  move() {
    if (!this.halted) {
      this.pos[0] += this.dir[0];
      this.pos[1] += this.dir[1];
      return true;
    } else return false;
  }

  toDisplayString() {
    // return `"${this.value}" (${this.pos}) ${this.alive ? getDirectionString(this.dir) : '<DEAD>'}`;
    return this.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  toString() {
    return `<Dot#${this._uuid} pos=(${this.pos}) dir=(${this.dir}) val=${this.value} id=${this.id} state=${this.state ? this.state.constructor.name : 'undefined'}>`;
  }

  next() {
    if (this.alive) {
      const char = this._.get(...this.pos);

      if (char === undefined) {
        this._.debugWarn(`${this.toString()} : position out of bounds`);
        this.alive = false;
        return;
      }

      if (!(this.state instanceof State)) throw new Error(`${this.toString}: Invalid state ${this.state} (in next)`);
      this.state = this.state.next(char);

      if (char.value === ' ' && !(this.state instanceof PrintState)) {
        this._.debugWarn(`${this.toString()} : whitespace in non-print state`);
        this.alive = false;
      }
    }
  }

  /** Execute dot. Return: are we still alive? */
  async run() {
    if (this.alive) {
      let char = this._.get(...this.pos);

      if (char === undefined) {
        this._.debugWarn(`${this.toString()} : position out of bounds`);
        this.alive = false;
        return;
      }

      if (!(this.state instanceof State)) throw new Error(`${this.toString}: Invalid state ${this.state} (in run)`);
      await this.state.run(char);

      char = this._.get(...this.pos);
      if (char === undefined) {
        this._.debugWarn(`${this.toString()} : position out of bounds`);
        this.alive = false;
        return;
      } else if (char.value === ' ' && !(this.state instanceof PrintState)) {
        this._.debugWarn(`${this.toString()} : whitespace in non-print state`);
        this.alive = false;
      }
    }
  }

}

export default Dot;