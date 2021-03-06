import { createObjectFromType, num } from "./utils.js";
import Popup from './classes/Popup.js';
import { createFieldset } from './utils.js';
import { langOptions } from './esolangs/config.js';
import { userControl, ioconsole } from './main.js';

// == ELEMENT WHICH APP SHALL BE DEPLOYED INTO ==
export const main = document.createElement('div');
// == CURRENT ESOLANG SELECTED ==
export var esolang = null;
// == CURRENT EXECUTION DELAY ==
export var execDelay = 0;
// == Components -> { [name: string]: object } ==
var components = {};
globalThis.components = components;
// == INTERPRETER WORKER ==
export var interpreterWorker;
// == DOM ELEMENT FOR STATUS ==
export const elStatus = document.createElement("code");
// == UPDATE CODE GRID? ==
var codeGridEnabled = true;

export function createInterpreterWorker() {
    if (interpreterWorker === undefined) {
        interpreterWorker = new Worker('src/interpret.worker.js', { type: 'module' }); // Worker which will manage esolang code execution
        interpreterWorker.onerror = function (event) {
            console.error("ERROR IN WORKER:\n", event);
        };
        interpreterWorker.onmessage = event => {
            const data = event.data;
            if (typeof data == 'string') {
                console.log(`%c[From Worker]%c ${data}`, 'font-style:italic;color:grey;', '');
            } else {
                switch (data.cmd) {
                    case 'error':
                        console.error(data.error);
                        ioconsole.error(data.error.message);
                        break;
                    case 'print':
                        ioconsole.print(data.msg);
                        break;
                    case 'status':
                        elStatus.innerText = data.status || '?';
                        break;
                    case 'setEsolang':
                        // Response from event 'setEsolang' wherein Worker sets-up the interpreter
                        prepareEsolangGUI(data.lang, data.updateVisuals);
                        if (data.numArray) {
                            components.dataReel.setReel(data.numArray);
                            components.dataReel.setPtr(0);
                        }
                        break;
                    case 'setCode':
                        // Set code in userControl
                        setCode(data.code);
                        break;
                    case 'interpreterResponse':
                        let str = `Execution terminated with exit code ${data.ok ? 0 : 1} (${data.time} ms)`;
                        ioconsole.newline(str + '\n');
                        if (data.error) console.error(data.error);
                        break;
                    case 'updateInstructionPtr':
                        // Unhandled
                        break;
                    case 'updateDataPtr':
                        components.dataReel.setPtr(data.value);
                        break;
                    case 'updateData':
                        components.dataReel.setValue(data.value);
                        break;
                    case 'updateAllData':
                        components.dataReel._reel = data.value;
                        components.dataReel.updateAll();
                        break;
                    case 'minifiedCode':
                        userControl.setCode(data.code);
                        break;
                    case 'reqGetch':
                        ioconsole.getch()
                            .then(chr => {
                                interpreterWorker.postMessage({ cmd: 'unblock', value: chr, });
                            });
                        break;
                    case 'reqInput':
                        ioconsole.input()
                            .then(input => {
                                interpreterWorker.postMessage({ cmd: 'unblock', value: input, });
                            });
                        break;
                    case 'textToCode': {
                        const div = document.createElement('div');

                        const textarea = document.createElement('textarea');
                        div.appendChild(textarea);
                        textarea.rows = 30;
                        textarea.cols = 66;
                        textarea.value = data.code;

                        div.insertAdjacentHTML('beforeend', '<br>');
                        const btn = document.createElement('button');
                        btn.innerText = 'Insert into Code Input';
                        btn.addEventListener('click', () => {
                            userControl.setCode(userControl.getCode() + data.code);
                        });
                        div.appendChild(btn);

                        const popup = new Popup("Text to " + data.lang).setContent(div).show();
                        break;
                    }
                    case 'updateStack': {
                        const name = data.stack === undefined ? 'stack' : `${data.stack}Stack`;
                        if (components[name] === undefined) throw new Error(`cmd:'updateStack' where stack='${data.stack}' -> cannot find component '${name}'`);
                        if (data.type === "push") {
                            components[name].push(data.value, data.title);
                        } else if (data.type === "pop") {
                            components[name].pop();
                        } else if (data.type === "empty") {
                            components[name].dump();
                        } else if (data.type === 'update') {
                            components[name]._stack._ = data.value;
                            components[name].updateAll();
                        } else throw new Error(`cmd:'updateStack' -> unknown update type '${data.type}'`);
                        break;
                    }
                    case 'updateObject': {
                        if (components[data.name] === undefined) throw new Error(`cmd:'updateObject' -> cannot find component '${data.name}'`);
                        if (data.action === "set") {
                            components[data.name].set(data.key, data.value);
                        } else if (data.action === "del") {
                            components[data.name].remove(data.key);
                        } else if (data.action === 'clear') {
                            components[data.name].clear();
                        } else throw new Error(`cmd:'updateObject' -> unknown update action '${data.action}'`);
                        break;
                    }
                    case 'displayTextareaPopup': {
                        let textarea = document.createElement("textarea");
                        textarea.rows = 15;
                        textarea.cols = 50;
                        textarea.value = data.text;
                        new Popup(data.title).setContent(textarea).show();
                        break;
                    }
                    case 'flush':
                        ioconsole.flush();
                        break;
                    case 'updateCodeGrid':
                        if (components.grid == undefined) throw new Error(`Recieved command "${data.cmd}", but no grid to update`);
                        if (codeGridEnabled) { // Do not update if disabled.
                            if (data.code !== undefined) { // Code
                                if (data.format === 'array') {
                                    components.grid.setCodeArray(data.code);
                                } else {
                                    components.grid.setCode(data.code, false);
                                }
                            }
                            if (data.positions !== undefined) { // Positions to highlight
                                data.positions.forEach(p => {
                                    components.grid.highlight(...p);
                                });
                                components.grid.updateHighlighted();
                            }
                        }
                        break;
                    default:
                        console.log(data);
                        throw new Error(`Message from Worker: unknown event command '${data.cmd}'`);
                }
            }
        };

        if (esolang) selectEsolang(esolang);
        return true;
    } else return false;
}

export function killInterpreterWorker() {
    if (interpreterWorker) {
        interpreterWorker.terminate();
        interpreterWorker = undefined;
        console.log(`%cinterpreterWorker terminated.`, `color:tomato;font-family:monospace;`);
        return true;
    } else return false;
}

export function selectEsolang(lang, updateVisuals = true, allowConfig = true) {
    if (langOptions[lang] === undefined) {
        let emsg = `Language "${lang}" is not supported`;
        ioconsole.error("\n" + emsg);
        throw new Error(emsg);
    }

    // Tell worker to setup esolang. Worker will sent back a response
    const initEsolang = () => {
        document.title = `Esolangs - ${langOptions[lang].name}`;
        interpreterWorker.postMessage({ cmd: 'setEsolang', lang, opts: optObject });
    };

    // Remove all components
    for (let name in components) {
        if (components.hasOwnProperty(name)) {
            components[name]._wrapper.remove();
            delete components[name];
        }
    }

    esolang = lang;
    userControl.setButtons(langOptions[lang].buttons);
    const optObject = { updateVisuals, ...langOptions[lang].opts };
    if (allowConfig) {
        const popup = new Popup(`Language Configuration for ${lang}`), popupContent = document.createElement("div");
        popup.setContent(popupContent);
        for (let opt in optObject) {
            if (optObject.hasOwnProperty(opt)) {
                let div = document.createElement("div");
                div.dataset.opt = opt;
                div.insertAdjacentHTML('beforeend', `<span>${opt}</span>: `);
                if (typeof optObject[opt] === 'boolean') {
                    let checkbox = document.createElement("input");
                    checkbox.type = 'checkbox';
                    checkbox.checked = optObject[opt];
                    checkbox.addEventListener('change', () => optObject[opt] = checkbox.checked);
                    div.appendChild(checkbox);
                } else if (typeof optObject[opt] === 'number') {
                    let input = document.createElement("input");
                    input.type = "number";
                    input.min = "0";
                    input.value = optObject[opt].toString();
                    input.addEventListener('change', () => optObject[opt] = +input.value);
                    div.appendChild(input);
                } else {
                    let input = document.createElement("input");
                    input.type = "text";
                    input.value = optObject[opt].toString();
                    input.addEventListener('change', () => optObject[opt] = input.value);
                    div.appendChild(input);
                }
                popupContent.appendChild(div);
            }
        }

        popup.onClose(() => {
            popup.hide();
            initEsolang();
        });

        popup.show();
    } else {
        initEsolang();
    }
}

export function prepareEsolangGUI(lang, updateVisuals) {
    // Add config items
    const items = langOptions[lang].gui;
    for (const name in items) {
        if (items.hasOwnProperty(name)) {
            const type = items[name];
            if (components[name] !== undefined) throw new Error(`Error preparing GUI: cannot prepare component '${name}' of type '${type}' as it already exists.`);
            const fieldset = createFieldset(main, name),
                object = createObjectFromType(type, fieldset);
            fieldset.dataset.objType = name;
            components[name] = object;
            if (!updateVisuals) fieldset.style.display = "none";
        }
    }
}

export function setCode(code, triggerCb = false) {
    userControl.setCode(code, triggerCb); // if triggerCb=false: DO NOT send another request to the worker - infinite loop!
    if (components.grid && codeGridEnabled) components.grid.setCode(code, true);
}

export function setDelay(d) {
    execDelay = +num(d);
    interpreterWorker.postMessage({ cmd: 'setDelay', delay: execDelay });
}

/** Create popup with textarea, and wait for user to press buttons before resolving Promise. */
export async function popupTextarea(title, text = undefined, btnText = 'Go') {
    return new Promise((resolve, reject) => {
        let popup = new Popup(title);
        let div = document.createElement("div");
        popup.setContent(div);
        if (text !== undefined) div.insertAdjacentHTML('beforeend', `<p>${text}</p>`);
        let textarea = document.createElement("textarea");
        textarea.rows = 30;
        textarea.cols = 66;
        div.appendChild(textarea);
        div.insertAdjacentHTML('beforeend', '<hr>');
        let btn = document.createElement("button");
        btn.innerText = btnText;
        btn.addEventListener('click', () => {
            popup.hide();
            resolve(textarea.value);
        });
        popup.onClose(() => resolve(""));
        div.appendChild(btn);
        popup.show();
        textarea.focus();
    });
}

export async function promptForInputPopup(title, text = undefined, allowString = true, allowNumber = true, allowBoolean = true, defaultValue = undefined) {
    return new Promise((resolve, reject) => {
        const popup = new Popup(title);
        let p, value = defaultValue;
        if (text !== undefined) {
            p = document.createElement("p");
            p.innerText = text;
            popup.insertAdjacentElement('beforeend', p);
        }

        if (allowString) {
            p = document.createElement("p");
            popup.insertAdjacentElement('beforeend', p);
            p.insertAdjacentHTML('beforeend', '<b>String</b>: ');
            let input = document.createElement("input");
            input.type = "text";
            input.addEventListener('change', () => value = input.value);
            if (typeof defaultValue === 'string') input.value = defaultValue;
            p.appendChild(input);
        }
        if (allowNumber) {
            p = document.createElement("p");
            popup.insertAdjacentElement('beforeend', p);
            p.insertAdjacentHTML('beforeend', '<b>Number</b>: ');
            let input = document.createElement("input");
            input.type = "number";
            input.addEventListener('change', () => value = +input.value);
            if (typeof defaultValue === 'number') input.value = defaultValue;
            p.appendChild(input);
        }
        if (allowBoolean) {
            p = document.createElement("p");
            popup.insertAdjacentElement('beforeend', p);
            p.insertAdjacentHTML('beforeend', '<b>Boolean</b>: ');
            let radioTrue = document.createElement("input"), n = Math.random();
            radioTrue.type = "radio";
            radioTrue.name = `radio-boolean-${n}`;
            radioTrue.addEventListener('change', () => value = true);
            p.appendChild(radioTrue);
            p.insertAdjacentHTML('beforeend', ' True &nbsp; ');
            let radioFalse = document.createElement("input");
            radioFalse.type = "radio";
            radioFalse.name = `radio-boolean-${n}`;
            radioFalse.addEventListener('change', () => value = false);
            p.appendChild(radioFalse);
            p.insertAdjacentHTML('beforeend', ' False');
            if (typeof defaultValue === 'boolean') {
                if (defaultValue) radioTrue.checked = true;
                else radioFalse.checked = false;
            }
        }

        let btn = document.createElement("button");
        btn.innerText = 'Push Value';
        btn.addEventListener('click', () => popup.hide()); // .hide will trigger .onClose callback

        popup.onClose(() => resolve(value));
        popup.show();
    });
}

export function generateSettingsPopup() {
    const div = document.createElement("div");
    div.classList.add('settings');
    const table = document.createElement("table"), tbody = document.createElement("tbody");
    div.appendChild(table);
    table.appendChild(tbody);
    let tr, td;

    table.insertAdjacentHTML('afterbegin', `<thead><tr><th>Esolang</th><td>${esolang}</td></tr></thead>`);

    // CONSOLE DIMENSIONS
    tr = document.createElement("tr");
    tbody.appendChild(tr);
    tr.insertAdjacentHTML('beforeend', '<thead>Console Dimensions</thead>');
    td = document.createElement("td");
    tr.appendChild(td);
    let inputConsoleWidth = document.createElement("input");
    inputConsoleWidth.type = "number";
    inputConsoleWidth.value = ioconsole._.clientWidth;
    inputConsoleWidth.addEventListener('change', () => ioconsole._.style.width = inputConsoleWidth.value + "px");
    td.appendChild(inputConsoleWidth);
    td.insertAdjacentHTML('beforeend', ' &nbsp; &times; &nbsp; ');
    let inputConsoleHeight = document.createElement("input");
    inputConsoleHeight.type = "number";
    inputConsoleHeight.value = ioconsole._.clientHeight;
    inputConsoleHeight.addEventListener('change', () => ioconsole._.style.height = inputConsoleHeight.value + "px");
    td.appendChild(inputConsoleHeight);

    // EXEC DELAY
    tr = document.createElement("tr");
    tbody.appendChild(tr);
    tr.insertAdjacentHTML('beforeend', '<th><abbr title=\'Delay between steps when interpreting code\'>Delay</abbr></th>');
    td = document.createElement("td");
    tr.appendChild(td);
    let inputDelay = document.createElement("input");
    inputDelay.type = "number";
    inputDelay.min = "0";
    inputDelay.max = "1000000";
    inputDelay.value = execDelay;
    inputDelay.addEventListener('change', () => setDelay(inputDelay.value));
    td.appendChild(inputDelay);
    td.insertAdjacentHTML('beforeend', ' ms');

    // ENABLE CODEGRID?
    tr = document.createElement("tr");
    tbody.appendChild(tr);
    tr.insertAdjacentHTML('beforeend', '<th><abbr title=\'Update code grid? (This may cause extra latency and, for self-modifying languages such as underscore, may crash the webpage)\'>Code Grid?</abbr></th>');
    td = document.createElement("td");
    tr.appendChild(td);
    let inputCodeGrid = document.createElement("input");
    inputCodeGrid.type = 'checkbox';
    inputCodeGrid.checked = codeGridEnabled;
    inputCodeGrid.addEventListener('change', () => {
        codeGridEnabled = inputCodeGrid.checked;
        if (codeGridEnabled && components.grid) {
            new Popup("Information").insertAdjacentText('beforeend', 'Please press the \'Restart\' button to enable changes').show();
        }
    });
    td.appendChild(inputCodeGrid);

    new Popup("Settings").setContent(div).show();
}