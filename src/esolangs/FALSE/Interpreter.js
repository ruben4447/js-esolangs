import BaseInterpreter from "../BaseInterpreter.js";
import Blocker from "../../classes/Blocker.js";
import { linearPosToLineCol, createEnum, underlineStringPortion, regexNumber, atop, regexWhitespace, scanNumber, num, scanString, getMatchingBracket, highlightStringPortion, escapeHtml, regexLetter } from "../../utils.js";
import { scanComment } from "./utils.js";

export class FalseInterpreter extends BaseInterpreter {
  constructor() {
    super();

    this._ptrs = []; // Array of positions in each function
    /** @type {{ value: any, type: number }[]} */
    this._stack = [];
    /** @type {{ [name: string]: { type: string, value: string } }} */
    this._vars = {}; // Each function has its own scope
    /** @type {string[]} */
    this._call = []; // Stack of functions. The base program being executed is [0]
    /** @type {{ depth: number, cond: string, body: string, inCond: boolean }[]} */
    this._whiles = []; // Keep track of active while loops.

    this.numbersAsInts = true; // Use parseInt() ?
    this.multicharVarNames = false; // Allow var names longer than a single char?

    /** @type {(name: string | undefined, type: "push" | "pop" | "empty" | "update", value?: any, title?: string) => void} */
    this._callbackUpdateStack = () => { };
    this._callbackUpdateObject = () => { };
    this._callbackOutput = () => { };
    this._callbackGetch = () => { };
    this._callbackFlush = () => { };
  }

  get LANG() { return "FALSE"; }

  /** Get current top index (index of current function in this._call, current ptr in this._ptrs, etc...). Use this._call as an anchor. */
  get tindex() { return this._call.length - 1; }

  /** Get pointer in current function. */
  get ptr() { return this._ptrs[this._ptrs.length - 1]; }
  set ptr(v) { this._ptrs[this._ptrs.length - 1] = v; this._updateCallstackVisuals(); }
  /** Get character at ptr in current function */
  get char() { return this._call[this._ptrs[this._ptrs.length - 1]]; }

  setCode(code) {
    super.setCode(code);
    this.reset();
  }

  reset() {
    this._ptrs.length = 0;
    this._stack.length = 0;
    this._callbackUpdateStack(undefined, "empty");
    this._vars = {};
    this._call.length = 0;
    this._callbackUpdateStack("call", "empty");
    this.pushCallStack(this._code);
    this._whiles.length = 0;
  }

  /** Update callStack visuals */
  _updateCallstackVisuals() {
    if (this._updateVisuals) {
      const arr = [];
      for (let i = 0; i < this._call.length; i++) {
        let str = highlightStringPortion(this._call[i], this._ptrs[i], 1);
        arr.push(str);
      }
      this._callbackUpdateStack("call", "update", arr);
    }
  }

  /**
   * Push item to the call stack
   * @param {string} lambda the code to be executed 
   */
  pushCallStack(lambda) {
    this.debug("[ ==== PUSH CALL STACK ====]");
    this._call.push(lambda);
    this._ptrs.push(0);
    this._updateCallstackVisuals();
  }
  /**
   * Pop a "call state" - finished executing the current function.
   * @returns {boolean} was anything popped?
   */
  popCallStack() {
    if (this._call.length > 1) {
      this._call.pop();
      this._ptrs.pop();
      this._updateCallstackVisuals();
      this.debug("[ ==== POP CALL STACK ====]");
      return true;
    } else return false;
  }

  /** Generate traceback from call stack */
  generateTraceback() {
    let arr = [];
    for (let i = this._call.length - 1; i >= 0; i--) {
      let { line, col } = linearPosToLineCol(this._call[i], this._ptrs[i]);
      let prefix = `at ${this._ptrs[i]} ${line + 1}:${col + 1} '${this._call[i][this._ptrs[i]]}' :  `;
      let str = underlineStringPortion(this._call[i], this._ptrs[i], 1, prefix);
      arr.push(str);
    }
    return arr;
  }
  /**
   * Set contents of a variable
   * @param {string} name Variable name
   * @param {any} value Variable value
   * @param {number} type
   */
  setVar(name, value, type) {
    this._vars[name] = { value, type };
    this._callbackUpdateObject("vars", "set", name, value);
  }
  /** Debug - add tabs beforehand to show fn exec level */
  debug(...args) {
    let c = this.tindex;
    if (c < 0) c = 0;
    super.debug(`%c${c}%c`, 'background:lime;color:black', '', '  '.repeat(c), ...args);
  }
  debugWarn(...args) {
    let c = this.tindex;
    if (c < 0) c = 0;
    super.debug(`%c${c}%c`, 'background:lime;color:black', '', '  '.repeat(c), ...args);
  }
  /** Push value to the stack */
  pushStack(value, type) {
    if (type === TYPE.Number && this.numbersAsInts) value = Math.floor(value); // Cast num->int
    this._stack.push({ value, type });
    this._callbackUpdateStack(undefined, "push", value, TYPE[type]);
  }
  /**
   * Pop value from stack. Handles type comparson and/or casting.
   * @param {number} expectedType type expected. If the pop'd value is not of this type, attempt casting
   * @return {{ value: any, type: number }}
   */
  popStack(expectedType) {
    if (this._stack.length === 0) throw new Error(`RUNTIME ERROR: Stack underflow while trying to pop ${TYPE[expectedType]} from stack`);
    this._callbackUpdateStack(undefined, "pop");
    let { type, value } = this._stack.pop();

    if (expectedType === undefined || expectedType === type) {
      return { value, type };
    } else if (expectedType === TYPE.Number) {
      if (type === TYPE.Boolean) {
        this.debugWarn(`TYPE CAST boolean to number`);
        value = value ? - 1 : 0;// bool->number
        return { value, type };
      }
    } else if (expectedType === TYPE.Boolean) {
      if (type === TYPE.Number) {
        this.debugWarn(`TYPE CAST number to boolean`);
        value = value !== 0; // number->bool (0 is false)
        return { value, type };
      }
    }

    throw new TypeError(`Expected ${TYPE[expectedType]} but got ${TYPE[type]} - "${value}"`);
  }

  async step() {
    const ti = this.tindex;
    if (this.ptr >= this._call[ti].length) {
      // console.log(`ti ${ti} : ptr ${this._ptrs[ti]}; code (${this._call[ti].length}) "${this._call[ti]}"; pop`);
      const val = this.popCallStack(); // Will only return `false` if in base function

      const ti = this.tindex, whileLoop = atop(this._whiles);
      if (whileLoop && whileLoop.depth === ti) { // In a while loop...
        this.debug(whileLoop);
        if (whileLoop.inCond) { // Finished evaluating conditional part
          let bool;
          try {
            bool = this.popStack(TYPE.Boolean);
          } catch (e) {
            console.error(e);
            throw new Error(`Error while evaluating WHILE LOOP conditional lambda...\n${e}`);
          }
          this.debug(`While Loop: condition = ${bool.value}`);
          if (bool.value) { // Run while loop again?
            whileLoop.inCond = false; // Move to body
            this.pushCallStack(whileLoop.body); // Evaluate body
          } else {
            // If condition is false, body while not run. This is because ptr[ti] is still at '#', so we will simply jump there.
            whileLoop.body = "";
            whileLoop.cond = "";
          }
        } else { // FInished evaluating body
          this.debug(`While Loop: finished body.`);
          this.pushCallStack(whileLoop.cond); // Push condition
          whileLoop.inCond = true;
        }
      }
      return val;
    }

    let skip = 0;
    while (this._call[ti][this.ptr + skip].match(regexWhitespace)) skip++; // Consume Whitespace
    console.log(skip)
    if (skip !== 0) this.ptr += skip; // Skip past whitespace
    const ptr = this.ptr, char = this._call[ti][ptr];

    // == NUMBER LITERAL ==
    if (char.match(regexNumber)) {
      // Extract number
      const x = scanNumber(this._call[ti].substr(this.ptr));
      this.pushStack(x.n, TYPE.Number);
      this.debug(`PUSH NUMBER: Push number literal '${x.n}'`);
      this.ptr += x.length;
    }

    // == STRING LITERAL : PRINT ==
    else if (char === '"') {
      const code = this._call[ti].substr(++this.ptr), // Skip past opening '"' as this will cause scanString to immediatly exit
        obj = scanString(code, ['"']);
      this.ptr += obj.length;

      // Has string been terminated wth a closing '"' ?
      if (this._call[ti][this.ptr] !== '"') throw new Error(`'"' expected`);
      else this.ptr++; // Increment past final '"'

      this._callbackOutput(obj.str);
      this.debug(`STRING LITERAL: (${obj.length}) "${obj.str}"`);
    }

    // == STRING LITERAL : VARIABLE
    else if (!this.multicharVarNames && /[a-z]/.test(char)) {
      this.debug(`ALPHA: '${char}'`);
      this.pushStack(char, TYPE.String);
      this.ptr++;
    } else if (this.multicharVarNames && regexLetter.test(char)) {
      let varName = '', ptr = this.ptr;
      while (regexLetter.test(this._call[ti][ptr])) { varName += this._call[ti][ptr]; ptr++; }
      this.debug(`ALPHA: '${varName}'`);
      this.pushStack(varName, TYPE.String);
      this.ptr = ptr;
    }

    else {
      switch (char) {
        // == INLINE ASSEMBLY ==
        case '`':
          throw new Error(`IMPLEMENTATION EXCEPTION: Inline assembly is not supported`);

        // == COMMENT ==
        case '{': {
          // Jump to end of comment
          const end = scanComment(this._call[ti], this.ptr);
          if (end === -1) {
            // Effectively finish execution, as rest of program is a comment
            this.debugWarn("NO CLOSING COMMENT - FINISH EXECUTION");
            while (this.popCallStack());
            return false;
          }
          this.ptr = end + 1; // 'end' is index of '}' so + 1
          break;
        }

        // == CHAR CODE ==
        case '\'': {
          const char = this._call[ti][++this.ptr];
          if (char === undefined) throw new Error(`Character expected after \`'\` operator`);
          this.pushStack(num(char.charCodeAt(0)), TYPE.Number);
          this.debug(`CHAR CODE: Push char code of '${char}' - ${atop(this._stack)}`);
          this.ptr++;
          break;
        }

        // == MATHS ==
        case '+': case '-': case '*': case '/': {
          let a = this.popStack(TYPE.Number).value, b = this.popStack(TYPE.Number).value, ans;
          if (char === '-') ans = b - a; // Subtraction
          else if (char === '*') ans = b * a; // Multiplication
          else if (char === '/') ans = b / a; // Division
          else ans = b + a; // Addition
          this.pushStack(ans, TYPE.Number); // Push to stack
          this.debug(`ARITHMATIC: ${b} ${char} ${a} = ${ans} (${atop(this._stack).value})`);
          this.ptr++;
          break;
        }

        // == NEGATE ==
        case '_': {
          const a = this.popStack(TYPE.Number).value;
          this.pushStack(a * -1, TYPE.Number);
          this.debug(`NEGATE: ${a} to ${atop(this._stack).value}`);
          this.ptr++;
          break;
        }

        // == LOGICAL COMPARISON ==
        case '&': case '|': {
          let a = this.popStack(TYPE.Boolean).value, b = this.popStack(TYPE.Boolean).value, ans;
          if (char === '|') ans = b || a; // OR
          else if (char === '=') ans = b === a; // Equality
          else ans = b && a; // AND
          this.debug(`COMPARISON: ${b} ${char} ${a} = ${ans}`);
          this.pushStack(ans, TYPE.Boolean); // Push to stack
          this.ptr++;
          break;
        }

        // == LOGICAL NOT ==
        case '~': {
          const a = this.popStack(TYPE.Boolean).value;
          this.pushStack(!a, TYPE.Boolean);
          this.debug(`NOT: !${a} = ${atop(this._stack).value}`);
          this.ptr++;
          break;
        }

        // == MAGNITUDE / EQUALITY ==
        case '>': case '=': {
          const a = this.popStack(TYPE.Number).value, b = this.popStack(TYPE.Number).value;
          if (char === '>') this.pushStack(b > a, TYPE.Boolean);
          else this.pushStack(b == a, TYPE.Boolean);
          this.debug(`${b} ${char} ${a} => ${atop(this._stack).value}`);
          this.ptr++;
          break;
        }

        // == DUPLICATE ==
        case '$': {
          const val = this.popStack(undefined);
          this.pushStack(val.value, val.type);
          this.pushStack(val.value, val.type);
          this.debug(`DUPLICATE: value '${val.value}' of type ${TYPE[val.type]}`);
          this.ptr++;
          break;
        }

        // == POP ==
        case '%': {
          const v = this.popStack();
          this.debug(`POP: pop item '${v.value}' (${TYPE[v.type]})`);
          this.ptr++;
          break;
        }

        // == SWAP ==
        case '\\': {
          const a = this.popStack(undefined), b = this.popStack(undefined);
          this.pushStack(a.value, a.type);
          this.pushStack(b.value, b.type);
          this.debug(`SWAP: [ "${a.value}" "${b.value}" ] -> [ "${b.value}" "${a.value}" ]`);
          this.ptr++;
          break;
        }

        // == ROTATE ==
        case '@': {
          // Rotate third item to top
          const a = this.popStack(undefined), b = this.popStack(undefined), c = this.popStack(undefined);
          this.pushStack(b.value, b.type);
          this.pushStack(a.value, a.type);
          this.pushStack(c.value, c.type);
          this.ptr++;
          break;
        }

        // == PICK ==
        case 'ø': {
          const pos = this.popStack(TYPE.Number); // Position to get thing from
          const index = this._stack.length - 1 - pos.value; // Index in stack
          if (index < 0 || index >= this._stack.length) throw new Error(`Pick (ø): position ${pos.value} (index ${index}) is out of stack bounds!`);
          const item = this._stack[index];
          this.pushStack(item.value, item.type);
          this.debug(`PICK: Copy item in position ${pos.value} (index ${index}) to top position -> "${item.value}" (${item.type})`);
          this.ptr++;
          break;
        }

        // == INPUT CHAR (getch) ==
        case '^': {
          const blocker = new Blocker();
          this._callbackGetch(blocker);
          const char = await blocker.block(), // Wait for input
            charCode = char.length === 0 ? -1 : num(char.charCodeAt(0));
          this.pushStack(charCode, TYPE.Number);
          this.debug(`INPUT: getch'd "${char}" code ${charCode}`);
          this.ptr++;
          break;
        }

        // == OUTPUT CHAR ==
        case ',': {
          const a = this.popStack(TYPE.Number), char = str(String.fromCharCode(a.value));
          this._callbackOutput(char);
          this.debug(`OUTPUT: output ASCII ${a.value} -> "${char}"`);
          this.ptr++;
          break;
        }

        // == OUTPUT NUM ==
        case '.': {
          const a = this.popStack(TYPE.Number);
          this._callbackOutput(a.value);
          this.debug(`OUTPUT: output number ${a.value}`);
          this.ptr++;
          break;
        }

        // == FLUSH ==
        case 'ß': {
          this.debug("FLUSH (ß)");
          this._callbackFlush();
          this.ptr++;
          break;
        }

        // == LAMDA ==
        case '[': {
          let end = getMatchingBracket(this.ptr, this._call[ti]); // Find bracket. This will handle unmatching brackets.

          let lambda = this._call[ti].substring(this.ptr + 1, end); // Extract stuff between [...]
          this.pushStack(lambda, TYPE.Function);

          this.ptr += lambda.length + 2; // +2 for "[" and "]"
          break;
        }

        // == EXECUTE LAMBDA ==
        case '!': {
          const lambda = this.popStack(TYPE.Function);
          this.debug(`Execute function...`);
          this.pushCallStack(lambda.value);
          this._ptrs[ti]++; // Increment OLD function pointer
          this._updateCallstackVisuals();
          break;
        }

        // == EXECUTE LAMBDA IF ==
        case '?': {
          const lambda = this.popStack(TYPE.Function), bool = this.popStack(TYPE.Boolean);
          this.debug(`IF: execute function? ${bool.value}`);
          if (bool.value) {
            this.pushCallStack(lambda.value);
          }
          this._ptrs[ti]++; // Increment OLD function pointer
          this._updateCallstackVisuals();
          break;
        }

        // == VARIABLE ASSIGNMENT ==
        case ':': {
          const varName = this.popStack(TYPE.String).value, value = this.popStack(undefined);
          this.debug(`VARIABLE: Store '${value.value}' (${TYPE[value.type]}) in variable '${varName}'`);
          this.setVar(varName, value.value, value.type);
          this.ptr++;
          break;
        }

        // == VARIABLE RETRIEVAL ==
        case ';': {
          const varName = this.popStack(TYPE.String).value;
          console.log(`${this.ptr}, \`${char}\`, \`${this._call[ti][this.ptr]}\``)
          if (this._vars[varName] === undefined) throw new Error(`Variable name '${varName}' cannot be resolved.`);
          this.pushStack(this._vars[varName].value, this._vars[varName].type);
          this.debug(`VARIABLE: Retrieve variable '${varName}' -> "${this._vars[varName].value}" (${this._vars[varName].type})`);
          this.ptr++;
          break;
        }

        // == WHILE LOOP ==
        case '#': {
          if (this._whiles.length !== 0 && atop(this._whiles).depth === ti) { // At end of while loop - else, why would we be here?
            this._whiles.pop(); // Close while loop
            this.debug(`Close while loop (depth ${ti})`);
            this.ptr++;
          } else {
            const body = this.popStack(TYPE.Function), condition = this.popStack(TYPE.Function);
            this._whiles.push({
              depth: ti,
              cond: condition.value,
              body: body.value,
              inCond: true,
            });
            this.pushCallStack(condition.value); // Push condition
            this.debug(`Push while loop (depth ${ti})`);
          }
          break;
        }

        default:
          throw new Error(`SYNTAX ERROR: '${char}'`);
      }
    }
    if (this.ptr === ptr && char !== '#') throw new Error(`POINTER ERROR: pointer has not changed after execution cycle - infinite loop detected`);
    return true;
  }

  async interpret(code) {
    try {
      await super.interpret(code);
    } catch (e) {
      console.error(e);
      const traces = this.generateTraceback();
      const { line, col } = linearPosToLineCol(atop(this._call), atop(this._ptrs));
      throw new Error(`Fatal error in function ${this._call.length} at '${atop(this._call)[atop(this._ptrs)]}' : \n${e}\n\n ===== CALL STACK =====\n${traces.join('\n')}`);
    }
  }
}

const TYPE = createEnum({
  Number: 0,
  Boolean: 1,
  String: 2,
  Function: 4,
  VarRef: 8,
});

export default FalseInterpreter;