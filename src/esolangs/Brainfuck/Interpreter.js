import { getMatchingBracket } from '../../utils.js';
import BaseInterpreter from '../BaseInterpreter.js';
import { textToBrainfuck } from './utils.js';

export class BrainfuckInterpreter extends BaseInterpreter {
    constructor(numType, reelLength) {
        super();
        if (reelLength <= 0 || isNaN(reelLength) || !isFinite(reelLength)) throw new Error(`Invalid reel length '${reelLength}'`);
        this._ntype = numType;
        this._data = (() => {
            switch (numType) {
                case 'uint8': return new Uint8Array(reelLength);
                case 'int8': return new Int8Array(reelLength);
                case 'uint16': return new Uint16Array(reelLength);
                case 'int16': return new Int16Array(reelLength);
                case 'uint32': return new Uint32Array(reelLength);
                case 'int32': return new Int32Array(reelLength);
                default: throw new TypeError(`Unknown type ${numType}`);
            }
        })();
        this._ip = 0; // Instruction Pointer -> pointer in code
        this._dp = 0; // Data Pointer -> pointer for this._data

        this._callbackUpdateDataPointer = dp => { }; // Update data pointer
        this._callbackUpdateInstructionPointer = ip => { }; // Update instruction pointer
        this._callbackSetData = value => { }; // Update value at current ptr value
        this._callbackSetAllData = array => { }; // Reset this._data
        this._callbackOutput = () => { }; // Output character
        this._callbackGetch = () => { }; // Callback for user input. Takes Blocker object
        /** @type {(code: string, positions: number[][], format: string) => void} */
        this._callbackUpdateGrid = () => { };
    }

    get LANG() { return 'brainfuck'; }

    get ip() { return this._ip; }
    set ip(value) { this._ip = value; this._callbackUpdateInstructionPointer(value); }

    get dp() { return this._dp; }
    set dp(value) {
        if (value < 0) value = this._data.length + value % this._data.length;
        else value %= this._data.length;
        this._dp = value;
        this._callbackUpdateDataPointer(value);
    }

    getValue() { return this._data[this._dp]; }
    setValue(value) { this._data[this._dp] = value; this._callbackSetData(value); }

    /** Reset pointers, memory etc */
    reset() {
        this.ip = 0;
        this.dp = 0;
        this._data.fill(0);
        this._callbackSetAllData(this._data);
    }

    setCode(code) {
        super.setCode(this.minifyCode(code));
        this._callbackUpdateGrid(this._code, undefined);
    }

    /** Minify program */
    minifyCode(code) {
        let minified = '';
        let chars = ["<", ">", "-", "+", ".", ",", "]", "["];
        for (let char of code) {
            if (chars.indexOf(char) !== -1) minified += char;
        }
        return minified;
    }

    /** Execute code at current position. Return: continue? */
    async step() {
        if (this._ip < 0 || this._ip >= this._code.length) return false;
        switch (this._code[this._ip]) {
            case '<':
                this.dp--;
                break;
            case '>':
                this.dp++;
                break;
            case '-':
                this.setValue(this.getValue() - 1);
                break;
            case '+':
                this.setValue(this.getValue() + 1);
                break;
            case '.':
                this.print(String.fromCharCode(this.getValue()));
                break;
            case ',': {
                let chCode = await this.getch(true);
                this.setValue(chCode);
                break;
            }
            case '[':
                // Jump past matching ] if data === 0
                if (this.getValue() === 0) this.ip = getMatchingBracket(this.ip, this._code);
                break;
            case ']':
                // Jump to matching [ if data !== 0
                if (this.getValue() !== 0) this.ip = getMatchingBracket(this.ip, this._code) - 1;
                break;
        }
        this.ip++;
        this._callbackUpdateGrid(undefined, [[this.ip, 0]]);
        return true;
    }
}

BrainfuckInterpreter.textToCode = function (text) {
    return textToBrainfuck(text);
};

export default BrainfuckInterpreter;