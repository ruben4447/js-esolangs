import DataReel from './classes/DataReel.js';
import { HTMLStack } from './classes/Stack.js';
import { HTMLObject } from './classes/HTMLObject.js';

export const regexLetter = /[A-Za-z]/;
export const regexNumber = /[0-9]/;
export const regexWhitespace = /\s/;
export const regexNewline = /\r\n|\r|\n/;

export function underlineStringPortion(string, startPos, length = 1, prefix = "", underlineChar = "~") {
    if (regexNewline.test(string)) {
        let output = '', lines = string.split(regexNewline);
        console.log(lines);
        for (let l = 0, i = 0; l < lines.length; l++, i++) { // i++ for newline character
            output += l === 0 ? prefix : ' '.repeat(prefix.length);
            output += lines[l];
            if (startPos >= i && startPos <= i + lines[l].length) {
                output += '\n' + ' '.repeat(prefix.length + (startPos - i)) + (underlineChar[0].repeat(length));
            }
            i += lines[l].length;
            if (l < lines.length - 1) output += '\n';
        }
        return output;
    } else {
        return prefix + string + '\n' + (' '.repeat(startPos + prefix.length)) + (underlineChar[0].repeat(length));
    }
}

/** Highlight string portion - use <mark> tags */
export function highlightStringPortion(string, startPos, length = 1) {
    return string.substring(0, startPos) + "<mark>" + string.substr(startPos, length) + "</mark>" + string.substr(startPos + length);
}

/** Sanitise text for HTML insertion */
export function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replaceAll(' ', '&nbsp;');
}

export function createFieldset(parent, legend) {
    const fieldset = document.createElement("fieldset");
    fieldset.innerHTML += `<legend>${legend}</legend>`;
    parent.appendChild(fieldset);
    return fieldset;
}

export const bracketMap = {
    "[": "]", "]": "[",
    "(": ")", ")": "(",
    "{": "}", "}": "{",
};
const bracketValues = {
    "[": 1, "]": -1,
    "(": 1, ")": -1,
    "{": 1, "}": -1,
};
/** Return position of matching bracket in program */
export function getMatchingBracket(pos, program) {
    if (bracketMap[program[pos]] === undefined) {
        throw new Error("Unexpected token '" + program[pos] + "' at position " + pos + ": cannot match token");
    }
    let open_groups = 0, i = pos;
    let add = bracketValues[program[pos]]; // Look forward if hnting closing, else backwards
    let openingBracket, closingBracket;
    if (add === 1) {
        openingBracket = program[pos];
        closingBracket = bracketMap[openingBracket];
    } else {
        closingBracket = program[pos];
        openingBracket = bracketMap[closingBracket];
    }

    while (i > -1 && i < program.length) {
        if (program[i] == closingBracket)
            open_groups--;
        else if (program[i] == openingBracket)
            open_groups++;
        if (open_groups == 0)
            return i;
        i += add; // Move to next token
    }

    throw new Error("No matching bracket found for '" + program[pos] + "' in position " + pos);
}

/** Get input character from KeyboardEvent. Return string, or undefined */
export function getChar(e) {
    if (e.key.length === 1) return e.key;
    if (e.key === 'Space') return ' ';
    if (e.key === 'Enter') return '\n';
    if (e.key === 'Tab') return '\t';
    if (e.key === 'Escape') return '';
    return undefined;
}

/** Create object from type e.g. 'dataReel' */
export function createObjectFromType(type, wrapper) {
    switch (type) {
        case 'dataReel': return new DataReel(wrapper);
        case 'stack': return new HTMLStack(wrapper);
        case 'object': return new HTMLObject(wrapper);
        default:
            throw new TypeError(`Unknown object type '${type}'`);
    }
}

/**
 * Scan and extract string from string
 * @param {string} string 
 * @param {string[]} breakChars Chars to break string scanning on. May be overrided by preceding with a backslash. Default is ['"']
 * @return {{ str: string, length: number }}
 */
export function scanString(string, breakChars = ['"']) {
    let str = '', precedingBackslash = false, length = 0;
    for (const char of string) {
        if (char === '\\' && !precedingBackslash) {
            precedingBackslash = true;
            length++;
        } else {
            if (breakChars.indexOf(char) === -1) {
                str += char;
                length++;
            } else {
                if (precedingBackslash) {
                    str += char;
                    precedingBackslash = false;
                    length++;
                } else {
                    break;
                }
            }
        }
    }
    return { str, length };
}

/**
 * Extract number from string. (integers, base 10)
 * @return {{ str: string, n: number, length: number }}
 */
export function scanNumber(string) {
    let nStr = '', length = 0;
    for (const char of string) {
        if (regexNumber.test(char)) {
            nStr += char.toString();
            length++;
        } else break;
    }
    return { str: nStr, n: Number(nStr), length };
}

export function isStringInteger(string) {
    if (string.length === 0) return false; // Keep empty strings as empty strings, please.
    let n = parseInt(string);
    return !isNaN(string) && n.toString().length === string.length;
}

/** Move {oldPos}th item to position {newPos} (counting from end of array, so pos 2 in 9-item array is index 6) */
export function arrayMoveItem(array, oldPos, newPos) {
    let temp = [];
    for (let i = 0; i < oldPos; i++) temp.push(array.pop());
    let c = array.pop();
    for (let i = 0; i < oldPos; i++) array.push(temp.pop());
    for (let i = 0; i < newPos; i++) temp.push(array.pop());
    array.push(c);
    for (let i = 0; i < newPos; i++) array.push(temp.pop());
}

/** Rotate array left e.g. [7, 6, 5] -> [6, 5, 7] */
export function arrayRotateLeft(array) {
    array.push(array.shift());
}

/** Rotate array right e.g. [7, 6, 5] -> [5, 7, 6] */
export function arrayRotateRight(array) {
    array.unshift(array.pop());
}

/** Get top value of array */
export const atop = arr => arr[arr.length - 1];

/** Convert object to number */
export function num(x) {
    if (typeof x === 'number') return x;
    if (x === undefined || x === null) return 0;
    const n = +x;
    if (isNaN(n) || !isFinite(n)) return 0;
    return n;
}
self.num = num;

/** Convert object to string */
export function str(x) {
    if (typeof x === 'string') return x;
    if (x === undefined || x === null) return '';
    if (typeof x === 'number' && (isNaN(x) || !isFinite(x))) return '0';
    return x.toString();
}
self.str = str;

/**
 * Read contents of file
 * @param {File} file <input type="file" /> file
 * @return {Promise<string>}
 */
export async function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
        let reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/** Given an array of text, make each line the same length. */
export function padLines(lines, pad = ' ') {
    if (pad.length !== 1) throw new Error(`Invalid pad character '${pad}'`);
    const maxL = Math.max(...lines.map(l => l.toString().length));
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].padEnd(maxL, pad);
    }
}

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;
export const randomChoice = array => array[randomInt(0, array.length)];

export function strReplaceAt(string, index, replacement) {
    return string.substr(0, index) + replacement + string.substr(index + replacement.length);
}

/** For a given number, output a counted string e.g. 12 -> "123456789012" */
export function generateCountedString(length) {
    let str = '', current = 1;
    for (let i = 0; i < length; i++) {
        str += current.toString();
        current = current === 9 ? 0 : current + 1;
    }
    return str;
}

/** Extract from text until a stop character is reached. Return null if stop char is never reached */
export function extractUntil(string, stopChar) {
    let i = 0;
    while (true) {
        if (i === string.length) return null;
        if (string[i] === stopChar) break;
        i++;
    }
    return string.substring(0, i);
}

/** For each key, create a key withs its value */
export function createEnum(obj) {
    const enumObj = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            enumObj[key] = obj[key];
            enumObj[obj[key]] = key;
        }
    }
    return enumObj;
}

export function linearPosToLineCol(string, index) {
    let line = 0, col = 0;
    for (let i = 0; i < index; i++) {
        col++;
        if (regexNewline.test(string[i])) {
            line++;
            col = 0;
        }
    }
    return { line, col };
}