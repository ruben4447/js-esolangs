import BaseInterpreter from "../BaseInterpreter.js";
import { padLines, ord, num } from "../../utils.js";
import Dot from "./Dot.js";
import { Char, CurlyBracketChar, DotChar, SquareBracketChar, TildeChar, WarpChar } from "./chars.js";
import { isInversionChar } from "./utils.js";

var currentWarpId = 0;
export class AsciiDotsInterpreter extends BaseInterpreter {
  constructor() {
    super();

    this._map = null;
    this._dots = [];

    /** @type {(code: string, positions: number[][], format: string) => void} */
    this._callbackUpdateGrid = () => { };
    this._callbackUpdateDotStack = () => { };
    this._callbackHighlightDots = () => { };
    this._callbackGetch = () => { };
    this._callbackOutput = () => { };
  }

  get LANG() { return "ASCII Dots"; }

  setCode(code) {
    super.setCode(code);
    this.parse();
    this._callbackUpdateGrid(this._map.map(a => a.map(b => b.value).join('')).join('\n'), []);
    this.reset();
  }

  reset() {
    this._dots.length = 0;
    this._initDots();
    this.updateGUI();
  }

  /** Parse code into character objects. Sets this._map array. */
  parse() {
    const map = [], lines = this._code.split(/\n/g).map(x => x.replace(/``.*/g, ''));
    padLines(lines);
    for (let line of lines) {
      let newLine = '', inComment = false;
      for (let char of line) {
        if (char === '`') {
          inComment = !inComment;
          newLine += ' ';
        } else {
          newLine += inComment ? ' ' : char; // Replace comment character with line if in comment
        }
      }
      let chars = [];
      for (let char of newLine) chars.push(new Char(char));
      map.push(chars);
    }

    // Setup warps
    // let warpAssignedIds = {};
    // for (let y = 0; y < map.length; y++) {
    //   let i = 0;
    //   if (map[y][i++] === '%' && map[y][i++] === '$') { // If line is indicating a warp...
    //     for (; i < map[y].length; i++) { // Loop through rest of line
    //       if (map[y][i].value === ' ') break; // Exit if space is encountered - not part of warp
    //       map[y][i] = new WarpChar(map[y][i].value);
    //       map[y][i].id = currentWarpId++;
    //     }
    //   }
    // }

    // Setup Operators
    for (let y = 0; y < map.length; y++) {
      let wasLastCharABacktick = false;
      for (let x = 0; x < map[y].length; x++) {
        // Operator
        if (x > 0 && x < map[y].length - 1) {
          if (map[y][x - 1] === '{' && map[y][x + 1] === '}') {
            map[y][x] = new CurlyBracketChar(map[y][x].value);
          } else if (map[y][x - 1] === '[' && map[y][x + 1] === ']') {
            map[y][x] = new SquareBracketChar(map[y][x].value);
          }
        }

        // Tilde
        if (map[y][x].value === '~') {
          map[y][x] = new TildeChar(map[y][x].value);
          map[y][x].inverted = (map[y + 1] === undefined) ? false : isInversionChar(map[y + 1][x]);
        }

        if (map[y][x].value === '`') {
          if (!wasLastCharABacktick) {
            wasLastCharABacktick = true;
          } else break;
        }

        if (map[y][x].value === '.' || map[y][x].value === '•') {
          map[y][x] = new DotChar(map[y][x].value);
        }
      }
    }
    this._map = map;
  }

  /** Get linear index position from (x, y) */
  getLinearPos(x, y) { return (y * this._lines[0].length) + x; }

  /** Get thing at position {x, y} : Char */
  get(x, y) {
    if (this._map[y] === undefined) return undefined;
    return this._map[y][x];
  }

  /** Does position exist? */
  doesPosExist(x, y) { return this.get(x, y) instanceof Char; }

  /** Update GUI */
  updateGUI() {
    this._callbackUpdateDotStack();
    this._callbackHighlightDots();
  }

  /** Scan code and create dots */
  _initDots() {
    let dots = [];
    for (let y = 0; y < this._map.length; y++) {
      for (let x = 0; x < this._map[y].length; x++) {
        if (this._map[y][x].isDot()) {
          let dot = new Dot(this, x, y);
          dots.push(dot);
        }
      }
    }
    this._dots = dots;
  }

  async getch(ascii = false) {
    let inp = await super.getch(ascii);
    return num(inp);
  }

  async step() {
    if (this._dots.length === 0) return false;
    for (const dot of this._dots) await dot.next();
    for (const dot of this._dots) await dot.run();

    for (let i = this._dots.length - 1; i >= 0; i--) { // REMOVE DEAD DOTS
      if (!this._dots[i].alive) this._dots.splice(i, 1);
    }
    this.updateGUI();
    return true;
  }
}