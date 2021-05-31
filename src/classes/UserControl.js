const emptyFn = () => {};

export class UserControl {
    constructor(wrapper) {
        this._container = document.createElement('div');
        wrapper.appendChild(this._container);

        this._textarea = document.createElement("textarea");
        this._textarea.rows = 15;
        this._textarea.cols = 80;
        this._textarea.addEventListener('change', () => this._callbackChange(this._textarea.value));
        this._container.appendChild(this._textarea);

        this._buttonWrapper = document.createElement("div");
        this._container.appendChild(this._buttonWrapper);
    }

    $destroy() {
        this._container.remove();
    }

    getCode() { return this._textarea.value; }
    setCode(text, callCb = true) { this._textarea.value = text; if (callCb) this._callbackChange(text); }

    /**
     * Set buttons. 
     * @param {{ [text: string]: (obj: UserControl) => object }} buttons Return value of function will be passed into callback
     */
    setButtons(buttons) {
        this._buttonWrapper.innerHTML = '';
        for (let text in buttons) {
            if (buttons.hasOwnProperty(text)) {
                const button = document.createElement("button");
                button.innerText = buttons[text].text;
                button.addEventListener('click', async () => {
                    this._callbackButtonPress(text, await buttons[text].fn(this), this);
                });
                this._buttonWrapper.appendChild(button);
            }
        }
    }

    /** Set callback for when content of textarea is changed
     * @param {(code: string) => void} cb The callback function
    */
    onChange(cb) { this._callbackChange = typeof cb === 'function' ? cb : emptyFn; }

    /** Set callback for when any button is called. The text of the pressed button will be provided.
     * @param {(button: string, args: object, obj: UserControl) => void} cb The callback function
    */
    onButtonPress(cb) { this._callbackButtonPress = typeof cb === 'function' ? cb : emptyFn; }
}

export default UserControl;