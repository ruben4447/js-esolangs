import { popupTextarea } from './../app.js';

export const langOptions = {
    brainfuck: {
        wiki: 'https://esolangs.org/wiki/Brainfuck',
        gui: { pointers: 'object', dataReel: 'dataReel' },
        opts: {
            numType: "uint8",
            reelLength: 10,
        },
        buttons: {
            reset: {
                text: 'Reset',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            minify: {
                text: 'Minify',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            interpret: {
                text: 'Interpret',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            step: {
                text: 'Step',
                fn: () => ({}),
            },
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
            reset: {
                text: 'Reset',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            interpret: {
                text: 'Interpret',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            step: {
                text: 'Step',
                fn: () => ({}),
            },
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
            reset: {
                text: 'Reset',
                fn: (obj) => ({ code: obj.getCode() }),
            },
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
            interpret: {
                text: 'Interpret',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            step: {
                text: 'Step',
                fn: () => ({}),
            },
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
            reset: {
                text: 'Reset',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            interpret: {
                text: 'Interpret',
                fn: (obj) => ({ code: obj.getCode() }),
            },
            step: {
                text: 'Step',
                fn: () => ({}),
            },
        },
    },
};

export default langOptions;