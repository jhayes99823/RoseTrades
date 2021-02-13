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
            
            const chatListCard = this._createCardList(chat);
            const userName = this.search(rhit.fbAuthManager.uid, chat.people);
            const receiverName = chat.people[userName.user.index == 0 ? 1 : 0];
                console.log('username   ', userName);
                console.log('receiver name  ', receiverName);
            chatListCard.onclick = (event) => {        
                window.location.href = `/chat.html?sender=${receiverName.username}&receiver=${userName.user.username}&receiverName=${userName.user.name}`;
            };

            newList.appendChild(chatListCard);
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

    _createCardList(message) {
        const userName = this.search(rhit.fbAuthManager.uid, message.people);
        console.log('username  ', userName);
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