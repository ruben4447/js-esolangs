import BrainfuckInterpreter from "./esolangs/Brainfuck/Interpreter.js";
import ElementInterpreter from "./esolangs/Element/Interpreter.js";
import LengthInterpreter from "./esolangs/Length/Interpreter.js";
import BefungeInterpreter from "./esolangs/Befunge/Interpreter.js";
import SlashesInterpreter from "./esolangs/Slashes/Interpreter.js";
import BeatnikInterpreter from "./esolangs/Beatnik/Interpreter.js";
import AirlineFoodInterpreter from "./esolangs/Airline-food/Interpreter.js";
import { num } from "./utils.js";

var interpreter; // Code interpreter
var activeBlocker; // Blocker object. May be resolve by cmd:'unblock'
var interpreting = false;
const statusStack = [];
var codeCache; // Store code from 'loadCode' event

function pushStatus(status) {
    statusStack.push(status);
    self.postMessage({ cmd: 'status', status });
}
function popStatus() {
    let status = '-';
    if (statusStack.length !== 0) {
        statusStack.pop();
        if (statusStack.length !== 0) status = statusStack[0];
    }
    self.postMessage({ cmd: 'status', status });
}

/** Create esolang interpreter  */
function createInterpreter(lang, opts) {
    let i;
    if (lang === "brainfuck") {
        i = new BrainfuckInterpreter(opts.numType, opts.reelLength);
        if (opts.updateVisuals) {
            i._callbackUpdateInstructionPointer = value => {
                self.postMessage({ cmd: 'updateInstructionPtr', value });
                self.postMessage({ cmd: 'updateObject', name: 'pointers', action: 'set', key: 'ip', value });
            };
            i._callbackUpdateDataPointer = value => {
                self.postMessage({ cmd: 'updateDataPtr', value });
                self.postMessage({ cmd: 'updateObject', name: 'pointers', action: 'set', key: 'data', value });
            };
            i._callbackSetData = value => self.postMessage({ cmd: 'updateData', value });
            i._callbackSetAllData = value => self.postMessage({ cmd: 'updateAllData', value });
        }
    } else if (lang === 'element') {
        i = new ElementInterpreter();
        i.autovivification = opts.autovivification === true;
        if (opts.updateVisuals) {
            i._callbackUpdateStack = (stack, type, value) => self.postMessage({ cmd: 'updateStack', stack, type, value });
            i._callbackUpdateVars = (symbol, action, value) => self.postMessage({ cmd: 'updateObject', name: 'vars', key: symbol, action, value });
            i._callbackUpdatePos = value => self.postMessage({ cmd: 'updateObject', name: 'pointers', action: 'set', key: 'ip', value });
        }
    } else if (lang === 'length') {
        i = new LengthInterpreter();
        i.comments = opts.comments === true;
        if (opts.updateVisuals) {
            i._callbackUpdateStack = (type, value) => self.postMessage({ cmd: 'updateStack', type, value });
            i._callbackUpdateLineN = value => self.postMessage({ cmd: 'updateObject', name: 'pointers', action: 'set', key: 'ip', value });
        }
    } else if (lang === 'befunge') {
        i = new BefungeInterpreter();
        i.wrapLimit = num(opts.wrapLimit);
        i.selfModification = opts.selfModification === true;
        if (opts.updateVisuals) {
            i._callbackUpdateStack = (type, value) => self.postMessage({ cmd: 'updateStack', type, value });
            i._callbackUpdatePtr = (key, value) => self.postMessage({ cmd: 'updateObject', name: 'pointers', action: 'set', key, value });
        }
    } else if (lang === 'slashes') {
        i = new SlashesInterpreter();
        if (opts.updateVisuals) {
            i._callbackChangeData = (key, value) => self.postMessage({ cmd: 'updateObject', name: 'data', action: 'set', key, value, });

        }
    } else if (lang === 'beatnik') {
        i = new BeatnikInterpreter();
        if (opts.updateVisuals) {
            i._callbackUpdatePtr = ptr => self.postMessage({ cmd: 'updateObject', action: 'set', name: 'vars', key: 'ptr', value: ptr });
            i._callbackUpdateStack = (type, value) => self.postMessage({ cmd: 'updateStack', type, value });
        }
    } else if (lang === 'airlineFood') {
        i = new AirlineFoodInterpreter();
        i.errorNearLength = num(opts.errorNearLength);
        i.outputNumbers = opts.outputNumbers === true;
        if (opts.updateVisuals) {
            i._callbackUpdateObject = (name, action, key, value) => self.postMessage({ cmd: 'updateObject', action, name, key, value });
            i._callbackUpdateStack = (type, value) => self.postMessage({ cmd: 'updateStack', type, value });
        }
    } else {
        throw new TypeError(`Unknown language '${lang}'`);
    }
    // Add common callbacks
    if (i._callbackOutput) i._callbackOutput = msg => self.postMessage({ cmd: 'print', msg }); // PRINT MESSAGE
    if (i._callbackGetch) { // REQUEST SINGLE CHARACTER INPUT
        i._callbackGetch = b => {
            pushStatus('Requesting GETCH...');
            activeBlocker = b;
            self.postMessage({ cmd: 'reqGetch' });
        };
    }
    if (i._callbackInput) {
        i._callbackInput = b => {
            activeBlocker = b;
            pushStatus('Requesting Input...');
            self.postMessage({ cmd: 'reqInput' });
        };
    }
    if (opts.updateVisuals && i._callbackUpdateCode) i._callbackUpdateCode = () => self.postMessage({ cmd: 'setCode', code: i.getCode() });
    i._debug = opts.debug === true;
    postMessage("Created interpreter for " + i.LANG);

    // Load code if there is any in the cache
    if (codeCache !== undefined) {
        loadCode(codeCache);
        codeCache = undefined;
    }

    return i;
}

globalThis.onmessage = async (event) => {
    const data = event.data;
    if (data.cmd) {
        if (data.cmd === 'setEsolang') {
            try {
                interpreter = createInterpreter(data.lang, data.opts);
                const payload = { cmd: 'setEsolang', lang: data.lang, updateVisuals: data.opts.updateVisuals };
                if (data.opts.updateVisuals && interpreter instanceof BrainfuckInterpreter) payload.numArray = interpreter._data;
                self.postMessage(payload); // Render stuff on main thread
            } catch (e) {
                console.error(e);
                let error = new Error(`Error whilst creating interpreter for '${data.lang}':\n${e}`);
                postMessage({ cmd: 'error', error });
            }
        } else if (data.cmd === 'loadCode') {
            loadCode(data.code);
        } else if (data.cmd === 'btnPress') {
            // Press button in CodeInput
            switch (data.btn) {
                case 'reset':
                    interpreter.reset();
                    postMessage({ cmd: 'print', msg: `> interpreter reset --lang "${interpreter.LANG}"\n` });
                    break;
                case 'minify': {
                    postMessage({ cmd: 'print', msg: `> interpreter minify --lang "${interpreter.LANG}" --file ./userInput\n` });
                    if (typeof interpreter.minifyCode === 'function') {
                        let code = interpreter.minifyCode(data.args.code);
                        postMessage({ cmd: 'minifiedCode', code, });
                    } else {
                        postMessage({ cmd: 'error', error: new TypeError(`Unable to minify code: interpreter provides no method`) });
                    }
                    break;
                }
                case 'interpret':
                    // Interpret until termination
                    await interpret(data.args.code);
                    break;
                case 'step':
                    await step();
                    break;
                case 'textToCode': {
                    textToCode(data.args.text);
                    break;
                }
                case 'toShorthand': {
                    codeToShorthand();
                    break;
                }
                case 'fromShorthand': {
                    codeFromShorthand(data.args.code);
                    break;
                }
                default:
                    throw new Error(`cmd:'buttonPress': Unknown button '${data.btn}'`);
            }
        } else if (data.cmd === 'unblock') {
            // Request unblock of "activeBlocker"
            if (activeBlocker) {
                activeBlocker.unblock(data.value);
                activeBlocker = undefined;
                if (data.unpushStatus !== false) popStatus();
            } else {
                throw new Error(`Command 'unblock': no active block to unblock`);
            }
        } else {
            console.log(event);
            throw new Error(`Worker: unknown command '${data.cmd}'`);
        }
    } else {
        console.log(event);
        throw new Error(`Worker: Unknown event`);
    }
};

/** Try loading code */
function loadCode(code) {
    if (interpreter) {
        try {
            interpreter.setCode(code);
        } catch (e) {
            console.error(e);
            const error = new Error(`Error whilst loading ${interpreter.LANG} code:\n${e}`);
            postMessage({ cmd: 'error', error });
        }
    } else {
        codeCache = code;
    }
}

/** Interpret code given */
async function interpret(code) {
    if (interpreting) throw new Error(`Worker is already busy interpreting!`);
    interpreting = true;
    postMessage({ cmd: 'print', msg: `\n> interpreter execute --lang "${interpreter.LANG}" --file ./userInput\n` });
    pushStatus(`Interpreting ${interpreter.LANG}`);
    let error, timeStart = Date.now();
    try {
        await interpreter.interpret(code);
    } catch (e) {
        error = e;
    }
    if (error) self.postMessage({ cmd: 'error', error });
    let timeEnd = Date.now() - timeStart, str = `Execution terminated with exit code ${error === undefined ? 0 : 1} (${timeEnd} ms)`;
    postMessage({ cmd: 'print', msg: '\n... ' + str });
    popStatus();
    interpreting = false;
}

/** Interpret: One Step */
async function step() {
    // Interpret one step only
    if (interpreting) throw new Error(`Worker is already busy interpreting!`);
    interpreting = true;
    pushStatus(`Stepping ${interpreter.LANG}`);
    let error, cont;
    try {
        cont = await interpreter.step();
    } catch (e) {
        error = e;
    }
    popStatus();
    if (error) self.postMessage({ cmd: 'error', error });
    if (!cont) self.postMessage({ cmd: 'print', msg: `Execution complete.\n` });
    interpreting = false;
}

function textToCode(text) {
    postMessage({ cmd: 'print', msg: "> interpreter --from-text ./userText.txt --lang " + interpreter.LANG + "\n" });
    if (interpreter && typeof interpreter.constructor.textToCode === 'function') {
        let code = interpreter.constructor.textToCode(text);
        postMessage({ cmd: 'textToCode', lang: interpreter.LANG, code });
    } else {
        let error = new Error(`Process could not be found`);
        postMessage({ cmd: 'error', error });
    }
}

function codeToShorthand() {
    postMessage({ cmd: 'print', msg: "> interpreter --to-shorthand ./userInput --lang " + interpreter.LANG + "\n" });
    if (interpreter && typeof interpreter.toShorthand === 'function') {
        try {
            let code = interpreter.toShorthand();
            postMessage({ cmd: 'displayTextareaPopup', title: `Shorthand ${interpreter.LANG}`, text: code });
        } catch (e) {
            console.error(e);
            let error = new Error(`Error whilst converting ${interpreter.LANG} to shorthand:\n${e}`);
            postMessage({ cmd: 'error', error });
        }
    } else {
        let error = new Error(`Process could not be found`);
        postMessage({ cmd: 'error', error });
    }
}

function codeFromShorthand(shorthand) {
    postMessage({ cmd: 'print', msg: "> interpreter --from-shorthand ./userText.txt --lang " + interpreter.LANG + "\n" });
    if (interpreter && typeof interpreter.fromShorthand === 'function') {
        try {
            let code = interpreter.fromShorthand(shorthand);
            postMessage({ cmd: 'displayTextareaPopup', title: `${interpreter.LANG}`, text: code });
        } catch (e) {
            console.error(e);
            let error = new Error(`Error whilst converting from ${interpreter.LANG} shorthand:\n${e}`);
            postMessage({ cmd: 'error', error });
        }
    } else {
        let error = new Error(`Process could not be found`);
        postMessage({ cmd: 'error', error });
    }
}