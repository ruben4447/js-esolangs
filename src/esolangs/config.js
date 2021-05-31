import { popupTextarea } from './../app.js';

// == THESE BUTTON OBJECTS ARE USED A LOT, SO DEFINE AS CONSTANTS FOR REUSE AND
const btnReset = { reset: {
    text: 'Reset',
    fn: (obj) => ({ code: obj.getCode() }),
}};
const btnInterpret = { interpret: {
    text: 'Interpret',
    fn: (obj) => ({ code: obj.getCode() }),
}};
const btnStep = { step: {
    text: 'Step',
    fn: () => ({}),
}};

export const langOptions = {
    brainfuck: {
        wiki: 'https://esolangs.org/wiki/Brainfuck',
        gui: { pointers: 'object', dataReel: 'dataReel' },
        opts: {
            numType: "uint8",
            reelLength: 10,
        },
        buttons: {
            ...btnReset,
            minify: {
                text: 'Minify',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            ...btnInterpret,
            ...btnStep,
            textToCode: {
                text: 'Text to Brainfuck',
                fn: async () => {
                    let text = await popupTextarea(`Text to Brainfuck`, `Convert text to brainfuck code`, `Convert`);
                    return { text };
                },
            },
        },
    },
    element: {
        wiki: 'https://esolangs.org/wiki/Element',
        gui: { pointers: 'object', mainStack: 'stack', controlStack: 'stack', vars: 'object' },
        opts: {
            autovivification: true, // Create variable if it doesn't exist (if true), or error (if false)  [regarding instruction '~']
        },
        buttons: {
            ...btnReset,
            ...btnInterpret,
            ...btnStep,
        }
    },
    length: {
        wiki: 'https://esolangs.org/wiki/Length',
        gui: { pointers: 'object', stack: 'stack' },
        opts: {
            comments: false,
            debug: false,
        },
        buttons: {
            ...btnReset,
            textToCode: {
                text: 'Text to Length',
                fn: async () => {
                    let text = await popupTextarea(`Text to Length`, `Convert text to length code`, `Convert`);
                    return { text };
                },
            },
            toShorthand: {
                text: 'To Shorthand',
                fn: obj => ({ code: obj.getCode() }),
            },
            fromShorthand: {
                text: 'From Shorthand',
                fn: async () => {
                    let code = await popupTextarea(`Length: From Shorthand`, `Convert shorthand length code to normal length code`, `Convert`);
                    return { code };
                },
            },
            ...btnInterpret,
            ...btnStep,
        },
    },
    befunge: {
        wiki: 'https://esolangs.org/wiki/Befunge',
        gui: { pointers: 'object', stack: 'stack' },
        opts: {
            debug: false,
            wrapLimit: 1000, // Set to 0 to disallow wrapping
            selfModification: true,
        },
        buttons: {
            ...btnReset,
            ...btnInterpret,
            ...btnStep,
        },
    },
    slashes: {
        wiki: 'https://esolangs.org/wiki////',
        gui: { data: 'object' },
        opts: {
            debug: false,
        },
        buttons: {
            ...btnInterpret,
            ...btnStep,
        },
    },
};

export default langOptions;