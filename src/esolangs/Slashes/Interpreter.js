import { stringReplace } from "../../utils.js";

export class SlashesInterpreter {
    constructor() {
        this._code = '';
        this.debug = false;
        this._pattern = '';
        this._replacement = '';

        this._callbackOutput = () => {};
        this._callbackUpdateCode = () => {};
        /** @type {(name: string, value: string | number) => void} */
        this._callbackChangeData = () => {};
    }

    get LANG() { return 'slashes'; }

    get pattern() { return this._pattern; }
    set pattern(value) { this._pattern = value; this._callbackChangeData("pat", value); }
    get replacement() { return this._replacement; }
    set replacement(value) { this._replacement = value; this._callbackChangeData("rep", value); }

    setCode(code) { this._code = code; }
    getCode() { return this._code; }

    reset() {
        this.pattern = '';
        this.replacement = '';
    }

    async step() {
        if (this.pattern.length === 0) {
            // Extract pattern and replacement
            const shift = () => this._code = this._code.substr(1); // Remove first character from this._code
            let toPrint = '', args = ["", ""]; // thing to print, [pattern, replacement]
            for (let s = 0; s < 3; s++) { // Loop throught states: PRINT, PATTERN, SUB
                while (this._code.length !== 0) {
                    if (this._code[0] === '/') { shift(); break; } // Step onto next state
                    if (this._code[0] === '\\') { shift(); } // Skip next char as it is "escaped"
                    if (s) { args[s - 1] += this._code[0]; shift(); } // If not in PRINT state, add char to respective arg (PATTERN:1 or REPLACEMENT:2)
                    else { toPrint += this._code[0]; shift(); }
                }
            }
            if (toPrint.length !== 0) this._callbackOutput(toPrint); // Print stuff (do it in one go to avoid latency on main thread)
            if (this.debug) console.log(`Print '${toPrint}'; pattern '${args[0]}'; replacement '${args[1]}'; string '${this._code}'`);
            this.pattern = args[0];
            this.replacement = args[1];
        } else {
            // Substitute once
            if (this._code.length !== 0 && this._code.includes(this._pattern)) {
                this._code = this._code.replace(this._pattern, this._replacement);
                this._callbackUpdateCode();
            } else {
                this.pattern = '';
                this.replacement = '';
            }
        }
        // while (this._code.length !== 0 && this._code.includes(args[0])) this._code = this._code.replace(args[0], args[1]); // Replace PATTERN with REPLACEMENT as many times as possible
        // if (this.debug) console.log(` -> '${this._code}'`);
        return this._code.length !== 0;
    }

    async interpret(code) {
        if (code !== undefined) this.setCode(code);
        let cont;
        do {
            cont = await this.step();
        } while (cont);
    }
}

export default SlashesInterpreter;