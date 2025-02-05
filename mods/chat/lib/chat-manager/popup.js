const ChatPopupTemplate = require("./popup.template");

class ChatPopup {

  constructor(app, mod, group_id="") {
    this.app = app;
    this.name = "ChatPopup";
    this.group_id = 0;
  }

  render(app, mod) {

    if (!document.getElementById(`chat-popup-${this.group_id}`)) {
      app.browser.addElementToDom(ChatPopupTemplate(app, mod, this.group_id));
    }


    // close
    document.querySelector(`#chat-container-close-${this.group_id}`).onclick = (e) => {
      let obj = document.getElementById(`chat-popup-${this.group_id}`).remove(); 
    }

  }

}

module.exports = ChatPopup;

