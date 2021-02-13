var rhit = rhit || {};

rhit.ChatPageController = class {
    constructor(sender, receiever) {
        console.log('i am the chat controller page');

        console.log('sender  ', sender, '  receiver  ', receiever);

        this._sender = sender;
        this._receiver = receiever;
        this._currChatIndex = -1;

        const messageInput = document.querySelector("#messageInput");

        messageInput.addEventListener("keypress", (event) => {
            if (event.key === 'Enter') {
                if (this._currChatIndex > -1) {
                    console.log('enter key pressed');
                    let chat = rhit.fbChatsManager.getItemAtIndex(this._currChatIndex);
                    console.log('chat   ', chat);
                    chat.messages.push({
                        message: messageInput.value,
                        sender: this._sender
                    });
                    console.log('chat   ', chat);
                    rhit.fbChatsManager.update(chat);
                    messageInput.value = "";
                } else {
                    console.log('made it here');
                    rhit.fbChatsManager.addNewChatString([this._sender, this._receiver], [{message: messageInput.value, sender: this._sender}]);
                    messageInput.value = "";
                }
            }
        });

        document.querySelector("#enterBtn").addEventListener('click', (event) => {
            if (this._currChatIndex > -1) {
                let chat = rhit.fbChatsManager.getItemAtIndex(this._currChatIndex);
                chat.messages.push({
                    message: messageInput.value,
                    sender: this._sender
                });
                rhit.fbChatsManager.update(chat);
                messageInput.value = "";
            } else {
                messageInput.value = "";
                rhit.fbChatsManager.addNewChatString([this._sender, this._receiver], [{message: messageInput.value, sender: this._sender}]);
            }
        });
    
        rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
        rhit.fbChatsManager.beginListening(this.updateView.bind(this));
    }

    updateView() {
        const newList = htmlToElement('<div id="chats-list"></div>');

        for (let i = 0; i < rhit.fbChatsManager.length; i++) {
            let chat = rhit.fbChatsManager.getItemAtIndex(i);

            console.log('curr chat  ', chat);

            console.log('sender  ', this._sender, '  receiver  ', this._receiver);

            if (chat.people.includes(this._sender) && chat.people.includes(this._receiver)) {
                this._currChatIndex = i;
                for (let message of chat.messages) {
                    let messageCard = null;
                    console.log('made it here  ', message.sender);

                    if (message.sender == this._sender) {
                        console.log('made it here  ', message.sender);
                        messageCard = this._createSenderCard(message.message)
                    } else {
                        messageCard = this._createReceiverCard(message.message);
                    }

                    newList.appendChild(messageCard);
                }
            }
        }

        const oldList = document.querySelector("#chats-list");
		oldList.removeAttribute("id");
		oldList.hidden = true;
	
		// put in new quoteListContainer
        oldList.parentElement.appendChild(newList);
    }

    _createSenderCard(message) {
        return htmlToElement(
            `
            <div class="chat-container">
                <p>${message}</p>
            </div>
            `
        );
    }

    _createReceiverCard(message) {
        return htmlToElement(
            `
            <div class="chat-container darker">
                <p>${message}</p>
            </div>
            `
        );
    }
}