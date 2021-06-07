import Dot from "./Dot.js";
import { arrayAdd, num } from "../../utils.js";
import { DIRECTIONS, DOWN, getNextState, isMovingHorizontally, isMovingVertically, LEFT, positionsEqual, RIGHT, UP } from "./utils.js";
import { SingletonLibInnerWarpChar } from "./chars.js";

export class State {
  constructor(dot) {
    this._ = dot._;
    this.dot = dot;
  }

  /** Get next state */
  next(char) { throw new Error(`Requires overriding`); }

  /** Run state given a character */
  async run(char) { throw new Error(`Requires overriding`); }
}

/** When a dot is travelling (default) */
export class TravelState extends State {
  constructor(dot) {
    super(dot);
  }

  next(char) {
    if (char.value === ' ') {
      this.dot.alive = false;
    } else if (char.value === '&' && !char.isOperator()) {
      this.dot.alive = false; // Intentional death
    } else if (char.isTilde()) {
      return new TildeState(this.dot);
    } else if (char.value === '#') {
      return new ValueState(this.dot);
    } else if (char.value === '@') {
      return new IdState(this.dot);
    } else if (char.value === '$') {
      return new PrintState(this.dot);
    } else if (["{","}","[","]"].indexOf(char.value) !== -1 && isMovingVertically(this.dot.dir)) {
      this.dot.alive = false;
      this._.debugWarn(`${this.dot.toString()} : cannot enter bracketed operator while moving vertically`);
    } else if (char.isSquareBracket()) {
      return new SquareBracketState(this.dot);
    } else if (char.isCurlyBracket()) {
      return new CurlyBracketState(this.dot);
    } else if (char.value === '-' && isMovingVertically(this.dot.dir)) {
      this.dot.alive = false;
      this._.debugWarn(`${this.dot.toString()} : cannot move along horizontal pipe whilst moving vertically`);
    } else if (char.value === '|' && isMovingHorizontally(this.dot.dir)) {
      this.dot.alive = false;
      this._.debugWarn(`${this.dot.toString()} : cannot move along vertically pipe whilst moving horizontally`);
    } else if (char.value === ':' && this.dot.value === 0) {
      this._.debug(`${this.dot.toString()} : encountered ':' and value is 0`);
      this.dot.alive = false;
    } else if (char.value === ';' && this.dot.value === 1) {
      this._.debug(`${this.dot.toString()} : encountered ';' and value is 1`);
      this.dot.alive = false;
    } else {
      return this;
    }
  }

  async run(char) {
    if (char.value === '\\') {
      this.dir = [this.dot.dir[1], this.dot.dir[0]]; // (x,y) -> (y,x)
    } else if (char.value === '/') {
      this.dir = [-this.dot.dir[1], -this.dot.dir[0]]; // (x,y) -> (-y,-x)
    } else if (char.value === '>') {
      if (isMovingVertically(this.dot.dir)) this.dot.dir = RIGHT; // Move right if moving vertically
    } else if (char.value === '<') {
      if (isMovingVertically(this.dot.dir)) this.dot.dir = LEFT; // Move left if moving vertically
    } else if (char.value === '^') {
      if (isMovingHorizontally(this.dot.dir)) this.dot.dir = UP; // Move up if moving horizontally
    } else if (char.value === 'v') {
      if (isMovingHorizontally(this.dot.dir)) this.dot.dir = DOWN; // Move down if moving horizontally
    } else if (char.value === '(') {
      this.dot.dir = RIGHT;
    } else if (char.value === ')') {
      this.dot.dir = LEFT;
    } else if (char.value === '*') {
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
    } else if (char instanceof SingletonLibInnerWarpChar) {
      if (this.dot.stack.length === 0) throw new Error(`${this.toString()} : Dot tried to exit library it never entered.`);
      this.dot.pos = this.dot.stack.pop(); // Set new position form warp history
    } else if (char.isWarp()) {
      if (char.isSingletonLibWarp()) {
        this.dot.stack.push(this.dot.pos);
      }
      let destination = char.dstLoc;
      if (destination === null) throw new Error(`${this.toString()} : warp encountered at ${this.dot.pos} has no destination`);
      this.dot.pos = destination;
    }

    if (this.dot.alive) this.dot.move();
  }
}

export class ValueState extends State {
  constructor(dot) {
    super(dot);
    this.firstDigit = true;
    this.ascii = false; // ASCII i/o mode?
    this.negated = false;
  }

  next(char) {
    if (char.isNumber() || char.value === 'a' || char.value === '?') {
      return this;
    } else {
      return getNextState(this.dot, char);
    }
  }

  async run(char) {
    if (char.isNumber()) {
      if (this.firstDigit) {
        this.dot.value = num(char.value);
        this.firstDigit = false;
      } else {
        this.dot.value = this.dot.value * 10 + num(char.value); // Append digit so mathematically it forms a correct number
      }
    } else if (char.value === 'a') {
      this.ascii = true;
    } else if (char.value === '?') {
      this.dot.value = await this._.getch(this.ascii);
    }

    if (this.dot.alive) this.dot.move();
  }
}

export class IdState extends State {
  constructor(dot) {
    super(dot);
    this.firstDigit = true;
    this.ascii = false;
    this.settingId = false;
  }

  next(char) {
    if (char.isNumber() || char.value === 'a' || char.value === '?') {
      return this;
    } else if (this.settingId) {
      return getNextState(this.dot, char);
    } else if (["[", "]", "{", "}"].indexOf(char.value) !== -1) {
      if (isMovingVertically(this.dot.dir)) {
        this.dot.alive = false;
        this._.debugWarn(`${this.dot.toString()} : cannot enter bracketed operator whilst travelling vertically`);
      } else {
        return this;
      }
    } else if (char.isSquareBracket()) {
      return new SquareBracketState(this.dot, true); // id mode = true
    } else if (char.isCurlyBracket()) {
      return new CurlyBracketState(this.dot, true); // id mode = true
    } else if (char.isTilde()) {
      return new TildeState(this.dot, true); // id mode = true
    } else if (char.value === ':') {
      if (this.dot.value === 0) {
        this.dot.alive = false;
        this._.debugWarn(`${this.dot.toString()} : encountered ':' and value=0`);
      } else {
        return new TravelState(this.dot);
      }
    } else if (char.value === ';') {
      if (this.dot.value === 1) {
        this.dot.alive = false;
        this._.debugWarn(`${this.dot.toString()} : encountered ';' and value=1`);
      } else {
        return new TravelState(this.dot);
      }
    } else {
      return getNextState(this.dot, char);
    }
  }
  

  async run(char) {
    if (char.isNumber()) {
      this.settingId = true;
      if (this.firstDigit) {
        this.dot.id = num(char.value);
        this.firstDigit = false;
      } else {
        this.dot.id = this.dot.id * 10 + num(char.value);
      }
    } else if (char.value === 'a') {
      this.ascii = true;
    } else if (char.value === '?') {
      this.dot.id = await this._.getch(this.ascii);
    }
  }
}

export class PrintState extends State {
  constructor(dot, newline = true) {
    super(dot);
    this.newline = newline === true;
    this.ascii = false;
    this.exit = false; // Shall we exit this state on next step?
  }

  next(char) {
    if (this.exit) {
      return getNextState(this.dot, char);
    } else if (["$", "_", "a", "#", "@"].indexOf(char.value) !== -1) {
      return this;
    } else if (char.value === ' ') {
      this.dot.alive = false;
      this._.debugWarn(`${this.dot.toString()} : encountered whitespace, exiting...`);
    } else if (char.value === '"' || char.value === '\'') {
      return new PrintStringState(this.dot, char.value, this.newline);
    } else {
      return getNextState(this.dot, char);
    }
  }

  async run(char) {
    if (char.value === '_') {
      this.newline = false; // Disable newline
    } else if (char.value === 'a') {
      this.ascii = true;
    } else if (char.value === '#') {
      this._print(this.dot.value); // Prnt value
    } else if (char.value === '@') {
      this._print(this.dot.id); // Print ID
    }

    if (this.dot.alive) this.dot.move();
  }

  _print(data) {
    data = num(data);
    if (this.ascii) data = String.fromCharCode(data);
    if (this.newline) data += '\n';
    this._.print(data);
    this.exit = true; // Edit state after printing
  }
}

export class PrintStringState extends State {
  constructor(dot, quote, newline = true) {
    super(dot);
    if (quote !== '"' && quote !== '\'') throw new Error(`${this.dot.toString()} : PrintStringState : invalid quote value '${quote}'`);
    this.quote = quote;
    this.newline = newline;
    this.text = '';
  }

  next(char) {
    if (this.exit) {
      return getNextState(this.dot, char);
    } else {
      return this; // Only exit state if printed content
    }
  }

  async run(char) {
    if (char.value === this.quote) { // End string?
      if (this.newline) this.text += '\n';
      this._.print(this.text);
      this.exit = true;
    } else {
      this.text += char.value; // Add to text to print
    }

    if (this.dot.alive) this.dot.move();
  }
}