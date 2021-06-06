import BaseInterpreter from "../BaseInterpreter.js";
import { padLines } from "../../utils.js";
import Dot from "./Dot.js";

export class AsciiDotsInterpreter extends BaseInterpreter {
  constructor() {
    super();

    this._dots = [];
    this._lines = [];

    /** Map positions to their operators. For each operator, store any waiting dots
     * @type {{ [pos: number]: { vert: Dot, horiz: Dot, mode: 1 | 2 } }}
     */
    this._ops = {};

    this.implicitDeath = true; // Allow dot deaths other than by "&"

    /** @type {(code: string, positions: number[][], format: string) => void} */
    this._callbackUpdateGrid = () => { };
    this._callbackUpdateDotStack = () => { };
    this._callbackHighlightDots = () => { };
  }

  get LANG() { return "ASCII Dots"; }

  setCode(code) {
    super.setCode(code);
    this._lines = this._code.split(/\r\n|\r|\n/g).map(l => l.replace(/``.*/g, ''));
    padLines(this._lines);

    this._callbackUpdateGrid(this._lines.join('\n'), []);
    this.reset();
  }

  reset() {
    this._dots.length = 0;
    this._initDots();
    this.updateGUI();
  }

  /** Get linear index position from (x, y) */
  getLinearPos(x, y) { return (y * this._lines[0].length) + x; }

  /** Get thing at position {x, y} */
  get(x, y) {
    if (this._lines[y] === undefined) return undefined;
    return this._lines[y][x];
  }

  /** Update GUI */
  updateGUI() {
    this._callbackUpdateDotStack();
    this._callbackHighlightDots();
  }

  /** Scan code and create dots */
  _initDots() {
    for (let y = 0; y < this._lines.length; y++) {
      for (let x = 0; x < this._lines[y].length; x++) {
        if (this._lines[y][x] === '.' || this._lines[y][x] === '•') {
          let dot = new Dot(this, x, y);
          if (dot.dir === undefined) throw new Error(`Dot at (${x},${y}) : direction could not be determined`);
          this._dots.push(dot);
        }
      }
    }
    if (this._dots.length === 0) throw new Error(`Program is empty (no dots found)`);
    this.updateGUI();
  }

  async step() {
    if (this._dots.length === 0) return false;
    this._dots.forEach(dot => dot.next());
    this._dots.forEach(dot => dot.run());
    this._dots = this._dots.filter(dot => dot.alive);
    this.updateGUI();
    return true;
  }
}