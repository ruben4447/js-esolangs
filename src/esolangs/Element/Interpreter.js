import { Stack } from '../../classes/Stack.js';
import { scanString, arrayMoveItem, getMatchingBracket, num, str } from '../../utils.js';
import BaseInterpreter from '../BaseInterpreter.js';

export class ElementInterpreter extends BaseInterpreter {
    constructor() {
        super();
        this.autovivification = false; // '~' command: if true, create variable and initialise to '' if it doesn't exist. If false, throw error.
        this._pos = 0;
        this._main = new Stack();
        this._control = new Stack();
        this._vars = {};
        /** @type {(stack: "main" | "control", type: "push" | "pop" | "empty" | "update", value?: any) => void} */
        this._callbackUpdateStack = (stack, type, value) => { };
        /** @type {(symbol: string, action: "set" | "del" | "clear", value: string | number) => void} */
        this._callbackUpdateVars = (symbol, action, value) => { };
        this._callbackOutput = () => { };
        this._callbackInput = () => { };
        /** @type {(pos: number) => void} */
        this._callbackUpdatePos = () => { };
        /** @type {(code: string, positions: number[][], format: string) => void} */
        this._callbackUpdateGrid = () => { };

        this._bracketMap = {}; // Map opening positions to closing positions, and vica versa
        this._loopCounts = {}; // Maps opening positions in code of loops to number of cycles left
    }

    get LANG() { return 'element'; }

    get pos() { return this._pos; }
    set pos(val) { this._pos = val; this._callbackUpdatePos(val); }
    setCode(code) {
        super.setCode(code);
        try {
            this.constructBracketMap();
        } catch (e) {
            throw new Error(`Found unmatched bracket:\n${e}`);
        }
        this._callbackUpdateGrid(this._code, undefined);
    }

    reset() {
        this.pos = 0;
        this._main._.length = 0;
        this._callbackUpdateStack("main", "empty");
        this._control._.length = 0;
        this._callbackUpdateStack("control", "empty");
        this._vars = {};
        this._callbackUpdateVars(undefined, "clear");
    }

    pushMain(value) { value = str(value); this._main.push(value); this._callbackUpdateStack("main", "push", value); }
    popMain() {
        let x = this._main.top();
        this._main.pop();
        this._callbackUpdateStack("main", "pop");
        return x;
    }
    pushControl(value) { value = str(value); this._control.push(value); this._callbackUpdateStack("control", "push", value); }
    popControl() {
        let x = this._control.top();
        this._control.pop();
        this._callbackUpdateStack("control", "pop");
        return x;
    }
    setVar(symbol, value) { this._vars[symbol] = value; this._callbackUpdateVars(symbol, "set", value); }
    delVar(symbol) { if (this._vars[symbol] !== undefined) { delete this._vars[symbol]; this._callbackUpdateVars(symbol, "del"); } }

    /** Extract and return string from this.pos */
    extractText() {
        const obj = scanString(this._code.substr(this.pos), breakChars);
        this.pos += obj.length;
        return obj.str;
    }

    /** Check size of given stack is at least <minSize> size. <name> is for the error message */
    checkStackSize(stack, minSize, name) {
        const size = stack.size();
        if (size < minSize) throw new Error(`Expected stack '${name}' to be of size >= ${minSize}, size is ${size}`);
    }

    /** Construct bracket map for this._code */
    constructBracketMap() {
        this._bracketMap = {};
        const brackets = ["{", "}", "[", "]"];
        for (let i = 0; i < this._code.length; i++) {
            if (brackets.indexOf(this._code[i]) !== -1) {
                let j = getMatchingBracket(i, this._code);
                this._bracketMap[i] = j;
            }
        }
    }

    async step() {
        if (this.pos >= this._code.length) return false;
        const char = this._code[this.pos];
        if (/\s/.test(char)) {
            this.pos++; // Skip whitespace
        } else {
            switch (char) {
                case '_': {
                    let input = await this.input();
                    this.pushMain(input);
                    break;
                }
                case '`':
                    this.print(this.popMain()); // Output value
                    break;
                case ';': {
                    // this.checkStackSize(this._main, 1, 'main');
                    const symbol = str(this.popMain()), value = str(this.popMain());
                    this.setVar(symbol, value); // Get top item on stack, make variable and insert contents of second item on
                    break;
                }
                case '~': {
                    // this.checkStackSize(this._main, 1, 'main'); // Need stack to be at least [varName]
                    const symbol = str(this.popMain());
                    if (this._vars[symbol] === undefined) {
                        if (this.autovivification) this.setVar(symbol, '0');
                        else throw new Error(`Cannot resolve symbol '${symbol}' to value in hash table`);
                    }
                    const value = this._vars[symbol];
                    this.pushMain(value); // Push contents of variable <symbol>
                    break;
                }
                case '?': {
                    // this.checkStackSize(this._main, 1, 'main');
                    const value = str(this.popMain()), // Get value from main stack
                        test = value === '0' || value === ''; // Test against conditions
                    this.pushControl(test ? 0 : 1); // Push 0 if test is true, else push 1
                    break;
                }
                case '=': case '<': case '>': {
                    // this.checkStackSize(this._main, 2, 'main');
                    let a = num(this.popMain()), b = num(this.popMain()), test;
                    if (char === '<') test = (a > b) ? 1 : 0;
                    else if (char === '>') test = (a < b) ? 1 : 0;
                    else test = (a == b) ? 1 : 0;
                    this.pushControl(test);
                    break;
                }
                case "'": {
                    // this.checkStackSize(this._main, 1, 'main');
                    this.pushControl(this.popMain()); // m->c
                    break;
                }
                case '"': {
                    // this.checkStackSize(this._control, 1, 'control');
                    this.pushMain(this.popControl()); // c->m
                    break;
                }
                case '&': case '|': {
                    // this.checkStackSize(this._control, 2, 'control');
                    let a = num(this.popControl()), b = num(this.popControl()), test;
                    if (char === '&') test = (a && b) ? 1 : 0;
                    else test = (a || b) ? 1 : 0;
                    this.pushControl(test);
                    break;
                }
                case '!': {
                    // this.checkStackSize(this._control, 1, 'control');
                    let value = str(this.popControl());
                    let test = value === '0' || value === ''; // Like logical not
                    this.pushControl(test ? 1 : 0);
                    break;
                }
                case '#':
                    // this.checkStackSize(this._main, 1, 'main');
                    this.popMain(); // Pop from main
                    break;
                case '+':
                    // this.checkStackSize(this._main, 2, 'main');
                    this.pushMain(num(this.popMain()) + num(this.popMain())); // Add
                    break;
                case '-':
                    // this.checkStackSize(this._main, 1, 'main');
                    this.pushMain(num(this.popMain()) * -1); // Negate
                    break;
                case '*':
                    // this.checkStackSize(this._main, 2, 'main');
                    this.pushMain(num(this.popMain()) * num(this.popMain())); // Multiply
                    break;
                case '/': {
                    // this.checkStackSize(this._main, 2, 'main');
                    let a = num(this.popMain());
                    this.pushMain(num(this.popMain()) / a); // Division
                    break;
                }
                case '%': {
                    // this.checkStackSize(this._main, 2, 'main');
                    let a = num(this.popMain());
                    this.pushMain(num(this.popMain()) % a); // Modulo
                    break;
                }
                case '^': {
                    // this.checkStackSize(this._main, 2, 'main');
                    let a = num(this.popMain());
                    this.pushMain(Math.pow(num(this.popMain()), a)); // Power
                    break;
                }
                case '@': {
                    // this.checkStackSize(this._main, 2, 'main');
                    let a = num(this._main.pop()), b = num(this._main.pop()); // Silent work
                    arrayMoveItem(this._main._, b, a); // Move items using function
                    this._main._ = this._main._.map(x => num(x).toString()); // Map everything to numerics - basically, remove NaNs, Infinitys, undefineds...
                    this._callbackUpdateStack("main", "update", this._main.toArray());
                    break;
                }
                case '$':
                    // this.checkStackSize(this._main, 1, 'main');
                    this.pushMain(str(this.popMain()).toString().length); // Push length of topmost item
                    break;
                case ':': {
                    // this.checkStackSize(this._main, 2, 'main');
                    const repeatCount = num(this._main.pop()), toRepeat = str(this._main.pop());
                    for (let i = 0; i < repeatCount; i++) this._main.push(toRepeat); // This could potentially be long, so do silently then update in one chunk
                    this._callbackUpdateStack("main", "update", this._main.toArray());
                    break;
                }
                case '.': {
                    // this.checkStackSize(this._main, 2, 'main');
                    let a = str(this.popMain()), b = str(this.popMain());
                    this.pushMain(b + a); // Concatenate
                    break;
                }
                case ',': {
                    // this.checkStackSize(this._main, 1, 'main');
                    const value = str(this.popMain());
                    this.pushMain(String.fromCharCode(value));
                    this.pushMain(value.charCodeAt(0));
                    break;
                }
                case '[':
                    // Open for loop
                    if (this._loopCounts[this.pos] === undefined) this._loopCounts[this.pos] = num(this._control.top());
                    // Loop again?
                    if (this._loopCounts[this.pos] <= 0) {
                        this.pos = this._bracketMap[this.pos] - 1; // Jump to before closing bracket. Closing bracket will close loop.
                    }
                    break;
                case ']': {
                    // Closing for loop
                    let opening = this._bracketMap[this.pos];
                    // Are there more loops left to complete?
                    if (this._loopCounts[opening] > 0) {
                        this._loopCounts[opening]--; // Decrease number of cycles
                        this.pos = opening - 1; // As this.pos is incremented at end of function, decrement here
                    } else {
                        delete this._loopCounts[opening]; // Remove for loop count
                    }
                    break;
                }
                case '{':
                    // Opening WHILE loop
                    this._loopCounts[this.pos] = num(this._control.top()); // Get top item on stack
                    if (this._loopCounts[this.pos] <= 0) {
                        this.pos = this._bracketMap[this.pos] - 1; // Jump to before closing bracket. Closing bracket will close loop.
                    }
                    break;
                case '}':
                    // Closing WHILE loop
                    let opening = this._bracketMap[this.pos];
                    if (this._loopCounts[opening] > 0) {
                        this.pos = opening - 1; // Jump to just before opening bracket; increment of this.pos at end of function will take care of this
                    } else {
                        delete this._loopCounts[opening];
                    }
                    break;
                case '(': {
                    let string = str(this.popMain());
                    this.pushMain(string.substr(1));
                    this.pushMain(string[0]);
                    break;
                }
                case ')': {
                    let string = str(this.popMain());
                    this.pushMain(string.substr(0, string.length - 1));
                    this.pushMain(string[string.length - 1]);
                    break;
                }
                default: {
                    const text = this.extractText(); // Extract text
                    if (text.length === 0) throw new Error(`Invalid token '${char}'`); // Attempted to make string, but failed
                    this.pushMain(text); // Push text to stack
                    this.pos--;
                }
            }
            this.pos++; // Increment position (skip char)
        }
        this._callbackUpdateGrid(undefined, [[this.pos, 0]]);
        return true;
    }

    async interpret() {
        try {
            await super.interpret();
        } catch (e) {
            console.error(e);
            throw new Error(`Element: error at position ${this.pos} at '${this._code[this.pos]}':\n ${e}`);
        }
    }
}

const breakChars = [" ", "\n", "_", "`", ";", "~", "?", "<", ">", "=", "'", "\"", "&", "|", "!", "[", "]", "{", "}", "(", ")", "#", "+", "*", "/", "%", "^", "-", "@", "$", ":", ".", "\\", ","];

export default ElementInterpreter;