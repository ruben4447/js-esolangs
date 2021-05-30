import { num } from "../utils.js";

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
    empty() { return this._length === 0; }

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

    toArray() { return [...this._]; }
}

export class HTMLStack {
    /**
     * @param {HTMLDivElement} wrapper 
     */
    constructor(wrapper) {
        this._wrapper = wrapper;
        this._stack = new Stack();
        this.doUpdate = true;

        this._table = undefined;
        this._els = []; // Contains <td />s
        this._tr = undefined; // <tr/> element containing contents of this._els
        this.updateAll();
    }

    push(value) { this._stack.push(value); this.updatePush(); }
    pop() { this._stack.pop(); this.updatePop(); }
    dump() { this._stack.dump(); this.updateAll(); }

    /** Update HTML of push'd item */
    updatePush() {
        let td = document.createElement('td'), value = this._stack.top();
        td.classList.add('raw-data');
        td.innerText = value;
        td.title = num(value).toString();
        this._els.push(td);
        this._tr.appendChild(td);
        this.updateSize();
    }

    /** Update HTML of pop'd item */
    updatePop() {
        let el = this._els.pop();
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
                const tdValue = document.createElement('td');
                tdValue.classList.add("raw-data");
                tdValue.innerText = this._stack._[i];
                trValue.appendChild(tdValue);
                tdValue.title = `(${typeof this._stack._[i]})`;
                this._els[i] = tdValue;
            }

            this._wrapper.appendChild(table);
        }
    }
}