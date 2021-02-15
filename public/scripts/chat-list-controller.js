var rhit = rhit || {};

rhit.ChatListPageController = class {
    constructor() {
        console.log('i am the chat list page controller');
        rhit.fbChatsManager.beginListening(this.updateView.bind(this));
    }

    updateView() {
        const newList = htmlToElement('<div id="chats-list"></div>');

        for (let i = 0; i < rhit.fbChatsManager.length; i++) {
            const chat = rhit.fbChatsManager.getItemAtIndex(i);

            if (this.searchIndex(rhit.fbAuthManager.uid, chat.people) > -1) {
                const chatListCard = this._createCardList(chat);
                const userName = this.search(rhit.fbAuthManager.uid, chat.people);
                let otherPersonIndex = (userName.index == 0) ? 1 : 0;
                const receiverName = chat.people[otherPersonIndex];
                chatListCard.onclick = (event) => {        
                    window.location.href = `/chat.html?sender=${receiverName.username}&receiver=${userName.user.username}&receiverName=${userName.user.name}`;
                };
    
                newList.appendChild(chatListCard);
            }
        }

        const oldList = document.querySelector("#chats-list");
		oldList.removeAttribute("id");
		oldList.hidden = true;
	
		// put in new quoteListContainer
        oldList.parentElement.appendChild(newList);
    }

    search(nameKey, myArray){
		for (let i = 0; i < myArray.length; i++) {
			if (myArray[i].username !== nameKey) {
				return { "user": myArray[i], "index": i};
			}
		}
    }
    
    searchSender(nameKey, myArray){
		for (let i = 0; i < myArray.length; i++) {
			if (myArray[i].username === nameKey) {
				return myArray[i];
			}
		}
    }
    
    searchIndex(key, arr) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].username === key) {
                return i;
            }
        }

        return -1;
    }

    _createCardList(message) {
        const userName = this.search(rhit.fbAuthManager.uid, message.people);
        return htmlToElement(
            `
            <div class="list-group-item list-group-item-action flex-column align-items-start active chat-list-container">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${userName.user.name}</h5>
                </div>
                <p class="mb-1">${message.messages[message.messages.length - 1].message}</p>
            </div>
            `
        )
    }
}