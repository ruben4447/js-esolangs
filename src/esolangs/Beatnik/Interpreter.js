import BaseInterpreter from "../BaseInterpreter.js";
import { scrabble } from "./utils.js";
import { Stack } from "../../classes/Stack.js";
import Blocker from "../../classes/Blocker.js";
import { num, ord, str } from "../../utils.js";

export class BeatnikInterpreter extends BaseInterpreter {
    constructor() {
        super();
        this._words = [];
        this._stack = new Stack();
        this._ptr = 0;

        this._callbackUpdatePtr = () => { };
        /** @type {(type: "push" | "pop" | "empty" | "update", value?: any) => void} */
        this._callbackUpdateStack = (type, value) => { };
        this._callbackGetch = () => { };
        this._callbackOutput = () => { };
    }

    get LANG() { return "beatnik"; }

    get ptr() { return this._ptr; }
    set ptr(value) { this._ptr = value; this._callbackUpdatePtr(this._ptr); }

    setCode(code) {
        code = code.replace(/[^A-Za-z\s]/g, '');
        super.setCode(code);
        this._words = code.split(/\s+/g).filter(x => x.length !== 0);
    }

    reset() {
        this._stack.dump();
        this._callbackUpdateStack("empty");
        this.ptr = 0;
    }

    pushStack(value) { this._stack.push(value); this._callbackUpdateStack("push", value); }
    popStack() {
        if (this._stack.empty()) throw new Error(`Stack Underflow while popping`);
        this._callbackUpdateStack("pop");
        return this._stack.pop();
    }

    async step() {
        if (this.ptr >= this._words.length) return false;
        const score = scrabble(this._words[this.ptr]);
        switch (score) {
            case 5: {
                // Push
                let word = str(this._words[++this.ptr]);
                this.pushStack(scrabble(word));
                this.debug(`PUSH '${word}' ${this._stack.top()}`);
                break;
            }
            case 6:
                // Pop
                this.popStack();
                this.debug(`POP`);
                break;
            case 7: {
                // Add
                let a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b + a);
                this.debug(`ADD ${b} + ${a} = ${this._stack.top()}`);
                break;
            }
            case 8: {
                // GETCH
                const blocker = new Blocker();
                this._callbackGetch(blocker);
                let chr = await blocker.block(); // Wait for character
                this.pushStack(ord(chr));
                break;
            }
            case 9: {
                // Print
                const charCode = num(this.popStack()), char = str(String.fromCharCode(charCode));
                this.debug(`PRINT: ${charCode} ('${char}')`);
                this._callbackOutput(char);
                break;
            }
            case 10: {
                // Subtract
                let a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b - a);
                this.debug(`SUBTRACT ${b} - ${a} = ${this._stack.top()}`);
                break;
            }
            case 11: {
                // Swap
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(a);
                this.pushStack(b);
                this.debug(`Swap [${b}, ${a}] -> [${a}, ${b}]`);
                break;
            }
            case 12:
                // Duplicate
                if (this._stack.empty()) throw new Error(`Stack underflow while duplicating top value`);
                this.pushStack(num(this._stack.top()));
                this.debug(`Duplicate ${this._stack.top()}`);
                break;
            case 13: {
                const val = num(this.popStack());
                this.ptr++;
                if (val === 0) {
                    const jmp = scrabble(str(this._words[this.ptr]));
                    this.ptr += jmp; // Move forward this many places
                    this.debug(`Skip Forward if Zero: value is zero (${val}) so jump forward ${jmp} words`);
                } else {
                    this.debug(`Skip Forward if Zero: value is not zero (${val})`);
                }
                break;
            }
            case 14: {
                const val = num(this.popStack());
                this.ptr++;
                if (val !== 0) {
                    const jmp = scrabble(str(this._words[this.ptr]));
                    this.ptr += jmp; // Move forward this many places
                    this.debug(`Skip Forward if not Zero: value is not zero (${val}) so jump forward ${jmp} words`);
                } else {
                    this.debug(`Skip Forward if not Zero: value is zero (${val})`);
                }
                break;
            }
            case 15: {
                const val = num(this.popStack());
                if (val === 0) {
                    const jmp = scrabble(str(this._words[this.ptr + 1]));
                    this.ptr -= jmp; // Move back this many places
                    this.debug(`Skip Back if Zero: value is zero (${val}) so jump backwards ${jmp} words`);
                } else {
                    this.debug(`Skip Back if Zero: value is not zero (${val})`);
                }
                break;
            }
            case 16: {
                const val = num(this.popStack());
                const jmp = scrabble(str(this._words[this.ptr + 1]));
                if (val !== 0) {
                    this.ptr -= jmp; // Move back this many places
                    this.debug(`Skip Back if not Zero: value is not zero (${val}) so jump backwards ${jmp} words`);
                } else {
                    this.debug(`Skip Back if not Zero: value is zero (${val})`);
                }
                break;
            }
            case 17:
                this.debug("HALT!");
                return false;
            default:
                this.debug(`NO-OP: '${this._words[this.ptr]}' ${score}`);
        }
        this.ptr++;
        return true;
    }

    async interpret() {
        try {
            super.interpret();
        } catch (e) {
            console.error(e);
            throw new Error(`Error at position ${this.ptr}:\n${e}`);
        }
    }
}

export default BeatnikInterpreter;