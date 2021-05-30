export class Popup {
  constructor(title) {
    this._title = title;
    this._htmlContent = undefined; // HTMLElement
    this._onCloseCallback = () => {};
    this._popupDiv = null; // HTMLDivElement | null
    this._popupBg = null; // Background element which blocks interactions to page
  }

  getTitle() { return this._title; }
  setTitle(title) {
    this._title = title.toString();
    return this;
  }

  getContent() { return this._htmlContent; }
  setContent(content) {
    this._htmlContent = content;
    return this;
  }

  /**
   * @param {InsertPosition} position 
   * @param {HTMLElement} child 
   */
  insertAdjacentElement(position, child) {
    if (!this._htmlContent) this._htmlContent = document.createElement('div');
    this._htmlContent.insertAdjacentElement(position, child);
    return this;
  }

  /**
   * @param {InsertPosition} position 
   * @param {string} text 
   */
  insertAdjacentText(position, text) {
    if (!this._htmlContent) this._htmlContent = document.createElement('div');
    this._htmlContent.insertAdjacentText(position, text);
    return this;
  }

  /**
   * @param {(popup: Popup) -> boolean} callback 
   */
  onClose(callback) {
    this._onCloseCallback = callback;
    return this;
  }

  isOpen() {
    return this._popupDiv !== null;
  }

  show() {
    if (!this.isOpen()) {
      // Create backdrop
      this._popupBg = document.createElement("div");
      this._popupBg.classList.add("popup-bg");
      this._popupBg.addEventListener('click', () => this.hide());
      document.body.insertAdjacentElement('beforeend', this._popupBg);

      // Create popups
      let container = document.createElement('div');
      container.classList.add("popup-container");
      this._popupDiv = container;
      let body = document.createElement("div");
      body.classList.add("popup-body");
      container.appendChild(body);
      body.insertAdjacentHTML('beforeend', `<h2>${this._title}</h2>`);
      if (this._htmlContent == undefined) this._htmlContent = document.createElement('div');
      this._htmlContent.classList.add('popup-dynamic-content');
      body.insertAdjacentElement('beforeend', this._htmlContent);

      let btn = document.createElement('button');
      btn.classList.add('popup-close');
      btn.innerText = 'Close';
      btn.addEventListener('click', () => {
        let close = typeof this._onCloseCallback == 'function' ? this._onCloseCallback(this) !== false : true;
        if (close) this.hide();
      });
      body.insertAdjacentHTML('beforeend', '<br>');
      body.insertAdjacentElement('beforeend', btn);

      document.body.insertAdjacentElement('beforeend', container);

      Popup._openPopups.push(this);
      return this;
    }
  }

  hide() {
    if (this.isOpen()) {
      this._popupDiv.remove();
      this._popupDiv = null;

      let i = Popup._openPopups.indexOf(this);
      Popup._openPopups.splice(i, 1);

      this._popupBg.remove();
      this._popupBg = null;
    }
    return this;
  }
}

Popup._openPopups = [];

Popup.popupsOpen = function() {
    return Popup._openPopups.length;
};

/** Get top-most popup */
Popup.getTopmostPopup = function() {
    return Popup._openPopups.length == 0 ? undefined : Popup._openPopups[Popup._openPopups.length - 1];
};

export default Popup;