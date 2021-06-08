import BaseInterpreter from "../BaseInterpreter.js";
import { Stack } from "../../classes/Stack.js";
import { arrayRotateLeft, arrayRotateRight, generateCountedString, num, str } from "../../utils.js";
import { INP, ADD, SUB, DUP, COND, GOTOU, OUTN, OUTA, ROL, SWAP, MUL, DIV, POP, GOTOS, PUSH, ROR, textToLength, regexComment } from './utils.js';

export class LengthInterpreter extends BaseInterpreter {
    constructor() {
        super();
        this._stack = new Stack();
        this._lines = [];
        this._line = 0;
        this.comments = false; // Allow comments? (anything after ';' will be ignored)

        /** @type {(type: "push" | "pop" | "empty" | "update", value?: any) => void} */
        this._callbackUpdateStack = (type, value) => { };
        this._callbackGetch = () => { }; // Callback for user input. Takes Blocker object
        this._callbackOutput = chr => { }; // Output character
        /** @type {(n: number) => void} */
        this._callbackUpdateLineN = n => { };
    }

    get LANG() { return "length"; }

    get line() { return this._line; }
    set line(n) { this._line = n; this._callbackUpdateLineN(n); }

    setCode(code) {
        super.setCode(code);
        this._lines = code.split(/\r\n|\r|\n/g);
        if (this.comments) this._lines = this._lines.map(l => l.replace(regexComment, ''));
    }
    getCode() { return this._lines.join('\n'); }

    reset() {
        this.line = 0;
        this._stack.dump();
        this._callbackUpdateStack("empty");
    }

    pushStack(value) { this._stack.push(value); this._callbackUpdateStack("push", value); }
    popStack() { this._callbackUpdateStack("pop"); return this._stack.pop(); }

    async step() {
        if (this.line >= this._lines.length) return false;
        const length = this._lines[this.line].length;
        switch (length) {
            case INP: {
                let chrCode = await this.getch(true);
                this.pushStack(chrCode);
                this.debug(`Got Input: '${this._stack.top()}'`);
                break;
            }
            case ADD: {
                if (this._stack.size() < 2) throw new Error(`ADD: Stack underflow`);
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b + a);
                this.debug(`Add ${b} + ${a} = ${this._stack.top()}`);
                break;
            }
            case SUB: {
                if (this._stack.size() < 2) throw new Error(`SUB: Stack underflow`);
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b - a);
                this.debug(`Subtract ${b} - ${a} = ${this._stack.top()}`);
                break;
            }
            case DUP:
                this.debug(`Duplicate top value '${this._stack.top()}'`);
                this.pushStack(this._stack.top()); // Duplicate top value on stack
                break;
            case COND: {
                if (this._stack.size() < 1) throw new Error(`COND: Stack underflow`);
                let x = num(this.popStack());
                if (x === '0' || x === 0) {
                    this.line++;
                    if (this._lines[this.line].length === GOTOU || this._lines[this.line].length === PUSH) {
                        this.line++; // Skip gotou or push instruction TWICE to skip the arguments
                        this.debug(`Condition: ${x}: skip *2`);
                    } else {
                        this.debug(`Condition: ${x}: skip *1`);
                    }
                } else {
                    this.debug(`Condition: ${x}: no skip`);
                }
                break;
            }
            case GOTOU: {
                if (this.line + 1 >= this._lines.length) throw new Error(`GOTOU: expected one argument`);
                const value = this._lines[this.line + 1].length;
                this.line = value - 1; // incremented at end
                this.debug(`GOTOU: Goto position ${value} (index ${value - 1})`);
                break;
            }
            case OUTN:
                if (this._stack.size() < 1) throw new Error(`OUTN: Stack underflow`);
                this.debug(`Print as number: '${this._stack.top()}'`);
                this.print(num(this.popStack())); // Output top value as a number
                break;
            case OUTA:
                if (this._stack.size() < 1) throw new Error(`OUTA: Stack underflow`);
                this.debug(`Print as ASCII: '${String.fromCharCode(this._stack.top())}'`);
                this.print(str(String.fromCharCode(+this.popStack()))); // Output top value as an ASCII character
                break;
            case ROL:
                if (this._stack.size() < 1) break;
                this.debug(`Rotate stack left`);
                arrayRotateLeft(this._stack._);
                this._callbackUpdateStack("update", this._stack.toArray());
                break;
            case SWAP: {
                if (this._stack.size() < 2) throw new Error(`SWAP: Stack underflow`);
                let a = num(this.popStack()), b = num(this.popStack());
                this.debug(`Swap values ${a} and ${b}`);
                this.pushStack(a); // Swap top two values on the stack
                this.pushStack(b);
                break;
            }
            case MUL: {
                if (this._stack.size() < 2) throw new Error(`MUL: Stack underflow`);
                let a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(a * b);
                this.debug(`Multiply: ${a} * ${b} = ${this._stack.top()}`);
                break;
            }
            case DIV: {
                if (this._stack.size() < 2) throw new Error(`DIV: Stack underflow`);
                let a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b / a);
                this.debug(`Divide: ${b} / ${a} = ${this._stack.top()}`);
                break;
            }
            case POP:
                if (this._stack.size() < 1) throw new Error(`POP: Stack underflow`);
                this.debug(`Pop value: '${this._stack.top()}'`);
                this.popStack();
                break;
            case GOTOS: {
                if (this._stack.size() < 1) throw new Error(`GOTOS: Stack underflow`);
                this.line = Math.abs(parseInt(this.popStack())) - 1; // incremented at end
                this.debug(`GOTO Stack: Goto position ${this.line + 1}`);
                break;
            }
            case PUSH:
                this.pushStack(this._lines[++this.line].length);
                this.debug(`Push value '${this._stack.top()}'`);
                break;
            case ROR:
                if (this._stack.size() < 1) break;
                this.debug(`ROL: Rotate stack right`);
                arrayRotateRight(this._stack._);
                this._callbackUpdateStack("update", this._stack.toArray());
                break;
            default:
                // throw new Error(`Unable to decode line of length ${length}`);
                if (this.debug) console.warn(`Unable to decode line of length ${length}`);
        }

        this.line++;
        return true;
    }

    async interpret() {
        try {
            await super.interpret();
        } catch (e) {
            throw new Error(`Length: error on line ${this.line + 1} '${this._lines[this.line]}':\n ${e}`);
        }
    }

    /** Normal length code to shorthand */
    toShorthand() {
        let array = [];
        for (let l = 0; l < this._lines.length; l++) {
            const len = this._lines[l].length;
            switch (len) {
                case INP:
                    array.push("inp");
                    break;
                case ADD:
                    array.push("add");
                    break;
                case SUB:
                    array.push("sub");
                    break;
                case DUP:
                    array.push("dup");
                    break;
                case COND:
                    array.push("cond");
                    break;
                case GOTOU:
                    if (l + 1 >= this._lines.length) throw new Error(`GOTOU: expects following line as argument`);
                    array.push("gotou");
                    array.push(this._lines[++l].length);
                    break;
                case OUTN:
                    array.push("outn");
                    break;
                case OUTA:
                    array.push("outa");
                    break;
                case ROL:
                    array.push("rol");
                    break;
                case SWAP:
                    array.push("swap");
                    break;
                case MUL:
                    array.push("mul");
                    break;
                case DIV:
                    array.push("div");
                    break;
                case POP:
                    array.push("pop");
                    break;
                case GOTOS:
                    array.push("gotos");
                    break;
                case PUSH:
                    if (l + 1 >= this._lines.length) throw new Error(`PUSH: expects following line as argument`);
                    array.push("push");
                    array.push(this._lines[++l].length);
                    break;
                case ROR:
                    array.push("ror");
                    break;
                default:
                // throw new Error(`Line ${l}: cannot decode line of length ${len}`);
            }
        }
        return array.join(' ');
    }

    /** Shorthand length code to normal length code */
    fromShorthand(shorthand) {
        let lines = [], input = shorthand.split(/\s+/g);
        for (let i = 0; i < input.length; i++) {
            const item = input[i].toLowerCase(), startI = i;
            switch (item) {
                case 'inp':
                    lines.push(generateCountedString(INP));
                    break;
                case 'add':
                    lines.push(generateCountedString(ADD));
                    break;
                case 'sub':
                    lines.push(generateCountedString(SUB));
                    break;
                case 'dup':
                    lines.push(generateCountedString(DUP));
                    break;
                case 'cond':
                    lines.push(generateCountedString(COND));
                    break;
                case 'gotou':
                    if (i + 1 >= input.length) throw new Error(`GOTOU: expects following item as argument`);
                    lines.push(generateCountedString(GOTOU));
                    lines.push(generateCountedString(num(input[++i])));
                    break;
                case 'outn':
                    lines.push(generateCountedString(OUTN));
                    break;
                case 'outa':
                    lines.push(generateCountedString(OUTA));
                    break;
                case 'rol':
                    lines.push(generateCountedString(ROL));
                    break;
                case 'swap':
                    lines.push(generateCountedString(SWAP));
                    break;
                case 'mul':
                    lines.push(generateCountedString(MUL));
                    break;
                case 'div':
                    lines.push(generateCountedString(DIV));
                    break;
                case 'pop':
                    lines.push(generateCountedString(POP));
                    break;
                case 'gotos':
                    lines.push(generateCountedString(GOTOS));
                    break;
                case 'push':
                    if (i + 1 >= input.length) throw new Error(`PUSH: expects following item as argument`);
                    lines.push(generateCountedString(PUSH));
                    lines.push(generateCountedString(num(input[++i])));
                    break;
                case 'ror':
                    lines.push(generateCountedString(ROR));
                    break;
                default:
                    throw new Error(`Syntax error: '${input[i]}' (offset +${i})`);
            }
        }
        return lines.join('\n');
    }
}

LengthInterpreter.textToCode = function (text) {
    return textToLength(text);
};

export default LengthInterpreter;