import { num } from "../utils.js";

export class HTMLObject {
    /**
     * @param {HTMLDivElement} wrapper 
     */
    constructor(wrapper) {
        this._wrapper = wrapper;
        this._obj = {};
        this.doUpdate = true;

        this._table = undefined;
        this._trs = {}; // [name: string]: <tr /> -- Maps headers to TR elements
        this.updateAll();
    }

    get(header) {
        return this._obj[header];
    }

    set(header, value) {
        if (this._trs[header] === undefined) {
            let tr = document.createElement('tr');
            this._table.appendChild(tr);
            this._trs[header] = tr;
            let th = document.createElement('th');
            tr.appendChild(th);
            let td = document.createElement('td');
            tr.appendChild(td);
            td.classList.add("raw-data");
        }
        let th = this._trs[header].children[0], td = this._trs[header].children[1];
        th.innerText = header;
        td.innerText = value;
        td.title = num(value).toString();
        this._obj[header] = value;
    }

    remove(header) {
        if (this._trs[header] !== undefined) {
            this._trs[header].remove();
            delete this._trs[header];
            delete this._obj[header];
            return true;
        } else return false;
    }

    clear() {
        this._obj = {};
        this.updateAll();
    }

    /** Update all html */
    updateAll() {
        if (this.doUpdate) {
            if (this._table) this._table.remove();

            this._trs = {};

            const table = document.createElement('table');
            this._table = table;
            const tbody = document.createElement('tbody');
            table.appendChild(tbody);

            for (let key in this._obj) {
                if (this._obj.hasOwnProperty(key)) {
                    this.set(key, this._obj[key]);
                }
            }

            this._wrapper.appendChild(table);
        }
    }
}

export default HTMLObject;