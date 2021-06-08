import BaseInterpreter from "../BaseInterpreter.js";
import { Stack } from "../../classes/Stack.js";
import { getMatchingBracket, underlineStringPortion, strInsertAt, regexWhitespace } from "../../utils.js";

export class UnderloadInterpreter extends BaseInterpreter {
  constructor() {
    super();

    this._originalCode = '';
    this._stack = new Stack();
    this._ptr = 0;

    this._callbackUpdateStack = () => { };
    this._callbackUpdateCode = () => { };
    this._callbackUpdatePtr = () => { };
    this._callbackOutput = () => { };
    /** @type {(code: string, positions: number[][], format: string) => void} */
    this._callbackUpdateGrid = () => { };
  }

  get LANG() { return "Underload"; }

  get ptr() { return this._ptr; }
  set ptr(value) { this._ptr = value; this._callbackUpdatePtr(this._ptr); }

  setCode(code) {
    super.setCode(code);
    this._originalCode = this._code;
    this._callbackUpdateGrid(this._code);
  }

  reset() {
    this._stack.dump();
    this._callbackUpdateStack("empty");
    this._code = this._originalCode;
    this._callbackUpdateCode();
    this.ptr = 0;
  }

  pushStack(value) { this._stack.push(value); this._callbackUpdateStack("push", value); }
  popStack() {
    if (this._stack.empty()) throw new Error(`Stack underflow`);
    this._callbackUpdateStack("pop");
    return this._stack.pop();
  }

  async step() {
    if (this.ptr >= this._code.length) return false;

    let skip = 0;
    while (regexWhitespace.test(this._code[this.ptr + skip])) skip++;
    if (skip !== 0) this.ptr += skip;

    switch (this._code[this.ptr]) {
      case '~': {
        let a = this.popStack(), b = this.popStack();
        this.pushStack(a);
        this.pushStack(b);
        break;
      }
      case ':': {
        let a = this.popStack();
        this.pushStack(a);
        this.pushStack(a);
        break;
      }
      case '!':
        this.popStack();
        break;
      case '*': {
        let y = this.popStack(), x = this.popStack();
        this.pushStack(x + y);
        break;
      }
      case '(': {
        let closing = getMatchingBracket(this.ptr, this._code), toPush = this._code.substring(this.ptr + 1, closing);
        this.ptr = closing;
        this.pushStack(toPush);
        break;
      }
      case 'a': {
        let a = this.popStack();
        this.pushStack('(' + a + ')');
        break;
      }
      case '^':
        this._code = strInsertAt(this._code, this.ptr + 1, this.popStack());
        this._callbackUpdateCode();
        break;
      case 'S':
        this.print(this.popStack());
        break;
      default:
        throw new Error(`Invalid syntax`);
    }

    this.ptr++;
    this._callbackUpdateGrid(undefined, [[this.ptr, 0]]);
    return true;
  }

  async interpret() {
    try {
      await super.interpret();
    } catch (e) {
      console.error(e);
      let start = this.ptr - 5, snippet = this._code.substr(start < 0 ? 0 : start, 10);
      let info = underlineStringPortion(this._code, this.ptr);
      throw new Error(`Error encountered in position ${this.ptr} at '${this._code[this.ptr]}':\n${info}\n${e}`);
    }
  }
}

export default UnderloadInterpreter;