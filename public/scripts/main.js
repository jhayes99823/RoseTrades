/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Jordan Hayes and Bowen Ding
 */

/** namespace. */
var rhit = rhit || {};

rhit.ROSEFIRE_REGISTRY_TOKEN = "b64b1811-556e-4087-a51b-49e2e7b0c2d7";

/**
 * 
 * USER COLLECTION VARIABLES
 * 
 */
rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_KEY_USERNAME = "username";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_FAVORITE_ITEMS = "favorites";

/**
 * 
 * 
 * ITEM COLLECTION VARIABLES
 * 
 */
rhit.FB_COLLECTION_ITEMS = "items";
rhit.FB_KEY_CATEGORY = "category";
rhit.FB_KEY_ITEM_NAME = "name";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_SELLER = "seller";
rhit.FB_KEY_PRICE = "price";
rhit.FB_KEY_ISACTIVE = "isActive";
rhit.FB_KEY_SELLER_NAME = "sellerName";

rhit.FB_KEY_SCHEDULE = "schedule";

/**
 * 
 * MANAGER VARIABLES
 * 
 * 
 */
rhit.fbAuthManager = null;
rhit.fbUserManager = null;
rhit.fbUserItemManager = null;
rhit.fbAllItemManager = null
rhit.fbSingleItemManager = null;
rhit.fbChatsManager = null;

/**
 * 
 * 
 * CHAT COLLECTION VARIABLES
 * 
 * 
 */
rhit.FB_COLLECITON_CHATS = "chats";
rhit.FB_KEY_PEOPLE = "people";
rhit.FB_KEY_MESSAGES = "messages";

/**
 * 
 * 
 * MODELS
 * 
 */

 rhit.Item = class {
	constructor(id, name, description, category, priceRange) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.category = category;
		this.priceRange = priceRange;
	}
 }

 rhit.Chat = class {
	 constructor(id, people, messages) {
		this.id = id;
		this.people = people;
		this.messages = messages;
	 }
 }

/**
 * 
 * 
 * FIREBASE CONTROLLERS
 * 
 */

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		this._name = "";
		this._username = "";
	}

	get name() {
		return this._name || this._user.displayName;
	}

	get username() {
		return this._username;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signIn() {
		console.log("Sign in using Rosefire");
		Rosefire.signIn(rhit.ROSEFIRE_REGISTRY_TOKEN, (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);
			
			this._name = rfUser.name;
			this._username = rfUser.username;
			
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				} else {
					console.error("Custom auth error", errorCode, errorMessage);
				}
			});
		});
	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		return this._user.uid;
	}
}


rhit.FbUserManager = class {
	constructor() {
		this._collectoinRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._document = null;
	}

	beginListening(uid, changeListener) {
		console.log("Listening for uid", uid);
		const userRef = this._collectoinRef.doc(uid);
		this._unsubscribe = userRef.onSnapshot((doc) => {
			if (doc.exists) {
				this._document = doc;
				console.log('doc.data() :', doc.data());
				if (changeListener) {
					changeListener();
				}
			} else {
				console.log("This User object does not exist! (that's bad)");
			}
		});
	}

	get isListening() {
		return !!this._unsubscribe;
	}


	stopListening() {
		this._unsubscribe();
	}

	addNewUserMaybe(uid, name) {
		// First check if the user already exists.
		console.log("Checking User for uid = ", uid);
		const userRef = this._collectoinRef.doc(uid);
		return userRef.get().then((document) => {
			if (document.exists) {
				console.log("User already exists.  Do nothing");
				return false; // This will be the parameter to the next .then callback function.
			} else {
				// We need to create this user.
				console.log("Creating the user!");
				return userRef.set({
					[rhit.FB_KEY_NAME]: name,
					[rhit.FB_KEY_FAVORITE_ITEMS]: [],
				}).then(() => {
					return true;
				});
			}
		});
	}

	updateName(name) {
		const userRef = this._collectoinRef.doc(rhit.fbAuthManager.uid);
		return userRef.update({
				[rhit.FB_KEY_NAME]: name
			})
			.then(() => {
				console.log("Document successfully updated with name!");
			})
			.catch(function (error) {
				console.error("Error updating document: ", error);
			});
	}

	updateFavorites(favorites) {
		const userRef = this._collectoinRef.doc(rhit.fbAuthManager.uid);
		return userRef.update({
				[rhit.FB_KEY_FAVORITE_ITEMS]: favorites
			})
			.then(() => {
				console.log("Document successfully updated with name!");
			})
			.catch(function (error) {
				console.error("Error updating document: ", error);
			});
	}

	get name() {
		console.log('mt name  ', this._document.get(rhit.FB_KEY_NAME));
		return this._document.get(rhit.FB_KEY_NAME);
	}

	get favorites() {
		console.log('here   ', this._document);
		return this._document.get(rhit.FB_KEY_FAVORITE_ITEMS) || [];
	}
}

rhit.FbUserItemManager = class {
	static CATEGORIES = ["BOOKS", "ELECTRONICS", "FOOD", "FURNITURE", "OTHER"];

	constructor() {
		this.documents = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ITEMS);
    	this._unsubscribe = null;
	}

	add(name, description, priceRange, category, sellerName) {
		console.log('seller name  ', rhit.fbAuthManager.name);
		this._ref.add({
			[rhit.FB_KEY_ITEM_NAME]: name,
			[rhit.FB_KEY_CATEGORY]: rhit.FbUserItemManager.CATEGORIES[category - 1],
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_PRICE]: priceRange,
			[rhit.FB_KEY_SELLER]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_SELLER_NAME]: sellerName,
			[rhit.FB_KEY_ISACTIVE]: true
		}).then(function (docRef) {
			console.log("Document written in ID: ", docRef.id);
		  }).
		  then(() => {
			window.location.href = '/my-item.html';
		  })
		  .catch(function (error) {
			console.error("Error adding document: ", error);
		  });
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.where(rhit.FB_KEY_SELLER, "==", rhit.fbAuthManager.uid).onSnapshot((querySnapshot) => {
		  this._documentSnapshots = querySnapshot.docs;
		  changeListener();
		});
	  }
	
	  stopListening() {
		this._unsubscribe();
	  }

	get length() {
		return this._documentSnapshots.length;
	}

	getItemAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const item = new rhit.Item(
		  docSnapshot.id,
		  docSnapshot.get(rhit.FB_KEY_NAME),
		  docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
		  docSnapshot.get(rhit.FB_KEY_CATEGORY),
		  docSnapshot.get(rhit.FB_KEY_PRICE),
		  docSnapshot.get(rhit.FB_KEY_ISACTIVE),
		);
		return item;
	  }
}

rhit.FbAllItemManager = class {
	static CATEGORIES = ["BOOKS", "ELECTRONICS", "FOOD", "FURNITURE", "OTHER"];

	constructor() {
		this.documents = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ITEMS);
    	this._unsubscribe = null;
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.where(rhit.FB_KEY_SELLER, '!=', rhit.fbAuthManager.uid).where(rhit.FB_KEY_ISACTIVE, "==", true).onSnapshot((querySnapshot) => {
		  this._documentSnapshots = querySnapshot.docs;
		  console.log("FB ALL MANAGER DOC: ", querySnapshot.docs);
		  changeListener();
		});
	  }
	
	  stopListening() {
		this._unsubscribe();
	  }

	get length() {
		return this._documentSnapshots.length;
	}

	getItemAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const item = new rhit.Item(
		  docSnapshot.id,
		  docSnapshot.get(rhit.FB_KEY_NAME),
		  docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
		  docSnapshot.get(rhit.FB_KEY_CATEGORY),
		  docSnapshot.get(rhit.FB_KEY_PRICE),
		  docSnapshot.get(rhit.FB_KEY_ISACTIVE)
		);
		return item;
	}
}

rhit.FbSingleItemManager = class {
	constructor(id) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase
		  .firestore()
		  .collection(rhit.FB_COLLECTION_ITEMS)
		  .doc(id);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("no such document");
			}
		});
	
		this._ref
			.get()
			.then((doc) => {
			if (doc.exists) {
				this._documentSnapshot = doc;
			} else {
				window.location.href = "/main-list.html";
			}
			})
			.catch((error) => {
			console.log("Error getting document: ", error);
			});
	}
	
	stopListening() {
		this._unsubscribe();
	}

	update(name, description, priceRange, category) {
		this._ref.update({
			[rhit.FB_KEY_CATEGORY] : category,
			[rhit.FB_KEY_ITEM_NAME] : name,
			[rhit.FB_KEY_DESCRIPTION] : description,
			[rhit.FB_KEY_PRICE] : priceRange,
		}).then(() => {
			console.log("item has been updated");
		});
	}

	updateActiveStatus() {
		this._ref.update({
			[rhit.FB_KEY_ISACTIVE]: !this.isActive
		});
	}

	delete() {
		console.log("item successfully deleted!");
		return this._ref.delete();
	}

	get seller(){
		return rhit.fbAuthManager.uid;
	}

	get name() {
		return this._documentSnapshot.get(rhit.FB_KEY_NAME);
	}

	get description() {
		return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	}

	get category() {
		return this._documentSnapshot.get(rhit.FB_KEY_CATEGORY);
	}

	get priceRange() {
		return this._documentSnapshot.get(rhit.FB_KEY_PRICE);
	}

	get isActive() {
		return this._documentSnapshot.get(rhit.FB_KEY_ISACTIVE);
	}

	get seller() {
		return this._documentSnapshot.get(rhit.FB_KEY_SELLER);
	}

	get sellerName() {
		return this._documentSnapshot.get(rhit.FB_KEY_SELLER_NAME);
	}
}

rhit.FbChatsManager = class {
	constructor(sender, receiver) {
		this._documentSnapshots = []
		this._unsubscribe = null;
		this._ref = firebase
		  .firestore()
		  .collection(rhit.FB_COLLECITON_CHATS);
		this._sender = sender;
		this._receiver = receiver;
	}

	addNewChatString(people, messages) {
		console.log('people  ', people, '   messages  ', messages);
		this._ref.add({
			[rhit.FB_KEY_PEOPLE]: people,
			[rhit.FB_KEY_MESSAGES]: messages
		}).then(function (docRef) {
			console.log("Document written in ID: ", docRef.id);
		}).catch((error) => {
			console.log("Error getting document: ", error);
		});
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((querySnapshot) => {
			console.log('chats manager begin   ', querySnapshot);
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	
	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}

	getItemAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const chat = new rhit.Chat(
		  docSnapshot.id,
		  docSnapshot.get(rhit.FB_KEY_PEOPLE),
		  docSnapshot.get(rhit.FB_KEY_MESSAGES)
		);
		return chat;
	}

	update(chat) {
		return this._ref.doc(chat.id).update({
			[rhit.FB_KEY_MESSAGES]: chat.messages
		}).then(() => {
			console.log("Document successfully updated with name!");
		})
		.catch(function (error) {
			console.error("Error updating document: ", error);
		});
	}
}

/**
 * 
 * 
 * PAGE CONTROLLERS
 * 
 * 
 */

rhit.LoginPageController = class {
	constructor() {
		console.log('im the login page controller')
		document.querySelector("#loginButton").onclick = (event) => {
			console.log('made it here');
		  rhit.fbAuthManager.signIn();
		}
	}
}

/**
 * 
 * 
 * UTILITY FUNCTIONS
 * 
 */

 // From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

// https://refreshless.com/nouislider/examples/#section-merging-tooltips
/**
 * @param slider HtmlElement with an initialized slider
 * @param threshold Minimum proximity (in percentages) to merge tooltips
 * @param separator String joining tooltips
 */
function mergeTooltips(slider, threshold, separator) {

    var textIsRtl = getComputedStyle(slider).direction === 'rtl';
    var isRtl = slider.noUiSlider.options.direction === 'rtl';
    var isVertical = slider.noUiSlider.options.orientation === 'vertical';
    var tooltips = slider.noUiSlider.getTooltips();
    var origins = slider.noUiSlider.getOrigins();

    // Move tooltips into the origin element. The default stylesheet handles this.
    tooltips.forEach(function (tooltip, index) {
        if (tooltip) {
            origins[index].appendChild(tooltip);
        }
    });

    slider.noUiSlider.on('update', function (values, handle, unencoded, tap, positions) {

        var pools = [[]];
        var poolPositions = [[]];
        var poolValues = [[]];
        var atPool = 0;

        // Assign the first tooltip to the first pool, if the tooltip is configured
        if (tooltips[0]) {
            pools[0][0] = 0;
            poolPositions[0][0] = positions[0];
            poolValues[0][0] = values[0];
        }

        for (var i = 1; i < positions.length; i++) {
            if (!tooltips[i] || (positions[i] - positions[i - 1]) > threshold) {
                atPool++;
                pools[atPool] = [];
                poolValues[atPool] = [];
                poolPositions[atPool] = [];
            }

            if (tooltips[i]) {
                pools[atPool].push(i);
                poolValues[atPool].push(values[i]);
                poolPositions[atPool].push(positions[i]);
            }
        }

        pools.forEach(function (pool, poolIndex) {
            var handlesInPool = pool.length;

            for (var j = 0; j < handlesInPool; j++) {
                var handleNumber = pool[j];

                if (j === handlesInPool - 1) {
                    var offset = 0;

                    poolPositions[poolIndex].forEach(function (value) {
                        offset += 1000 - 10 * value;
                    });

                    var direction = isVertical ? 'bottom' : 'right';
                    var last = isRtl ? 0 : handlesInPool - 1;
                    var lastOffset = 1000 - 10 * poolPositions[poolIndex][last];
                    offset = (textIsRtl && !isVertical ? 100 : 0) + (offset / handlesInPool) - lastOffset;

                    // Center this tooltip over the affected handles
                    tooltips[handleNumber].innerHTML = poolValues[poolIndex].join(separator);
                    tooltips[handleNumber].style.display = 'block';
                    tooltips[handleNumber].style[direction] = offset + '%';
                } else {
                    // Hide this tooltip
                    tooltips[handleNumber].style.display = 'none';
                }
            }
        });
    });
}

rhit.createUserObjectIfNeeded = function () {
	return new Promise((resolve, reject) => {
		if (!rhit.fbAuthManager.isSignedIn) {
			console.log("Nobody is signed in.  No need to check if this is a new User");
			resolve(false);
			return;
		}
		if (!document.querySelector("#loginPage")) {
			console.log("We're not on the login page.  Nobody is signing in for the first time.");
			resolve(false);
			return;
		}
		rhit.fbUserManager.addNewUserMaybe(
			rhit.fbAuthManager.uid,
			rhit.fbAuthManager.name).then((wasUserAdded) => {
			resolve(wasUserAdded);
		});
	});
}

/**
 * 
 * 
 * PAGE DIRECTION
 * 
 * 
 */

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		console.log("Redirect to list page");
		window.location.href = "/main-list.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		console.log("Redirect to login page");
		window.location.href = "/";
	}
};

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#mainList")) {
		console.log("You are on the list page.");
		const uid = urlParams.get("uid");
		rhit.fbAllItemManager = new rhit.FbAllItemManager();
		new rhit.MainPageController(uid);
	}

	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page.");
		new rhit.LoginPageController();
	}

	if (document.querySelector("#accountPage")) {
		console.log('You are on the account page');
		new rhit.AccountPageController();
	}

	if (document.querySelector("#myItemsPage")) {
		console.log('You are on the my items page');
		rhit.fbUserItemManager = new rhit.FbUserItemManager();
		new rhit.MyItemPageController();
	}

	if (document.querySelector("#newItemPage")) {
		console.log('You are on the new item page');
		rhit.fbUserItemManager = new rhit.FbUserItemManager();
		new rhit.AddItemPageController();
	}

	if (document.querySelector("#itemDetailPage")) {
		console.log('You are on the item detail page');
		const id = urlParams.get("id");
		rhit.fbSingleItemManager = new rhit.FbSingleItemManager(id);
		new rhit.ItemDetailPage(id);
	}

	if (document.querySelector("#editItemDetailPage")) {
		console.log('You are on the item detail page');
		const id = urlParams.get("id");
		rhit.fbSingleItemManager = new rhit.FbSingleItemManager(id);
		new rhit.EditItemDetailController(id);
	}

	if (document.querySelector("#favoritesPage")) {
		console.log('You are on the favorites page');
		new rhit.FavoritesPageController();
	}

	if (document.querySelector("#chatListPage")) {
		console.log('You are on the chat list page');
		rhit.fbChatsManager = new rhit.FbChatsManager();
		new rhit.ChatListPageController();
	}

	if (document.querySelector("#chatPage")) {
		console.log('You are on the chat page');
		const senderUID = urlParams.get("sender");
		const receiverUID = urlParams.get('receiver');
		const receiverName = urlParams.get('receiverName');
		console.log('receiverName', receiverName);
		rhit.fbChatsManager = new rhit.FbChatsManager(senderUID, receiverUID);
		new rhit.ChatPageController(senderUID, receiverUID, receiverName);
	}
};

/* Main */
rhit.main = function () {
	console.log("Ready");

	const messaging = firebase.messaging();

	Notification.requestPermission().then((permission) => {
		if (permission === 'granted') {
		  console.log('Notification permission granted.');
		  // TODO(developer): Retrieve a registration token for use with FCM.
		  // In many cases once an app has been granted notification permission,
		  // it should update its UI reflecting this.
		//   resetUI();

			messaging.getToken({vapidKey: 'BGQCSymaqrIJJuXjy3R3mF4wpoCRuHKWXnQEfAbnqcU5kIdm7a6DwIC2inbwUG-ucJtkFmVxZbU_Vc1bYXz8cqQ'})
				.then((currentToken) => {
					console.log('token ', currentToken);
				});
		} else {
		  console.log('Unable to get permission to notify.');
		}
	});

	messaging.onMessage((payload) => {
		console.log('Message received. ', payload);
		// Update the UI to include the received message.
		// appendMessage(payload);
	});

	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbUserManager = new rhit.FbUserManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.createUserObjectIfNeeded().then((isUserNew) => {
			console.log('isUserNew :>> ', isUserNew);
			rhit.checkForRedirects();
			rhit.initializePage();
		});
		console.log("This code runs before any async code returns.");
	});
};

rhit.main();