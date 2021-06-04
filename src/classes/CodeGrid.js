import { linearPosToLineCol, padLines, regexNewline } from "../utils.js";

export class CodeGrid {
  constructor(wrapper) {
    this._wrapper = wrapper;
    this._canvas = document.createElement('canvas');
    this._canvas.width = 0;
    this._canvas.height = 0;
    this._ctx = this._canvas.getContext("2d");
    this._wrapper.appendChild(this._canvas);
    /** @type {{ line: number, col: number, type: string }[]} */
    this._highlightedPositions = []; // Current highlighted positions
    /** @type {{ line: number, col: number, type: string }[]} */
    this._highlightedPositionsToBe = []; // Current highlighted positions TO BE (not done yet)

    this._lines = [];
    this.charDim = 30;
    this.bg = "black";
    this.fg = "white";
    this.font = "15px Consolas";
    this.bgh = "#fad980";//"rgba(255,241,210,.5)";
    this.fgh = "black";
    this.fonth = "bold 15px Consolas";
  }

  /** Set a code string */
  setCode(code, doPadLines = true) {
    let lines = code.split(regexNewline);
    if (doPadLines) padLines(lines);
    this.setCodeArray(lines.map(x => x.split('')));
  }

  /** Set code as aray of arrays of chunks */
  setCodeArray(array) {
    this._lines = array;
    this.renderAll();
    this._highlightedPositionsToBe = this._highlightedPositions;
    this.updateHighlighted();
  }

  /**
   * Highlight a position
   * - fn(x, y) or (line, col)
   * - fn(linearIndex)
   */
  highlight() {
    if (arguments.length === 2) {
      this._highlightedPositionsToBe.push({ line: arguments[1], col: arguments[0], type: '.' });
    } else if (arguments.length === 1) {
      let { line, col } = linearPosToLineCol(this._lines.join('\n'), arguments[0]);
      this._highlightedPositionsToBe.push({ line, col, type: '.' });
    } else throw new Error(`highlight: invalid arguments`);
  }

  /** Render whole canvas */
  renderAll() {
    this._canvas.width = Math.max(...this._lines.map(x => x.length)) * this.charDim;
    this._canvas.height = this._lines.length * this.charDim;
    const ctx = this._ctx, cd2 = this.charDim / 2;
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.font = this.font;

    for (let i = 0; i < this._lines.length; i++) {
      for (let j = 0; j < this._lines[i].length; j++) {
        let x = j * this.charDim, y = i * this.charDim, char = this._lines[i][j];
        ctx.fillStyle = this.fg;
        ctx.fillText(char, x + cd2, y + cd2);
      }
    }
  }

  /** Update highlighted cells */
  updateHighlighted() {
    const ctx = this._ctx, cd2 = this.charDim / 2;

    // Remove old highlights
    for (let highlight of this._highlightedPositions) {
      try {
        let x = highlight.col * this.charDim, y = highlight.line * this.charDim, char = this._lines[highlight.line][highlight.col];
        ctx.clearRect(x, y, this.charDim, this.charDim);
        ctx.fillStyle = this.bg;
        ctx.fillRect(x, y, this.charDim, this.charDim);
        ctx.fillStyle = this.fg;
        ctx.fillText(char, x + cd2, y + cd2);
      } catch (e) {
        console.warn(`CodeGrid: cannot render char at ${highlight.line} ${highlight.col}`);
      }
    }
    this._highlightedPositions = this._highlightedPositionsToBe;
    this._highlightedPositionsToBe = [];


    // Add new highlights
    ctx.font = this.fonth;
    for (let highlight of this._highlightedPositions) {
      try {
        let x = highlight.col * this.charDim, y = highlight.line * this.charDim, char = this._lines[highlight.line][highlight.col];
        ctx.clearRect(x, y, this.charDim, this.charDim);
        ctx.fillStyle = this.bgh;
        ctx.fillRect(x, y, this.charDim, this.charDim);
        ctx.fillStyle = this.fgh;
        ctx.fillText(char, x + cd2, y + cd2);
      } catch (e) {
        console.warn(`CodeGrid: cannot render char at ${highlight.line} ${highlight.col}`);
      }
    }
  }
}

export default CodeGrid;