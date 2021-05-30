import { textToCodeUI } from './../app.js';

export const langOptions = {
    brainfuck: {
        wiki: 'https://esolangs.org/wiki/Brainfuck',
        gui: { dataReel: 'dataReel' },
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
                fn: async obj => {
                    let text = await textToCodeUI("Brainfuck");
                    return { text };
                },
            },
        },
    },
    element: {
        wiki: 'https://esolangs.org/wiki/Element',
        gui: { mainStack: 'stack', controlStack: 'stack', vars: 'object' },
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
        gui: { stack: 'stack' },
        opts: {
            comments: false,
            debug: false,
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
            textToCode: {
                text: 'Text to Length',
                fn: async obj => {
                    let text = await textToCodeUI("Length");
                    return { text };
                },
            },
        },
    },
};

export default langOptions;