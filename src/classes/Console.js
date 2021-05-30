import { getChar } from "../utils.js";

export class IOConsole {
  constructor(wrapper) {
    this._wrapper = wrapper;
    this._ = document.createElement('div');
    this._wrapper.appendChild(this._);
    this._.classList.add('ioconsole');
    this._inputDoneCallback = undefined; // Callback when enter key is pressed
    this._inputEventCallback = undefined; // Callback when keydown event is fired
    this._currentLine = this.newline();

    this._suspended = false;
    this._backlog = [];

    this._asyncInputExternalResolve = undefined;
    this._asyncInputExternalReject = undefined;
    this._getchHandler = undefined;
    this._getchReject = undefined;
  }

  /** Remove any event handlers/promises etc. */
  $destroy() { 
    if (this._getchHandler !== undefined) {
      document.body.removeEventListener('keydown', this._getchHandler);
      this._getchReject("Process Terminated");
    }
    if (this._asyncInputExternalReject !== undefined) {
      this._asyncInputExternalReject("Process terminated");
      this._.removeEventListener('keydown', this._boundEventHandler);
    }
    this._.remove();
  }

  isSuspended() { return this._suspended; }
  suspend(bool) {
    if (bool !== this._suspended) {
      this._suspended = bool;
      if (!bool) {
        this._backlog.forEach(line => this._appendLine(line));
        this._backlog.length = 0;
      }
    }
  }

  createLine(content, type = null) {
    if (typeof type !== "string") type = "unknown";
    const line = document.createElement('div');
    line.classList.add('ioconsole-line');
    line.dataset.type = type.toString();
    if (content.length !== 0) line.innerText += content;
    return line;
  }

  newline(content = '', type = null) {
    const line = this.createLine(content, type);
    this._currentLine = line;
    if (this._suspended) {
        this._backlog.push(line);
      } else {
        this._appendLine(line);
      }
    return line;
  }

  _appendLine(line) {
    this._.insertAdjacentElement('beforeend', line);
    scrollToBottom(this._);
  }

  print(text, type = undefined) {
    const lines = text.toString().split(/\r|\n|\r\n/g);
    for (let i = 0; i < lines.length; i++) {
      if (i === 0) {
        this._currentLine.innerText += lines[i];
      } else {
        this.newline(lines[i], type);
      }
    }
  }

  error(message) {
    const lines = message.split(/\r|\n|\r\n/g);
    lines.forEach(line => this._appendLine(this.createLine(line, 'error')));
  }

  clear(silent = false) {
    this.suspend(false);
    this._.innerHTML = '';
    this._backlog.length = 0;
    this.newline();
  }

  async input(prompt, eventCallback = undefined) {
    if (this._suspended) {
      this.error("[!] Cannot prompt for user input whilst console is suspended");
      return false;
    }
    if (typeof completedCallback === "function") this._inputDoneCallback = completedCallback;
    if (typeof eventCallback === "function") this._inputEventCallback = eventCallback;

    if (prompt == undefined) prompt = '';
    const input = document.createElement("input");
    input.type = 'text';
    this._inputEl = input;
    this._currentLine.innerText += prompt;
    this._currentLine.appendChild(input);
    
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
      function handler(e) {
        let char = getChar(e);
        if (char !== '') {
          e.stopPropagation();
          document.body.removeEventListener("keydown", handler);
          resolve(char);
        }
      }
      this._getchHandler = handler;
      this._getchReject = reject;
      document.body.addEventListener("keydown", handler);
    });
  }
}

export default IOConsole;

const scrollToBottom = (node) => {
	node.scrollTop = node.scrollHeight;
};