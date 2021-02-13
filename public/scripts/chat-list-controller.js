var rhit = rhit || {};

rhit.ChatListPageController = class {
    constructor() {
        console.log('i am the chat list page controller');
        rhit.fbChatsManager.beginListening(this.updateView.bind(this));
    }

    updateView() {
        const newList = htmlToElement('<div id="chats-list"></div>');

        for (let i = 0; i < rhit.fbChatsManager.length; i++) {
            let chat = rhit.fbChatsManager.getUserNamesAtIndex(i);
            
            console.log(chat);
        }

        const oldList = document.querySelector("#chats-list");
		oldList.removeAttribute("id");
		oldList.hidden = true;
	
		// put in new quoteListContainer
        oldList.parentElement.appendChild(newList);
    }

    _createCardList(message) {
        return htmlToElement(
            `
            <div class="list-group-item list-group-item-action flex-column align-items-start active">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${chat}</h5>
                </div>
                <p class="mb-1">Donec id elit non mi porta gravida at eget metus. Maecenas sed diam eget risus varius blandit.</p>
            </div>
            `
        )
    }
}