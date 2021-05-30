import { Stack } from "../../classes/Stack.js";
import { Blocker } from "../../classes/Blocker.js";
import { arrayRotateLeft, arrayRotateRight, num } from "../../utils.js";
import { textToLength } from './utils.js';

export class LengthInterpreter {
    constructor() {
        this._stack = new Stack();
        this._lines = [];
        this._line = 0;
        this.comments = false; // Allow comments? (anything after ';' will be ignored)
        this.debug = false;

        /** @type {(type: "push" | "pop" | "empty" | "update", value?: any) => void} */
        this._callbackUpdateStack = (type, value) => {};
        this._callbackInput = block => { block.unblock(null); }; // Callback for user input. Takes Blocker object
        this._callbackOutput = chr => {}; // Output character
    }

    get LANG() { return "length"; }

    setCode(code) {
        this._lines = code.split(/\r\n|\r|\n/g);
        if (this.comments) this._lines = this._lines.map(l => l.replace(regexComment, ''));
    }

    reset() {
        this._line = 0;
        this._stack.dump();
        this._callbackUpdateStack("empty");
    }

    pushStack(value) { this._stack.push(value); this._callbackUpdateStack("push", value); }
    popStack() { this._callbackUpdateStack("pop"); return this._stack.pop(); }

    async step() {
        if (this._line >= this._lines.length) return false;
        const length = this._lines[this._line].length;
        switch (length) {
            case INP: {
                const blocker = new Blocker();
                this._callbackInput(blocker);
                let chr = await blocker.block(); // Wait for character
                this.pushStack(num(chr.charCodeAt(0)));
                if (this.debug) console.log(`Got Input: '${this._stack.top()}'`);
                break;
            }
            case ADD: {
                if (this._stack.size() < 2) throw new Error(`ADD: Stack underflow`);
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b + a);
                if (this.debug) console.log(`Add ${b} + ${a} = ${this._stack.top()}`);
                break;
            }
            case SUB: {
                if (this._stack.size() < 2) throw new Error(`SUB: Stack underflow`);
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b - a);
                if (this.debug) console.log(`Subtract ${b} - ${a} = ${this._stack.top()}`);
                break;
            }
            case DUP:
                if (this.debug) console.log(`Duplicate top value '${this._stack.top()}'`);
                this.pushStack(this._stack.top()); // Duplicate top value on stack
                break;
            case COND: {
                if (this._stack.size() < 1) throw new Error(`COND: Stack underflow`);
                let x = num(this.popStack());
                if (x === '0' || x === 0) {
                    this._line++;
                    if (this._lines[this._line].length === GOTOU || this._lines[this._line].length === PUSH) {
                        this._line++; // Skip gotou or push instruction TWICE to skip the arguments
                        if (this.debug) console.log(`Condition: ${x}: skip *2`);
                    } else {
                        if (this.debug) console.log(`Condition: ${x}: skip *1`);
                    }
                } else {
                    if (this.debug) console.log(`Condition: ${x}: no skip`);
                }
                break;
            }
            case GOTOU: {
                if (this._line + 1 >= this._lines.length) throw new Error(`GOTOU: expected one argument`);
                const value = this._lines[this._line + 1].length;
                this._line = value - 1; // incremented at end
                if (this.debug) console.log(`GOTOU: Goto position ${value} (index ${value - 1})`);
                break;
            }
            case OUTN:
                if (this._stack.size() < 1) throw new Error(`OUTN: Stack underflow`);
                if (this.debug) console.log(`Print as number: '${this._stack.top()}'`);
                this._callbackOutput(str(num(this.popStack()))); // Output top value as a number
                break;
            case OUTA:
                if (this._stack.size() < 1) throw new Error(`OUTA: Stack underflow`);
                if (this.debug) console.log(`Print as ASCII: '${String.fromCharCode(this._stack.top())}'`);
                this._callbackOutput(str(String.fromCharCode(+this.popStack()))); // Output top value as an ASCII character
                break;
            case ROL:
                if (this._stack.size() < 1) break;
                if (this.debug) console.log(`Rotate stack left`);
                arrayRotateLeft(this._stack._);
                this._callbackUpdateStack("update", this._stack.toArray());
                break;
            case SWAP: {
                if (this._stack.size() < 2) throw new Error(`SWAP: Stack underflow`);
                let a = num(this.popStack()), b = num(this.popStack());
                if (this.debug) console.log(`Swap values ${a} and ${b}`);
                this.pushStack(a); // Swap top two values on the stack
                this.pushStack(b);
                break;
            }
            case MUL: {
                if (this._stack.size() < 2) throw new Error(`MUL: Stack underflow`);
                let a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(a * b);
                if (this.debug) console.log(`Multiply: ${a} * ${b} = ${this._stack.top()}`);
                break;
            }
            case DIV: {
                if (this._stack.size() < 2) throw new Error(`DIV: Stack underflow`);
                let a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b / a);
                if (this.debug) console.log(`Divide: ${b} / ${a} = ${this._stack.top()}`);
                break;
            }
            case POP:
                if (this._stack.size() < 1) throw new Error(`POP: Stack underflow`);
                if (this.debug) console.log(`Pop value: '${this._stack.top()}'`);
                this.popStack();
                break;
            case GOTOS: {
                if (this._stack.size() < 1) throw new Error(`GOTOS: Stack underflow`);
                this._line = Math.abs(parseInt(this.popStack())) - 1; // incremented at end
                if (this.debug) console.log(`GOTO Stack: Goto position ${this._line + 1}`);
                break;
            }
            case PUSH:
                this.pushStack(this._lines[++this._line].length);
                if (this.debug) console.log(`Push value '${this._stack.top()}'`);
                break;
            case ROR:
                if (this._stack.size() < 1) break;
                if (this.debug) console.log(`ROL: Rotate stack right`);
                arrayRotateRight(this._stack._);
                this._callbackUpdateStack("update", this._stack.toArray());
                break;
            default:
                // throw new Error(`Unable to decode line of length ${length}`);
                if (this.debug) console.warn(`Unable to decode line of length ${length}`);
        }

        this._line++;
        return true;
    }

    async interpret(code) {
        if (code !== undefined) this.setCode(code);
        try {
            let cont;
            do {
                cont = await this.step();
            } while (cont);
        } catch (e) {
            throw new Error(`Length: error on line ${this._line + 1} '${this._lines[this._line]}':\n ${e}`);
        }
    }
}

LengthInterpreter.textToCode = function (text) {
    return textToLength(text);
};

const INP = 9, ADD = 10, SUB = 11, DUP = 12, COND = 13, GOTOU = 14, OUTN = 15, OUTA = 16, ROL = 17, SWAP = 18, MUL = 20, DIV = 21, POP = 23, GOTOS = 24, PUSH = 25, ROR = 27;
const regexComment = /;.*/g;

export default LengthInterpreter;