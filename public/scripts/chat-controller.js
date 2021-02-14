var rhit = rhit || {};

rhit.ChatPageController = class {
    constructor(sender, receiever, receieverName) {
        console.log('i am the chat controller page');
        rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));

        console.log('sender  ', sender, '  receiver  ', receiever, '    name   ', receieverName);

        this._sender = sender;
        this._receiver = receiever;
        this._receiverName = receieverName;
        this._currChatIndex = -1;

        const messageInput = document.querySelector("#messageInput");

        messageInput.addEventListener("keypress", (event) => {
            if (event.key === 'Enter') {
                if (this._currChatIndex > -1 && messageInput.value != "") {
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
                    console.log('made it here    ', this._receiverName);
                    rhit.fbChatsManager.addNewChatString([{"username": this._sender, "name": rhit.fbUserManager.name}, {"username": this._receiver, "name": this._receiverName}], [{message: messageInput.value, sender: this._sender}]);
                    messageInput.value = "";
                }
            }
        });

        document.querySelector("#enterBtn").addEventListener('click', (event) => {
            if (this._currChatIndex > -1 && messageInput.value != "") {
                let chat = rhit.fbChatsManager.getItemAtIndex(this._currChatIndex);
                chat.messages.push({
                    message: messageInput.value,
                    sender: this._sender
                });
                rhit.fbChatsManager.update(chat);
                messageInput.value = "";
            } else {
                messageInput.value = "";
                rhit.fbChatsManager.addNewChatString([{"username": this._sender, "name": rhit.fbUserManager.name}, {"username": this._receiver, "name": this._receiverName}], [{message: messageInput.value, sender: this._sender}]);
            }
        });
    
        rhit.fbChatsManager.beginListening(this.updateView.bind(this));
    }

    search(nameKey, myArray){
		for (let i = 0; i < myArray.length; i++) {
            console.log('here  ', myArray[i].username,  '    ', nameKey);
			if (myArray[i].username === nameKey) {
				return i;
			}
        }
        
        return -1;
	}

    updateView() {
        const newList = htmlToElement('<div id="chats-list"></div>');

        for (let i = 0; i < rhit.fbChatsManager.length; i++) {
            let chat = rhit.fbChatsManager.getItemAtIndex(i);

            console.log('curr chat  ', chat);

            console.log('sender  ', this._sender, '  receiver  ', this._receiver);

            console.log('receiver index   ', this.search(this._receiver, chat.people));
            console.log('sender index     ', this.search(this._sender, chat.people));

            console.log('find the index   ', (this.search(this._sender, chat.people) > -1) && (this.search(this._receiver, chat.people) > -1), '     ', i);

            if (((this.search(this._sender, chat.people) > -1) && (this.search(this._receiver, chat.people) > -1)) == true) {
                this._currChatIndex = i;
                console.log('curr chat   ', i);
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