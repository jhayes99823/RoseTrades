var rhit = rhit || {};

rhit.ChatPageController = class {
    constructor(sender, receiever, receieverName) {
        console.log('i am the chat controller page');
        rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));

        this._sender = sender;
        this._receiver = receiever;
        this._receiverName = receieverName;
        this._currChatIndex = -1;

        const messageInput = document.querySelector("#messageInput");

        messageInput.addEventListener("keypress", (event) => {
            if (event.key === 'Enter') {
                if (this._currChatIndex > -1 && (messageInput.value != '' || messageInput.value != ' ')) {
                    let chat = rhit.fbChatsManager.getItemAtIndex(this._currChatIndex);
                    chat.messages.push({
                        message: messageInput.value,
                        sender: this._sender
                    });
                    rhit.fbChatsManager.update(chat);
                    messageInput.value = "";
                } else {
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

        document.querySelector("#submitDeleteChat").addEventListener('click', (event) => {
            if (this._currChatIndex > -1) {
                let chat = rhit.fbChatsManager.getItemAtIndex(this._currChatIndex);
                console.log('chat id  ', chat.id);
                rhit.fbChatsManager.delete(chat.id);
            }
        });
    
        rhit.fbChatsManager.beginListening(this.updateView.bind(this));
    }

    search(nameKey, myArray){
		for (let i = 0; i < myArray.length; i++) {
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

            if (((this.search(this._sender, chat.people) > -1) && (this.search(this._receiver, chat.people) > -1)) == true) {
                this._currChatIndex = i;
                for (let message of chat.messages) {
                    let messageCard = null;
                    if (message.sender == this._sender) {
                        messageCard = this._createSenderCard(message.message)
                    } else {
                        messageCard = this._createReceiverCard(message.message);
                    }

                    newList.appendChild(messageCard);
                }
                let emptyChild = this._createPlaceHolderDiv();
                newList.appendChild(emptyChild);
            }
        }

        const oldList = document.querySelector("#chats-list");
		oldList.removeAttribute("id");
		oldList.hidden = true;
	
		// put in new quoteListContainer
        oldList.parentElement.appendChild(newList);

        if (this._currChatIndex < 0) {
            $("#deleteIcon").attr('hidden', false);
        }
    }


    _createPlaceHolderDiv(){
        return htmlToElement(
            `
            <div  id = "emptyPlaceHolder">
                
            </div>
            `
        );
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