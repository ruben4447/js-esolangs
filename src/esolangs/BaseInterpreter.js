import { ord, sleep, str } from "../utils.js";
import Blocker from "../classes/Blocker.js";

/**
 * Base class for a language interpreter
 * Add basic functionality that, unless extra is requires, is generally dufficient for said methods
 * i.e. The simplest interpreter would only provide an overrided `async step()` method
 */
export class BaseInterpreter {
    constructor() {
        this._code = "";
        this._debug = false;
        this._updateVisuals = false;
        this._execDelay = 0;
    }

    /** Get language name */
    get LANG() { throw new Error(`${this.constructor.name}: get LANG: overload expected`); }

    setCode(code) { this._code = code; }
    getCode() { return this._code; }

    /** Expected to be overriden, but may not */
    reset() { }

    /** Debug message */
    debug(...args) {
        if (this._debug) console.log(...args);
    }
    debugWarn(...args) {
        if (this._debug) console.warn(...args);
    }

    /**
     * Get single input from user
     * @param {boolean} asciiCode Return GETCH'd character as its ASCII code?
     * @returns {Promise<string | number>}
    */
    async getch(asciiCode = false) {
        if (typeof this._callbackGetch !== 'function') return asciiCode ? -1 : ''; // Return EOF flag
        const blocker = new Blocker();
        this._callbackGetch(blocker);
        let input = await blocker.block(); // Block code execution until input is recieved
        if (asciiCode) {
            return input.length === 0 ? -1 : ord(input);
        } else {
            return input;
        }
    }

    /** Get input from the user
     * @returns {Promise<string>}
    */
    async input() {
        if (typeof this._callbackInput !== 'function') return '';
        const blocker = new Blocker();
        this._callbackInput(blocker);
        let input = await blocker.block();
        return input;
    }

    /** Print given text to screen */
    print(msg) {
        if (typeof this._callbackOutput !== 'function') throw new Error(`Call to 'print' without registered callback handler`);
        this._callbackOutput(str(msg));
    }

    /** MUST BE OVERRIDEN */
    async step() { throw new Error(`${this.constructor.name} : async step: requires overloading`); }

    /** Interpret code. May be overwritten e.g. for error handling */
    async interpret() {
        let cont;
        do {
            cont = await this.step();
            if (this._execDelay !== 0) await sleep(this._execDelay);
        } while (cont);
    }
}

export default BaseInterpreter;