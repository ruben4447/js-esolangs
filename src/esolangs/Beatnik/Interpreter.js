import BaseInterpreter from "../BaseInterpreter.js";
import { scrabble } from "./utils.js";
import { Stack } from "../../classes/Stack.js";
import { num, str, regexNewline } from "../../utils.js";

export class BeatnikInterpreter extends BaseInterpreter {
    constructor() {
        super();
        this._lines = [];
        this._words = [];
        this._stack = new Stack();
        this._ptr = 0;

        this._callbackUpdatePtr = () => { };
        /** @type {(type: "push" | "pop" | "empty" | "update", value?: any) => void} */
        this._callbackUpdateStack = (type, value) => { };
        this._callbackGetch = () => { };
        this._callbackOutput = () => { };
        /** @type {(code: string, positions: number[][], format: string) => void} */
        this._callbackUpdateGrid = () => { };
    }

    get LANG() { return "beatnik"; }

    get ptr() { return this._ptr; }
    set ptr(value) { this._ptr = value; this._callbackUpdatePtr(this._ptr); }

    setCode(code) {
        code = code.replace(/[^A-Za-z\s]/g, '');
        super.setCode(code);
        this._lines = this._code.split(regexNewline);
        this._words = this._code.split(/\s+/g).filter(x => x.length !== 0);
        let scrabbledWords = this._code.split(regexNewline).map(line => line.split(/\s+/g).map(word => scrabble(word)));
        this._callbackUpdateGrid(scrabbledWords, undefined, "array");
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

    getWordLineCol() {
        let words = this._lines.map(line => line.split(/\s+/g));
        for (let i = 0, k = 0; i < words.length; i++) {
            for (let j = 0; j < words[i].length; j++, k++) {
                if (this.ptr === k) return [j, i]; // (x, y)
            }
        }
        return undefined;
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
                let chr = await this.getch(true);
                this.pushStack(chr);
                break;
            }
            case 9: {
                // Print
                const charCode = num(this.popStack()), char = str(String.fromCharCode(charCode));
                this.debug(`PRINT: ${charCode} ('${char}')`);
                this.print(char);
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

        let pos = this.getWordLineCol();
        if (pos !== undefined) this._callbackUpdateGrid(undefined, [pos]);
        return true;
    }

    async interpret() {
        try {
            await super.interpret();
        } catch (e) {
            console.error(e);
            throw new Error(`Error at position ${this.ptr}:\n${e}`);
        }
    }
}

export default BeatnikInterpreter;