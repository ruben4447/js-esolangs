/**
 * Base class for a language interpreter
 * Add basic functionality that, unless extra is requires, is generally dufficient for said methods
 * i.e. The simplest interpreter would only provide an overrided `async step()` method
 */
export class BaseInterpreter {
    constructor() {
        this._code = "";
        this._debug = false;
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

    /** MUST BE OVERRIDEN */
    async step() { throw new Error(`${this.constructor.name} : async step: requires overloading`); }

    /** Interpret code. May be overwritten e.g. for error handling */
    async interpret(code) {
        if (code !== undefined) this.setCode(code);
        let cont;
        do {
            cont = await this.step();
        } while (cont);
    }
}

export default BaseInterpreter;