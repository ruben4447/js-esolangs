import { num } from "../utils.js";

/** Simple stack implementation */
export class Stack {
    constructor() {
        this._ = [];
    }

    /**
     * Return size of stack
     * @returns {number}
    */
    size() { return this._.length; }

    /**
     * Is the stack empty?
     * @returns {boolean}
     */
    empty() { return this._.length === 0; }

    /** Empty the stack. */
    dump() { this._.length = 0; }

    /**
     * Push value to the stack.
     * @param {any} value Value to push to stack
     * @returns {void}
     */
    push(value) { this._.push(value); }

    /**
     * Return top item of the stack
     * @returns {any}
     */
    top() { return this.empty() ? undefined : this._[this._.length - 1]; }

    /**
     * Pop and return top value off of stack
     * @returns {any}
     */
    pop() { return this._.pop(); }

    /**
     * Get item at any index
     * @param {number} index
    */
    get(index) { return this._[index]; }

    /**
     * Set item at any index
     * @param {number} index
     * @param {any} value
    */
    set(index, value) { this._[index] = value; }

    toArray() { return [...this._]; }
}

export class HTMLStack {
    /**
     * @param {HTMLDivElement} wrapper 
     */
    constructor(wrapper) {
        this._wrapper = wrapper;
        this._stack = new Stack();
        this._titles = new Stack();
        this.doUpdate = true;

        this._table = undefined;
        this._els = []; // Contains <td />s
        this._tr = undefined; // <tr/> element containing contents of this._els
        this.updateAll();
    }

    push(value, title) { this._stack.push(value); this._titles.push(title); this.updatePush(); }
    pop() { this._stack.pop(); this.updatePop(); }
    dump() { this._stack.dump(); this._titles.dump(); this.updateAll(); }

    /** Update HTML of push'd item */
    updatePush(i) {
        if (i === undefined) i = this._stack.size() - 1;
        let td = document.createElement('td'), value = this._stack.get(i);
        td.classList.add('raw-data');
        td.innerHTML = value;
        td.title = this._titles.get(i) === undefined ? `(num)` + num(value) : this._titles.get(i);
        this._els.push(td);
        this._tr.appendChild(td);
        this.updateSize();
    }

    /** Update HTML of pop'd item */
    updatePop() {
        let el = this._els.pop();
        this._titles.pop();
        if (el) {
            this._tr.removeChild(el);
            this.updateSize();
        }
    }

    /** Update stack size */
    updateSize() {
        this._tr.firstElementChild.innerText = `Stack [${this._stack.size()}]`; // Update stack size label
    }

    /** Update all html */
    updateAll() {
        if (this.doUpdate) {
            if (this._table) this._table.remove();

            this._els.length = 0;

            const table = document.createElement('table');
            this._table = table;
            const tbody = document.createElement('tbody');
            table.appendChild(tbody);
            const trValue = document.createElement('tr');
            this._tr = trValue;
            tbody.appendChild(trValue);
            trValue.insertAdjacentHTML('beforeend', `<th />`);
            this.updateSize();

            let size = this._stack.size();
            for (let i = 0; i < size; i++) {
                this.updatePush(i);
            }

            this._wrapper.appendChild(table);
        }
    }
}