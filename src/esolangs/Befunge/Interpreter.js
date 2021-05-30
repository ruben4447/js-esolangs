import { Stack } from '../../classes/Stack.js';
import { num, padLines, randomChoice, regexNumber, regexWhitespace, str, strReplaceAt } from '../../utils.js';
import Blocker from '../../classes/Blocker.js';

export class BefungeInterpreter {
    constructor() {
        this._code = "";
        this._lines = [];
        this._stack = new Stack();
        this.debug = false;
        this.selfModification = true; // Allow 'g' and 'p' commands
        
        this._x = 0; // X position
        this._y = 0; // Y position
        this._mx = 1; // Movement of X
        this._my = 0; // Movement of Y
        this._inString = 0; // Are we in a string?
        this._wrapCount = 0; // Wrap count
        this.wrapLimit = 1000;

        /** @type {(type: "push" | "pop" | "empty" | "update", value?: any) => void} */
        this._callbackUpdateStack = (type, value) => {};
        /** @type {(name: string, value: number) => void} */
        this._callbackUpdatePtr = (d, value) => {};
         /** @type {(value: string) => void} */
        this._callbackOutput = value => {};
        /** @type {(mode: "getch" | "input", block: Blocker) => void} */
        this._callbackInput = (mode, block) => {};
    }

    get LANG() { return "befunge"; }

    get x() { return this._x; }
    set x(x) { this._x = x; this._callbackUpdatePtr("x", x); }

    get y() { return this._y; }
    set y(y) { this._y = y; this._callbackUpdatePtr("y", y); }

    get mx() { return this._mx; }
    set mx(mx) { this._mx = mx; this._callbackUpdatePtr("mx", mx); }

    get my() { return this._my; }
    set my(my) { this._my = my; this._callbackUpdatePtr("my", my); }

    get inString() { return this._inString; }
    set inString(n) { this._inString = n ? 1 : 0; this._callbackUpdatePtr("str", this._inString); }

    get wrapCount() { return this._wrapCount; }
    set wrapCount(n) { this._wrapCount = n; /* this._callbackUpdatePtr("wrap", n); */ }

    reset() {
        this.x = 0;
        this.y = 0;
        this.mx = 1;
        this.my = 0;
        this.inString = false;
        this.wrapCount = 0;
        this._stack.dump();
        this._callbackUpdateStack("empty");
    }

    setCode(code) {
        this._code = code;
        this._lines = code.split(/\r\n|\r|\n/g);
        padLines(this._lines, ' '); // Make every line the same length
    }

    pushStack(value) { this._stack.push(value); this._callbackUpdateStack("push", value); }
    popStack() { this._callbackUpdateStack("pop"); return this._stack.pop(); }

    /** Return character at requested position. */
    get() {
        if (this.outOfBounds()) {
            throw new Error(`Cannot get character at (${this._x},${this._y})`);
        } else {
            return this._lines[this._y][this._x];
        }
    }

    /** Are we out-of-bounds? */
    outOfBounds() {
        if (this._y < 0 || this._y >= this._lines.length || this._x < 0 || this._x >= this._lines[this._y].length) return true;
        return false;
    }

    /** Alter movment values according to char */
    changeMov(c) {
        if (c == '<') {
            this.mx = -1;
            this.my = 0;
        } else if (c == '>') {
            this.mx = 1;
            this.my = 0;
        } else if (c == '^') {
            this.mx = 0;
            this.my = -1;
        } else if (c == 'v') {
            this.mx = 0;
            this.my = 1;
        } else {
            throw new Error(`SYNTAX ERROR: Unknown movement operation '${c}'`);
        }
    }

    async step() {
        const oldWrapCount = this.wrapCount;
        if (this.y < 0) {
            this.y = this._lines.length - 1;
            this.wrapCount++;
            if (this.debug) console.log(`Wrap y cond 1 : ${this.y}`);
        } else if (this.y >= this._lines.length) {
            this.y = 0;
            if (this.debug) console.log(`Wrap y cond 2 : ${this.y}`);
            this.wrapCount++;
        }
        if (this.x < 0) {
            this.x = this._lines[this.y].length - 1;
            this.wrapCount++;
            if (this.debug) console.log(`Wrap x cond 1 : ${this.x}`);
        } else if (this.x >= this._lines[this.y].length) {
            this.x = 0;
            this.wrapCount++;
            if (this.debug) console.log(`Wrap x cond 2 : ${this.x}`);
        }

        // Check wrap count
        if (this.wrapCount !== oldWrapCount) {
            if (this.wrapCount > this.wrapLimit) {
                throw new Error(`RUNTIME ERROR: Wrap limit breached (${this.wrapLimit}) at position (${this._x},${this._y}), movement (${this._mx},${this._my})`);
            } else {
                return true;
            }
        } else {
            const c = this._lines[this._y][this._x];
            if (this.debug) console.log(`Char '${c}' at (${this._x},${this._y}) movVec (${this._mx},${this._my})`);

            // Reset reflection count if not direction control or invisible newline
            if (!this.inString && c !== '<' && c !== '>' && c !== '^' && c !== 'v' && c !== '\n' && c !== '\r') {
                this.wrapCount = 0;
            }

            if (c === '"') {
                this.inString = !this.inString;
                if (this.debug) console.log(`\tIn String: ${this.inString}`);
            } else if (this.inString) {
                this.pushStack(num(c.charCodeAt(0))); // Push ASCII value of character
                if (this.debug) console.log(`\tPush char code for '${c}' : ${this._stack.top()}`);
            } else if (regexNumber.test(c)) {
                this.pushStack(num(c)); // Push integer
            } else if (regexWhitespace.test(c)) {
                // No-op
            } else if (c === '@') {
                return false; // HALT instruction
            } else if (c === '+') {
                // Add b + a
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b + a);
            } else if (c === '-') {
                // Subtract b - a
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b - a);
            } else if (c === '*') {
                // Multiply b * a
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b * a);
            } else if (c === '/') {
                // Divide b / a
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b / a);
            } else if (c === '%') {
                // Modulus b % a
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(b % a);
            } else if (c === '!') {
                // Logical NOT
                const a = num(this.popStack());
                this.pushStack((a === 0) ? 1 : 0);
            } else if (c === '`') {
                // Greater than (b > a)
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack((b > a) ? 1 : 0);
            } else if (c === '<' || c === '>' || c === '^' || c === 'v') {
                // Position change
                this.changeMov(c);
            } else if (c === '?') {
                // Random position change
                const pc = randomChoice(['<', '>', '^', 'v']);
                this.changeMov(pc);
            } else if (c === '_') {
                // Horizontal IF
                const a = num(this.popStack());
                this.changeMov((a === 0) ? '>' : '<');
            } else if (c === '|') {
                // Vertical IF
                const a = num(this.popStack());
                this.changeMov((a === 0) ? 'v' : '^');
            } else if (c === ':') {
                // Duplicate
                let v = num(this._stack.top());
                this.pushStack(v);
            } else if (c === '\\') {
                // Swap top two values
                const a = num(this.popStack()), b = num(this.popStack());
                this.pushStack(a);
                this.pushStack(b);
            } else if (c === '$') {
                // Pop
                this.popStack();
            } else if (c === '.') {
                // Print as Number
                this._callbackOutput(str(num(this.popStack())));
            } else if (c === ',') {
                // Print as ASCII character
                this._callbackOutput(str(String.fromCharCode(num(this.popStack()))));
            } else if (c === '#') {
                this.x += this.mx;
                this.y += this.my;
            } else if (c === '&') {
                // Get integer from user
                const blocker = new Blocker();
                this._callbackInput("input", blocker); // Request input (callback will call blocker.unblock(<value>))
                const input = await blocker.block(); // Wait for input
                this.pushStack(num(input));
            } else if (c === '~') {
                // Get character from user, push ASCII code
                const blocker = new Blocker();
                this._callbackInput("getch", blocker); // Request getch (callback will call blocker.unblock(<value>))
                const input = await blocker.block(); // Wait for input
                this.pushStack(num(str(input).charCodeAt(0)));
            } else if (this.selfModification && c === 'g') {
                // throw new Error(`IMPLEMENTATION ERROR: operator 'g' is not implemented`);
                let y = num(this.popStack()), x = num(this.popStack()), n;
                try {
                    n = str(this._lines[y][x]).charCodeAt(0); // Attempt to get character at specifide position...
                } catch (e) {
                    n = 0; // If cannot, push 0 to the stack
                }
                this.pushStack(num(n));
            } else if (this.selfModification && c === 'p') {
                // throw new Error(`IMPLEMENTATION ERROR: operator 'p' is not implemented`);
                let y = num(this.popStack()), x = num(this.popStack()), val = num(this.popStack());
                try {
                    if (y < 0 || y >= this._lines.length) throw new Error(`Y position '${y}' is out of bounds`);
                    if (x < 0 || x >= this._lines[y].length) throw new Error(`X position '${x}' is out of bounds`);
                    this._lines[y] = strReplaceAt(this._lines[y], x, str(String.fromCharCode(val)));
                } catch (e) {
                    throw new Error(`PUT: unable to place value '${val}' at (${x},${y}):\n${e}`);
                }
            } else {
                throw new Error(`SYNTAX ERROR: unknown character '${c}'`);
            }

            // Apply movement vector
            if (this.mx === 0 && this.my === 0) throw new Error(`RUNTIME ERROR: movement vector is zero`);
            if (this.debug) console.log(`Apply movVector: x = ${this.x} + ${this.mx}; y = ${this.y} + ${this.my}`);
            this.x += this.mx;
            this.y += this.my;

            return true;
        }
    }

    async interpret(code) {
        if (code !== undefined) this.setCode(code);
        try {
            let cont;
            do {
                cont = await this.step();
            } while (cont);
        } catch (e) {
            throw new Error(`Befunge: error at position (${this.mx},${this.my}) '${this.get()}':\n ${e}`);
        }
    }
}

export default BefungeInterpreter;