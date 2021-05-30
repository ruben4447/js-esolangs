export class DataReel {
    /**
     * @param {HTMLDivElement} wrapper 
     * @param {Uint8Array | Int8Array | Int16Array | Uint16Array | Uint32Array | Int32Array} reel
     */
    constructor(wrapper, reel) {
        this._wrapper = wrapper;
        this._reel = reel;
        this._ptr = 0;
        this.doUpdate = true;

        this._table = undefined;
        this._elIndexes = []; // Contains <td />s for cell indexes
        this._elValues = []; // Contains <td />s for cell values
        this.updateAll();
    }

    getPtr() { return this._ptr; }
    setPtr(value) {
        if (value < 0) value = this._reel.length + value % this._reel.length;
        else value %= this._reel.length;
        this._elIndexes[this._ptr].classList.remove("highlight");
        this._elValues[this._ptr].classList.remove("highlight");
        this._ptr = value;
        this._elIndexes[this._ptr].classList.add("highlight");
        this._elValues[this._ptr].classList.add("highlight");
    }

    getValue() { return this._reel[this._ptr]; }
    setValue(value) { this._reel[this._ptr] = value; this.update(this._ptr); }

    getReel() { return this._reel; }
    setReel(reel) { this._reel = reel; this.updateAll(); }

    /** Update value at specific index */
    update(i) {
        this._elValues[i].innerText = this._reel[i].toString();
    }

    /** Update all html */
    updateAll() {
        if (this.doUpdate) {
            if (this._table) this._table.remove();

            this._elIndexes.length = 0;
            this._elValues.length = 0;

            const table = document.createElement('table');
            this._table = table;
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            table.appendChild(thead);
            table.appendChild(tbody);
            const trOffset = document.createElement('tr');
            thead.appendChild(trOffset);
            const trValue = document.createElement('tr');
            tbody.appendChild(trValue);
            trOffset.insertAdjacentHTML('beforeend', `<th>Cell</th>`);
            trValue.insertAdjacentHTML('beforeend', `<th>Value</th>`);
            if (this._reel) {
                for (let i = 0; i < this._reel.length; i++) {
                    const tdOffset = document.createElement('td');
                    tdOffset.innerText = i.toString();
                    trOffset.appendChild(tdOffset);
                    this._elIndexes[i] = tdOffset;
                    const tdValue = document.createElement('td');
                    tdValue.innerText = this._reel[i].toString();
                    trValue.appendChild(tdValue);
                    this._elValues[i] = tdValue;

                    if (i === this._ptr) {
                        tdOffset.classList.add("highlight");
                        tdValue.classList.add("highlighted");
                    }
                }
            }

            this._wrapper.appendChild(table);
        }
    }
}

export default DataReel;