import BaseInterpreter from "../BaseInterpreter.js";
import { Stack } from "../../classes/Stack.js";
import Blocker from "../../classes/Blocker.js";
import { extractUntil, underlineStringPortion, num, regexWhitespace, str } from "../../utils.js";
import { constructBlockMap } from "./utils.js";

export class AirlineFoodInterpreter extends BaseInterpreter {
    constructor() {
        super();
        this._stack = new Stack();
        /** @type {{ [varName: string]: number }} */
        this._varLookup = {};
        this._blockMap = {}; // Map "So..." to "Moving On..." and vica versa
        this._ip = 0; // Position in code
        this._sp = -1; // Position i stack
        this.errorNearLength = 30;
        this.outputNumbers = false; // Alter behavious of "See?" command
        this._matchedText = ""; // Text matches by this.matchText()

        this._callbackUpdateObject = () => { };
        this._callbackUpdateStack = () => { };
        this._callbackOutput = () => { };
        this._callbackInput = () => { };
    }

    get LANG() { return "Airline Food"; }

    get ip() { return this._ip; }
    set ip(pos) { this._ip = pos; this._callbackUpdateObject("pointers", "set", "ip", pos); }
    get sp() { return this._sp; }
    set sp(ptr) { this._sp = ptr; this._callbackUpdateObject("pointers", "set", "sp", ptr); }

    reset() {
        this.ip = 0;
        this.sp = -1;
        this._stack.dump();
        this._callbackUpdateStack("empty");
        this._blockMap = {};
        this._varLookup = {};
        this._callbackUpdateObject("lookup", "clear");
        this._matchedText = '';
    }

    setCode(code) {
        super.setCode(code);
        this._blockMap = constructBlockMap(this._code);
    }

    pushStack(value) { this._stack.push(value); this._callbackUpdateStack("push", value); }
    popStack() { this._callbackUpdateStack("pop"); return this._stack.pop(); }
    setStack(index, value) { this._stack.set(index, value); this._callbackUpdateStack("update", this._stack._); }
    checkSP() {
        if (this.sp < 0) throw new Error(`Stack Underflow: stack pointer is below bounds of the stack -> ${this.sp}`);
        if (this.sp > this._stack.size() - 1) throw new Error(`Stack Overflow: stack pointer is above bounds of the stack -> ${this.sp}`);
        return true;
    }
    setVar(varName, value) { this._varLookup[varName] = value; this._callbackUpdateObject("lookup", "set", varName, value); }

    /** Consume given text. Return if it was present */
    matchText(text) {
        let m = this._code.substr(this.ip).startsWith(text);
        if (m) this._matchedText = text;
        return m;
    }

    /** Consume all whitespace. */
    consumeWhitespace() {
        while (this._code[this.ip] && this._code[this.ip].match(regexWhitespace)) {
            this.ip++;
        }
    }

    /** Extract variable name */
    extractVar(stopChar, allowAnonymous = true) {
        let variable = extractUntil(this._code.substr(this.ip), stopChar); // Extract variable name.
        if (variable === null) throw new Error(`'${stopChar}' expected.`);
        if (variable === "") throw new Error(`Expected variable name, got '${stopChar}'`);
        if (!allowAnonymous && variable === 'airline food') throw new Error(`An anonymous variable is not permitted here`);
        return variable;
    }

    /** Get line col from vertical index */
    getLineCol() {
        let line = 0, col = 0;
        for (let i = 0; i < this.ip; i++) {
            col++;
            if (this._code[i] === '\n') {
                line++;
                col = 0;
            }
        }
        return { line, col };
    }

    debug(...args) {
        super.debug(`"${this._matchedText}" : `, ...args);
    }

    async step() {
        this.consumeWhitespace();
        if (this.ip >= this._code.length) return false;

        // == Variable initialisation
        if (this.matchText("You ever notice ") || this.matchText("What's the deal with ")) {
            this.ip += this._matchedText.length; // Increment IP past instruction

            let stopChar = '?', varName = this.extractVar(stopChar, true); // Extract variable
            if (varName in this._varLookup) throw new Error(`Variable '${varName}' already exists`); // Variable already exists?

            if (varName !== 'airline food') this.setVar(varName, this._stack.size()); // Set reference to top of stack (if not anonymous)
            this.pushStack(1); // Initialise to 1
            if (this._matchedText === "What's the deal with ") this.sp = this._stack.size() - 1; // Set sp to point to variable {varName}

            this.debug(`Initialise variable '${varName}' to 1 (sp: ${this.sp})`);
            this.ip += varName.length + stopChar.length; // Increment past varName and stopChar
        }

        // == Decrement pointer
        else if (this.matchText("Um,")) {
            this.ip += this._matchedText.length; // Increment IP
            if (this.sp > 0) this.sp--; // Decrement if possible

            this.debug(`Decrement stack pointer - ${this.sp}`);
        }

        // == Increment pointer
        else if (this.matchText("Yeah,")) {
            this.ip += this._matchedText.length; // Increment IP
            if (this.sp < this._stack.size() - 1) this.sp++; // Increment if possible

            this.debug(`Increment stack pointer - ${this.sp}`);
        }

        // == Set stack pointer
        else if (this.matchText("Let's talk about ")) {
            this.ip += this._matchedText.length; // Increment past instruction

            let stopChar = '.', varName = this.extractVar(stopChar, false); // Extract variable
            if (!(varName in this._varLookup)) throw new Error(`Cannot resolve variable '${varName}'`);
            this.sp = this._varLookup[varName]; // Point to variable

            this.debug(`Set stack pointer to var '${varName}' -> ${this.sp}`);
            this.ip += varName.length + stopChar.length; // Increment IP
        }

        // == Arithmetic
        else if (this.matchText("It's kinda like ") || this.matchText("Not like ") || this.matchText("Just like ")) {
            this.ip += this._matchedText.length; // Increment past instruction

            let stopChar = '.', varName = this.extractVar(stopChar, false);
            if (!(varName in this._varLookup)) throw new Error(`Cannot resolve variable '${varName}'`);
            this.checkSP();

            let ans; // Result of operation
            if (this._matchedText === "Not like ") ans = num(this._stack.get(this.sp)) - num(this._stack.get(this._varLookup[varName]));
            else if (this._matchedText === "Just like ") ans = num(this._stack.get(this.sp)) * num(this._stack.get(this._varLookup[varName]));
            else ans = num(this._stack.get(this.sp)) + num(this._stack.get(this._varLookup[varName]));
            this.debug(`Arithmetic: ${this._stack.get(this.sp)} and '${varName}' (${this._stack.get(this._varLookup[varName])}) = ${ans}`);
            this.setStack(this.sp, ans);

            this.ip += varName.length + stopChar.length; // Increment IP
        }

        // == Input
        else if (this.matchText("Right?")) {
            this.checkSP();

            const blocker = new Blocker();
            this._callbackInput(blocker);
            let input = await blocker.block(); // Block code execution until input is recieved
            this.setStack(this.sp, num(input)); // Set value

            this.ip += this._matchedText.length; // Increment IP
        }

        // == Output
        else if (this.matchText("See?")) {
            this.checkSP();

            let number = num(this._stack.get(this.sp)),
                string = (!this.outputNumbers && number >= 0 && number <= 0xFFFF) ? String.fromCharCode(number) : number;
            this._callbackOutput(str(string));
            this.ip += this._matchedText.length; // Increment IP

            this.debug(`Output value ${number} ('${string}')`);
        }

        // == Loop start
        else if (this.matchText("So...")) {
            let moveOn = this._blockMap[this.ip]; // Get closing "Move on..." position
            if (moveOn === -1) throw new Error(`SYNTAX ERROR: Encountered "So..." without matching "Moving on..." (unclosed code block)`);

            this.checkSP();
            if (this._stack.get(this.sp) === 0) {
                this.ip = moveOn; // Jump code block
                this.debug(`Value is ${this._stack.get(this.sp)} : jump to ${moveOn}`);
            } else {
                this.ip += this._matchedText.length; // Increment IP
                this.debug(`Value is ${this._stack.get(this.sp)} : do not jump`);
            }
        }

        // == Loop end
        else if (this.matchText("Moving on...")) {
            // throw new Error(`IMPLEMENTATION ERROR: loops are not implemented (Move on...)`);
            let so = this._blockMap[this.ip]; // Get opening "So..." position
            if (so === -1) throw new Error(`SYNTAX ERROR: Encountered "Moving on..." without matching "So..." (unmatched code block)`);

            this.checkSP();
            if (this._stack.get(this.sp) !== 0) {
                this.ip = so;
                this.debug(`Value is ${this._stack.get(this.sp)} : jump to ${so}`);
            } else {
                this.ip += this._matchedText.length; // Increment IP
                this.debug(`Value is ${this._stack.get(this.sp)}`);
            }
        }

        // == ?
        else throw new Error(`Invalid syntax.`);

        return true;
    }

    async interpret() {
        try {
            await super.interpret();
        } catch (e) {
            console.error(e);
            let len = this.errorNearLength, near = this._code.substr(this.ip, len), { line, col } = this.getLineCol();
            near = underlineStringPortion(near, this.ip);
            let divider = '-'.repeat(35);
            let main = `Error at position ${this.ip} (line ${line + 1}, col ${col + 1})\n`;
            if (this._matchedText.length !== 0) main += `  Whilst processing instruction "${this._matchedText}"\n`;
            if (near.length === 0)
                throw new Error(`${main}n${e}`);
            else
                throw new Error(`${main}\n${divider}\n${near}\n${divider}\n${e}`);
        }
    }
}

export default AirlineFoodInterpreter;