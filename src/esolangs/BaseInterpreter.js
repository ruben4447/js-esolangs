import { sleep } from "../utils.js";

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