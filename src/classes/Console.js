import { getChar } from "../utils.js";

/**
 * Console
 * Replace /↵|␍␊|␊|␍/ with newline characters in print()
 */
export class IOConsole {
  constructor(wrapper) {
    this._wrapper = wrapper;
    this._ = document.createElement('div');
    this._wrapper.appendChild(this._);
    this._.classList.add('ioconsole');
    this._.appendChild(document.createElement("span"));

    /** @type {{ text: string, fg: string, bg: string }[]} */
    this._buffer = []; // Stuff which has yet to be printed. Array of objects.

    this._fg = IOConsole.defaultFg;
    this._bg = IOConsole.defaultBg;
    this._needNewBuffer = true; // Have styles changed, for instance...

    this._suspended = false;


    this._inputDoneCallback = undefined; // Callback when enter key is pressed
    this._inputEventCallback = undefined; // Callback when keydown event is fired
    this._asyncInputExternalResolve = undefined;
    this._asyncInputExternalReject = undefined;
    this._getchHandler = undefined;
    this._getchReject = undefined;
  }

  /** Remove any event handlers/promises etc. */
  $destroy() {
    this.cancelSTDIN();
    this._.remove();
  }

  /** Remove event listeners */
  cancelSTDIN() {
    if (this._getchHandler !== undefined) {
      document.body.removeEventListener('keydown', this._getchHandler);
      this._getchReject("Process Terminated");
    }
    if (this._asyncInputExternalReject !== undefined) {
      this._asyncInputExternalReject("Process terminated");
      this._.removeEventListener('keydown', this._boundEventHandler);
    }
  }

  isSuspended() { return this._suspended; }
  suspend(bool) {
    if (bool !== this._suspended) {
      this._suspended = bool;
      if (!bool) this.flush();
    }
  }

  getForeground() { return this._fg; }
  setForeground(fg) { this._fg = fg; this._needNewBuffer = true; return this; }
  getBackground() { return this._bg; }
  setBackground(bg) { this._bg = bg; this._needNewBuffer = true; return this; }

  /** Add new buffer object */
  newBufferState(addToInternal = true) {
    const obj = { text: '', fg: this._fg, bg: this._bg, };
    if (addToInternal) this._buffer.push(obj);
    return obj;
  }

  /** Create new styles line from buffer object */
  _createBufferElement(buf) {
    let span = document.createElement('span');
    span.style.color = buf.fg;
    span.style.backgroundColor = buf.bg;
    return span;
  }

  /** Print text to current buffer */
  print(text) {
    // PUSH TO LATEST BUFFER
    if (this._needNewBuffer) {
      this._needNewBuffer = false;
      this.newBufferState();
    }
    // if (this._buffer.length === 0) this._newBufferObject();
    this._buffer[this._buffer.length - 1].text += text;
    if (!this._suspended) this.flush();
  }

  /** Utility for printing errors */
  error(message) {
    let oldBuffer = this.newBufferState(false); // Create buffer object from old styles
    this.setForeground("tomato").setBackground(IOConsole.defaultBg);
    this.cancelSTDIN();
    this.suspend(false);
    this.print(message);
    this._buffer.push(oldBuffer); // Restore old buffer
  }

  clear() {
    this.suspend(false);
    this._.innerHTML = '';
    this._buffer.length = 0;
    this._needNewBuffer = true;
  }

  async input(eventCallback = undefined) {
    if (this._suspended) {
      this.error("[!] Cannot prompt for user input whilst console is suspended");
      return false;
    }
    if (typeof eventCallback === "function") this._inputEventCallback = eventCallback;

    const input = document.createElement("input");
    input.type = 'text';
    input.style.color = this._fg;
    input.style.backgroundColor = this._bg;
    this._inputEl = input;
    this._.appendChild(this._inputEl);

    this.suspend(true);
    this._boundEventHandler = this._keydownHandler.bind(this);
    this._.addEventListener('keydown', this._boundEventHandler);
    input.focus();

    let content = await new Promise((resolve, reject) => {
      this._asyncInputExternalResolve = resolve;
      this._asyncInputExternalReject = reject;
    });
    return content;
  }

  _keydownHandler(event) {
    let submit = false;
    if (typeof this._inputEventCallback === 'function') submit = this._inputEventCallback(event) === true;
    if (submit || event.key === 'Enter') {
      let content = this._inputEl.value;
      this._inputEl.remove();
      this._.removeEventListener('keydown', this._boundEventHandler);
      scrollToBottom(this._);
      this.suspend(false);
      this._asyncInputExternalResolve(content);
    }
  }

  /**
   * Get single character from "KeyDown" event
   */
  async getch() {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        let char = getChar(e);
        if (typeof char === 'string') {
          e.stopPropagation();
          document.body.removeEventListener("keydown", handler);
          resolve(char);
        }
      };
      this._getchHandler = handler;
      this._getchReject = reject;
      document.body.addEventListener("keydown", handler);
    });
  }

  /** Force to empty contents of this._backlog, even if suspended */
  flush() {
    this._.innerHTML = ""; // Clear screen
    this._buffer = this._buffer.filter(buf => buf.text.length !== 0); // Remove empty buffers
    this._buffer.forEach(buf => {
      let el = this._createBufferElement(buf);
      let text = buf.text.replace(/↵|␍␊|␊|␍/g, "\n");
      let lines = text.split(/\r\n|\r|\n/g);
      for (let i = 0; i < lines.length; i++) {
        el.insertAdjacentText('beforeend', lines[i]);
        if (i < lines.length - 1) el.insertAdjacentHTML('beforeend', '<br>');
      }
      this._.appendChild(el);
    });
  }
}

IOConsole.defaultFg = "#e9e7e7";
IOConsole.defaultBg = "#222121";

export default IOConsole;

const scrollToBottom = (node) => {
  node.scrollTop = node.scrollHeight;
};