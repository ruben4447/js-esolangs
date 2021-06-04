import { main, elStatus, createInterpreterWorker, killInterpreterWorker, selectEsolang, interpreterWorker, editConsoleUI, esolang } from './app.js';
import { createFieldset, readFileAsText } from './utils.js';
import { langOptions } from './esolangs/config.js';
import UserControl from "./classes/UserControl.js";
import IOConsole from "./classes/Console.js";

export var userControl, ioconsole;

function _main() {
    // == SETUP HTML ==
    document.body.appendChild(main);

    let fieldset = createFieldset(main, 'Config');
    main.insertAdjacentElement('afterbegin', fieldset);
    let select = document.createElement("select"), p = document.createElement("p");
    fieldset.appendChild(p);
    p.insertAdjacentHTML('beforeend', 'Esolang: ');
    p.appendChild(select);
    select.insertAdjacentHTML('beforeend', `<option value=''>- Select One -</option>`);
    for (const name of Object.keys(langOptions)) {
        select.insertAdjacentHTML('beforeend', `<option value='${name}'>${langOptions[name].name}</option>`);
    }
    select.addEventListener('change', () => {
        if (select.value.length !== 0) selectEsolang(select.value);
    });
    p.appendChild(select);
    let btnTerminate = document.createElement('button');
    btnTerminate.innerText = `Restart`;
    btnTerminate.title = "Terminate process and restart";
    btnTerminate.addEventListener('click', () => {
        killInterpreterWorker();
        ioconsole.print(`\n> restart\n[${Date.now()}] Killed worker thread`);
        createInterpreterWorker();
    });
    p.appendChild(btnTerminate);
    let btnClearScreen = document.createElement('button');
    btnClearScreen.innerText = `Clear Console`;
    btnClearScreen.addEventListener('click', () => ioconsole.clear());
    p.appendChild(btnClearScreen);
    let btnEditConsole = document.createElement('button');
    btnEditConsole.innerText = `Edit Console`;
    btnEditConsole.addEventListener('click', () => editConsoleUI());
    p.appendChild(btnEditConsole);
    let btnWiki = document.createElement('button');
    btnWiki.innerHTML = `&#128279; Wiki`;
    btnWiki.addEventListener('click', () => {
        if (langOptions[esolang]) open(langOptions[esolang].wiki);
    });
    btnWiki.title = 'Open esolang wiki about selected esolang';
    p.appendChild(btnWiki);
    let btnUploadFile = document.createElement('button');
    btnUploadFile.innerHTML = `&#128462; Upload File`;
    btnUploadFile.addEventListener('click', () => inputFileUpload.click());
    p.appendChild(btnUploadFile);
    let inputFileUpload = document.createElement('input');
    inputFileUpload.type = 'file';
    inputFileUpload.addEventListener('change', async () => {
        try {
            const file = inputFileUpload.files[0], text = await readFileAsText(file);
            userControl.setCode(text);
        } catch (e) {
            let msg = `Unable to read file ${file.name}:\n${e}`;
            console.error(msg);
            ioconsole.error(msg);
        }
    });

    p = document.createElement("p");
    fieldset.appendChild(p);
    p.innerText = "Current Status: ";
    elStatus.innerText = '-';
    p.appendChild(elStatus);

    // == Setup interpreterWorker
    createInterpreterWorker();

    // == User Control and Console
    let div = document.createElement("div");
    document.body.appendChild(div);

    fieldset = createFieldset(div, 'User Control');
    userControl = new UserControl(fieldset);

    fieldset = createFieldset(div, 'Console');
    ioconsole = new IOConsole(fieldset);

    // == Callbacks ==
    userControl.onChange(code => interpreterWorker.postMessage({ cmd: 'loadCode', code, }));
    userControl.onButtonPress((btn, args) => {
        interpreterWorker.postMessage({ cmd: 'btnPress', btn, args });
    });

    globalThis.ioconsole = ioconsole;
}

window.addEventListener('load', async () => {
    await _main();

    selectEsolang("fish", true, false);
    userControl.setCode(`1[:>:r:@@:@,\\;
]~$\\!?={:,2+/n`);
});