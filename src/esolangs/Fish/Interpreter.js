import BaseInterpreter from "../BaseInterpreter.js";
import { Stack } from "../../classes/Stack.js";
import { num, ord, padLines, regexNumber, regexWhitespace } from "../../utils.js";
import Blocker from "../../classes/Blocker.js";

export class FishInterpreter extends BaseInterpreter {
  constructor() {
    super();

    this._oldCode = '';
    this._lines = [];
    this._stacks = new Stack(); // Stack of stacks
    this._registers = new Stack();
    this._x = 0;
    this._y = 0;
    this._mx = 1;
    this._my = 0;
    this._skip = false; // Are we skipping?
    /** @type {"\"" | "'" | null} */
    this._string = null;

    this.wrapCount = 0;
    this.wrapLimit = 500;
    this.detailedErrors = true;
    this.skipStrings = false;
    this.selfModification = true; // Allow 'g' and 'p' commands?

    this._callbackUpdateObject = () => { };
    this._callbackUpdateStack = () => { };
    this._callbackOutput = () => { };
    this._callbackGetch = () => { };
    this._callbackInput = () => { };
    this._callbackUpdateCode = () => { };
  }

  get LANG() { return "Fish"; }

  get x() { return this._x; }
  set x(x) { this._x = x; this._callbackUpdateObject("data", "set", "x", x); }

  get y() { return this._y; }
  set y(y) { this._y = y; this._callbackUpdateObject("data", "set", "y", y); }

  get mx() { return this._mx; }
  set mx(mx) { this._mx = mx; this._callbackUpdateObject("data", "set", "mx", mx); }

  get my() { return this._my; }
  set my(my) { this._my = my; this._callbackUpdateObject("data", "set", "my", my); }


  setCode(code) {
    super.setCode(code);
    this._originalCode = this._code;
    this._lines = this._code.split(/\r\n|\r|\n/g);
    padLines(this._lines, ' '); // Make every line the same length
    this.reset(false);
  }
  getCode() { return this._lines.join('\n'); }
  /** Update stack GUI */
  _updateStackGUI() {
    if (this._updateVisuals) {
      const array = this._stacks._.map(stack => '[' + stack._.join(',') + ']');
      this._callbackUpdateStack(undefined, "update", array);
    }
  }

  reset(revertToOriginalCode = true) {
    if (revertToOriginalCode) this.setCode(this._originalCode);
    this._stacks.dump();
    this._stacks.push(new Stack());
    this._registers.dump();
    this._registers.push(null);
    this.wrapCount = 0;
    this.x = 0;
    this.y = 0;
    this.mx = 1;
    this.my = 0;
    this._updateStackGUI();
    this._callbackUpdateStack("register", "update", this._registers._);
  }

  /** Handle position wtrapping */
  wrapPosition() {
    if (this.y < 0) {
      this.y = this._lines.length - 1;
      this.wrapCount++;
      this.debug(`Wrap y cond 1 : ${this.y}`);
    } else if (this.y >= this._lines.length) {
      this.y = 0;
      this.debug(`Wrap y cond 2 : ${this.y}`);
      this.wrapCount++;
    }
    if (this.x < 0) {
      this.x = this._lines[this.y].length - 1;
      this.wrapCount++;
      this.debug(`Wrap x cond 1 : ${this.x}`);
    } else if (this.x >= this._lines[this.y].length) {
      this.x = 0;
      this.wrapCount++;
      this.debug(`Wrap x cond 2 : ${this.x}`);
    }
  }
  /** Apply movement vector */
  applyMovement() {
    this.x += this.mx;
    this.y += this.my;
  }

  /** Push item to topmost stack */
  pushStack(value) {
    const stack = this._stacks.top();
    stack.push(value);
    this._updateStackGUI();
  }
  /** Pop item from topmost stack */
  popStack() {
    if (this._stacks.top().empty()) throw new Error(`Stack underflow whilst popping`);
    let v = this._stacks.top().pop();
    this._updateStackGUI();
    return v;
  }
  /** Create and return new stack */
  createNewStack() {
    let stack = new Stack();
    this._stacks.push(stack);
    this._registers.push(null);
    this._callbackUpdateStack("register", "push", null);
    this._updateStackGUI();
    return stack;
  }
  /** Remove topmost stack. Return the pop'd stack, or false */
  removeOldStack() {
    if (this._stacks.size() === 0) return false;
    let stack = this._stacks.pop();
    this._registers.pop();
    this._callbackUpdateStack("register", "pop");
    this._updateStackGUI();
    return stack;
  }
  /** Set current register to value */
  setRegister(value) {
    this._registers.pop();
    this._registers.push(value);
    this._callbackUpdateStack("register", "pop");
    this._callbackUpdateStack("register", "push", value);
  }
  async step() {
    const oldWrapCount = this.wrapCount;
    this.wrapPosition();

    // Check wrap count
    if (this.wrapCount !== oldWrapCount) {
      if (this.wrapCount > this.wrapLimit) {
        throw new Error(`RUNTIME ERROR: Wrap limit breached (${this.wrapLimit}) at position (${this.x},${this.y}), movement (${this.mx},${this.my})`);
      } else {
        return true;
      }
    }

    let char = this._lines[this.y][this.x];
    if (!this._skip) {
      // == IN STRING? ==
      if (this._string !== null) {
        if (char === this._string) {
          this._string = null; // Exit string
        } else {
          const charCode = num(char.charCodeAt(0));
          this.pushStack(charCode);
          this.debug(`IN STRING: Push character '${char}' -> ${charCode}`);
        }
      } else {
        // REMOVE WHITESPACE
        if (char === ' ') {
          // NO-OP
        }

        // == ENTER STRING? ==
        else if (char === '"' || char === '\'') {
          this._string = char;
        }

        // == HALT ==
        else if (char === ';') {
          return false;
        }

        // == NUMBER CONSTANT ==
        else if (/[0-9a-f]/.test(char)) {
          const n = parseInt(char, 16);
          this.debug(`NUMBER: ${char} (${n})`);
          this.pushStack(n);
        }

        // == DIRECTION ==
        else if (char in DIRECTIONS) {
          const [mx, my] = DIRECTIONS[char];
          this.mx = mx;
          this.my = my;
        }

        // == RANDOM DIRECTION ==
        else if (char === 'x') {
          const directions = Object.keys(DIRECTIONS);
          const direction = directions[Math.floor(Math.random() * directions.length)];
          this.debug(`RANDOM DIRECTION: '${direction}'`);
          const [mx, my] = DIRECTIONS[direction];
          this.mx = mx;
          this.my = my;
        }

        // == MIRRORS ==
        else if (char in MIRRORS) {
          const [mx, my] = MIRRORS[char](this.mx, this.my);
          this.mx = mx;
          this.my = my;
        }

        // == PORTAL ==
        else if (char === '.') {
          let y = num(this.popStack()), x = num(this.popStack());
          this.debug(`PORTAL: move to (${x}, ${y})`);
          this.x = x;
          this.y = y;
        }

        // == TRAMPOLINE ==
        else if (char === '!') {
          this.debug(`TRAMPOLINE: skip instruction`);
          this._skip = true;
        }

        // == UNCONDITIONAL TRAMPOLINE ==
        else if (char === '?') {
          const v = num(this.popStack()), skip = v === 0;
          this.debug(`COND TRAMPOLINE: skip instruction: ${skip}`);
          this._skip = skip;
        }

        // == MATHS ==
        else if (char === '+' || char === '-' || char === '*') {
          let a = num(this.popStack()), b = num(this.popStack()), ans;
          if (char === '*') ans = b * a;
          else if (char === '-') ans = b - a;
          else ans = b + a;
          this.debug(`MATHS: ${b} ${char} ${a} = ${ans}`);
          this.pushStack(ans);
        }

        // == MATHS : DIVISION ==
        else if (char === ',' || char === '%') {
          let a = num(this.popStack()), b = num(this.popStack());
          if (a === 0) throw new Error(`Division by zero: ${b} ${char} ${a}`);
          let ans = char === '%' ? b % a : b / a;
          this.debug(`MATHS: ${b} ${char} ${a} = ${ans}`);
          this.pushStack(ans);
        }

        // == COMPARISON ==
        else if (char === '=' || char === '(' || char === ')') {
          let a = num(this.popStack()), b = num(this.popStack()), ans;
          if (char === '(') ans = b > a;
          else if (char === ')') ans = b < a;
          else ans = b === a;
          ans = ans ? 1 : 0;
          this.debug(`COMPARISON: ${b} ${char} ${a} = ${ans}`);
          this.pushStack(ans);
        }

        // == DUPLICATE ==
        else if (char === ':') {
          let v = this.popStack();
          this.pushStack(v);
          this.pushStack(v);
          this.debug(`DUPLICATE '${v}'`);
        }

        // == POP ==
        else if (char === '~') {
          let x = this.popStack();
          this.debug(`POP '${x}'`);
        }

        // == SWAP 2 ==
        else if (char === '$') {
          let a = this.popStack(), b = this.popStack();
          this.pushStack(a);
          this.pushStack(b);
          this.debug(`SWAP 2: [ ${b} ${a} ] -> [ ${a} ${b} ]`);
        }

        // == SWAP 3 ==
        else if (char === '@') {
          let a = this.popStack(), b = this.popStack(), c = this.popStack();
          this.pushStack(a);
          this.pushStack(c);
          this.pushStack(b);
          this.debug(`SWAP 3: [ ${c} ${b} ${a} ] -> [ ${a} ${c} ${b} ]`);
        }

        // == ROTATE RIGHT ==
        else if (char === '}') {
          if (this._stacks.top().empty()) throw new Error(`Rotate right: stack underflow`);
          let x = this._stacks.top()._.pop();
          this._stacks.top()._.unshift(x);
          this._updateStackGUI();
          this.debug(`ROTATE RIGHT ('${x}')`);
        }

        // == ROTATE LEFT ==
        else if (char === '{') {
          if (this._stacks.top().empty()) throw new Error(`Rotate right: stack underflow`);
          let x = this._stacks.top()._.shift();
          this._stacks.top()._.push(x);
          this._updateStackGUI();
          this.debug(`ROTATE LEFT ('${x}')`);
        }

        // == REVERSE ==
        else if (char === 'r') {
          this._stacks.top()._.reverse();
          this._updateStackGUI();
          this.debug("REVERSE STACK");
        }

        // == LENGTH ==
        else if (char === 'l') {
          let l = this._stacks.top().size();
          this.debug(`STACK SIZE: ${l}`);
          this.pushStack(l);
        }

        // == CREATE NEW STACK ==
        else if (char === '[') {
          let n = Math.floor(num(this.popStack()));
          let oldStack = this._stacks.top(), newStack = this.createNewStack();
          if (n !== 0) {
            newStack._ = oldStack._.splice(oldStack._.length - n, n);
            this._updateStackGUI();
          }
          this.debug(`NEW STACK: transfer ${n} items`);
        }

        // == REMOVE CURRENT STACK ==
        else if (char === ']') {
          let oldStack = this.removeOldStack();
          if (this._stacks.size() === 0) {
            this.createNewStack(); // Make empty stack. ALways make sure there is one stack on the stack
          } else {
            let topStack = this._stacks.top();
            if (oldStack._.length !== 0) {
              topStack._.push(...oldStack._);
              this._updateStackGUI();
            }
          }
          this.debug(`REMOVE STACK`);
        }

        // == OUTPUT ==
        else if (char === 'o' || char === 'n') {
          let x = num(this.popStack()),
            o = str(char === 'n' ? x : String.fromCharCode(x));
          this._callbackOutput(o);
          this.debug(`OUTPUT ${char}: ${x} , '${o}'`);
        }

        // == INPUT: GETCH ==
        else if (char === 'i') {
          const blocker = new Blocker();
          this._callbackGetch(blocker);
          const char = await blocker.block(), charCode = ord(char);
          this.debug(`INPUT: '${char}' = ${charCode}`);
          this.pushStack(charCode);
        }

        // == REGISTER ==
        else if (char === '&') {
          let r = this._registers.top();
          if (r === null) { // Register is empty
            let x = this.popStack();
            this.debug(`REGISTER: set to ${x}`);
            this.setRegister(x);
          } else {
            this.setRegister(null);
            this.pushStack(r);
            this.debug(`REGISTER: push ${r} to stack`);
          }
        }

        // == GET ==
        else if (this.selfModification && char === 'g') {
          // throw new Error(`IMPLEMENTATION ERROR: operator 'g' is not implemented`);
          let y = num(this.popStack()), x = num(this.popStack()), n;
          try {
            n = ord(this._lines[y][x]); // Attempt to get character at specifide position...
          } catch (e) {
            n = 0; // If cannot, push 0 to the stack
          }
          this.pushStack(n);
        }

        // == PUT ==
        else if (this.selfModification && char === 'p') {
          // throw new Error(`IMPLEMENTATION ERROR: operator 'p' is not implemented`);
          let y = num(this.popStack()), x = num(this.popStack()), val = num(this.popStack()), chr = str(String.fromCharCode(val));
          try {
            if (y < 0 || y >= this._lines.length) throw new Error(`Y position '${y}' is out of bounds`);
            if (x < 0 || x >= this._lines[y].length) throw new Error(`X position '${x}' is out of bounds`);
            this._lines[y] = strReplaceAt(this._lines[y], x, chr);
          } catch (e) {
            throw new Error(`PUT: unable to place value '${val}' at (${x},${y}):\n${e}`);
          }
          this._callbackUpdateCode(x, y, chr);
        }

        else throw new Error(`Invalid syntax.`);
      }

      // Add on movement vector
      this.applyMovement();
    } else {
      this.debug(`SKIP char @ (${this.x},${this.y}) : '${char}'`);
      if (this._string === null && this.skipStrings && (char === '"' || char === '\'')) this._string = char; // Recognise that we are in a string if we aee to skip it
      else if (this._string !== null && this.skipStrings && (char === '"' || char === '\'')) this._string = null;
      this._skip = this._string !== null && this.skipStrings ? this._skip : false;
      this.applyMovement();
    }

    return true;
  }

  async interpret() {
    try {
      await super.interpret();
    } catch (e) {
      console.error(e);
      if (this.detailedErrors) {
        throw new Error(`Error at position (${this.x}, ${this.y}) - '${this._lines[this.y][this.x]}':\n${e}`);
      } else {
        throw new Error(`something smells fishy...`);
      }
    }
  }
}

/** Object mapping to arrays of new movment vectors */
const DIRECTIONS = {
  ">": [1, 0],
  "<": [-1, 0],
  "^": [0, -1],
  "v": [0, 1],
};
const MIRRORS = {
  "/": (x, y) => ([-y, -x]),
  "\\": (x, y) => ([y, x]),
  "|": (x, y) => ([-x, y]),
  "_": (x, y) => ([x, -y]),
  "#": (x, y) => ([-x, -y]),
};

export default FishInterpreter;