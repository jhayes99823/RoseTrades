//import "firebase/storage"; //I don't know why adding firebasestorge on html doesn't work so i added it here
/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Jordan Hayes and Bowen Ding
 */

/** namespace. */
var rhit = rhit || {};

rhit.PAGES = ['home', 'account', 'chats', 'favorites', 'my_items', 'appointments'];
rhit.CURR_PAGE_INDEX = 0;
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
rhit.FB_KEY_PENDING_REQUESTS = "pending_reqs";

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
rhit.FB_KEY_KEYWORD = "keywords";
rhit.FB_PHOTOURL = "photoUrl";

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
rhit.fbAppointmentManager = null;
rhit.fbSingleAppointmentManager = null;
rhit.fbUserManagerLite = null;

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
 * APPOINTMENT COLLECTION VARIABLES
 * 
 * 
 */

rhit.FB_COLLECTION_APPOINTMENTS = 'appointments';
rhit.FB_KEY_USER_REQUESTED = 'requestee';
rhit.FB_KEY_REQUESTER = 'requester';
rhit.FB_KEY_PROPOSALS = 'proposals';
rhit.FB_KEY_ITEM_DETAILS = 'itemID';
rhit.FB_KEY_MEETING_DETAILS = 'meetingDetails';
rhit.FB_KEY_STATUS = 'status';

/**
 * 
 * 
 * MODELS
 * 
 */

 rhit.Item = class {
	constructor(id, name, description, category, priceRange, isActive, photoUrl, keywords) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.category = category;
		this.priceRange = priceRange;
		this.isActive = isActive;
		this.photoUrl = photoUrl;
		this.keywords = keywords;
	}
 }

 rhit.Chat = class {
	 constructor(id, people, messages) {
		this.id = id;
		this.people = people;
		this.messages = messages;
	 }
 }

rhit.Appointment = class {
	constructor(id, itemDetails, requester, requestee, proposals, status) {
		this.id = id;
		this.itemDetails = itemDetails;
		this.requester = requester;
		this.requestee = requestee;
		this.proposals = proposals;
		this.status = status;
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
					[rhit.FB_KEY_PENDING_REQUESTS]: 0
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
		return this._document.get(rhit.FB_KEY_NAME);
	}

	get favorites() {
		return this._document.get(rhit.FB_KEY_FAVORITE_ITEMS) || [];
	}

	get pendingReqs() {
		return this._document.get(rhit.FB_KEY_PENDING_REQUESTS) || 0;
	}
}

rhit.FbUserManagerLite = class {
	constructor(uid) {
		this._collectoinRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(uid);
		this._document = null;
	}

	beginListening() {
		this._collectoinRef.onSnapshot((doc) => {
			if (doc.exists) {
				this._document = doc;
				console.log('doc.data() :', doc.data());
			} else {
				console.log("This User object does not exist! (that's bad)");
			}
		});
	}

	updatePendingReqs() {
		let currPendingReqs = this.pendingReqs + 1;
		console.log('new pending reqs  ', currPendingReqs);
		return this._collectoinRef.update({
			[rhit.FB_KEY_PENDING_REQUESTS]: currPendingReqs
		}).then(() => {
			console.log("Document successfully updated with name!");
		})
		.catch(function (error) {
			console.error("Error updating document: ", error);
		});
	}

	deletePendingReq() {
		if (this.pendingReqs > 0) {
			let currPendingReqs = this.pendingReqs - 1;
			console.log('new pending reqs  ', currPendingReqs);
			return this._collectoinRef.update({
				[rhit.FB_KEY_PENDING_REQUESTS]: currPendingReqs
			}).then(() => {
				console.log("Document successfully updated with name!");
			})
			.catch(function (error) {
				console.error("Error updating document: ", error);
			});
		}
	}

	get pendingReqs() {
		return this._document.get(rhit.FB_KEY_PENDING_REQUESTS) || 0;
	}
}

rhit.FbUserItemManager = class {
	static CATEGORIES = ["BOOKS", "ELECTRONICS", "FOOD", "FURNITURE", "OTHER"];

	constructor() {
		this.documents = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ITEMS);
		this._storageRef = null;
		this._newItemId = null;
    	this._unsubscribe = null;
	}

	add(name, description, priceRange, category, sellerName, file, keywords) {
		this._ref.add({
			[rhit.FB_KEY_ITEM_NAME]: name,
			[rhit.FB_KEY_CATEGORY]: category,
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_PRICE]: priceRange,
			[rhit.FB_KEY_SELLER]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_SELLER_NAME]: sellerName,
			[rhit.FB_KEY_ISACTIVE]: true,
			[rhit.FB_PHOTOURL]: "",
			[rhit.FB_KEY_KEYWORD]: keywords
		}).then((docRef) => {
			console.log("Document written in ID: ", docRef.id);
			return docRef.id;
		  }).
		  then((id) => {
			this._newItemId = id;
			this._storageRef = firebase.storage().ref().child(id);
			return this._storageRef.put(file);
		  }).
		  then((UploadTaskSnapshot) => {
			return this._storageRef.getDownloadURL();
		  }).
		  then((downloadUrl) => {
			rhit.fbSingleItemManager = new rhit.FbSingleItemManager(this._newItemId);
			rhit.fbSingleItemManager.updatePhotoUrl(downloadUrl)
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

	get id(){
		return this._id;
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
		  docSnapshot.get(rhit.FB_PHOTOURL),
		  docSnapshot.get(rhit.FB_KEY_KEYWORD)
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

	searchByKeyword(changeListener, search) {
		console.log('being search with  ', search);
		this._unsubscribe = this._ref.where(rhit.FB_KEY_KEYWORD, "array-contains-any", search).onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}

	beginListening(changeListener, category = '') {
		let query = this._ref
						.where(rhit.FB_KEY_SELLER, '!=', rhit.fbAuthManager.uid)
						.where(rhit.FB_KEY_ISACTIVE, "==", true);
						
		if (category != '') {
			query = query.where(rhit.FB_KEY_CATEGORY, '==', category);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
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
		  docSnapshot.get(rhit.FB_PHOTOURL),
		  docSnapshot.get(rhit.FB_KEY_KEYWORD)
		);
		return item;
	}
}

rhit.FbSingleItemManager = class {
	constructor(id) {
		this._id = id;
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

	updatePhotoUrl(photoUrl){
		this._ref.update({
			[rhit.FB_PHOTOURL]: photoUrl,
		}).then(() => {
			console.log("photourl add successful");
		}).catch(() => {
			console.error("Error for adding photo", error)
		});
	}

	update(name, description, priceRange, category, file) {
		this._ref.update({
			[rhit.FB_KEY_CATEGORY] : category,
			[rhit.FB_KEY_ITEM_NAME] : name,
			[rhit.FB_KEY_DESCRIPTION] : description,
			[rhit.FB_KEY_PRICE] : priceRange,
			[rhit.FB_PHOTOURL]: "",
		}).then(() => {
			this._storageRef = firebase.storage().ref().child(this._id);
			return this._storageRef.put(file);
			
		}).then((UploadTaskSnapshot) => {
			return this._storageRef.getDownloadURL();
		  }).
		  then((downloadUrl) => {
				this.updatePhotoUrl(downloadUrl);
		  }).
		  then(() => {
			window.location.href = '/my-item.html';
			console.log("item has been updated");
		  })
		  .catch(function (error) {
			console.error("Error adding document: ", error);
		  });;
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

	get photoUrl() {
		return this._documentSnapshot.get(rhit.FB_PHOTOURL);
	}

	get id() {
		return this._id;
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

	delete(id) {
		console.log("item successfully DELETED");
		return this._ref.doc(id)
					.delete()
					.then(() => {
						window.location.href = '/chat-list.html';
					}).catch((error) => {
						console.log('error:  ', error);
					})
	}
}

rhit.FbAppointmentManager = class {
	static STATUS = {
		PENDING: 'PENDING',
		ACCEPTED: 'ACCEPTED',
		DECLINED: 'DECLINED'
	}

	constructor(itemID) {
		this._itemID = itemID;
		this._documentSnapshots = [];
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_APPOINTMENTS);		
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	

	newProposal(itemDetails, requestee, requester, meetinDetails) {
		rhit.fbUserManagerLite = new rhit.FbUserManagerLite(requestee.username);
		rhit.fbUserManagerLite.beginListening();

		this._ref.add({
			[rhit.FB_KEY_ITEM_DETAILS]: itemDetails,
			[rhit.FB_KEY_REQUESTER]: requester,
			[rhit.FB_KEY_USER_REQUESTED]: requestee,
			[rhit.FB_KEY_PROPOSALS]: [meetinDetails],
			[rhit.FB_KEY_STATUS]: rhit.FbAppointmentManager.STATUS.PENDING
		}).then(function (docRef) {
			console.log("Document written in ID: ", docRef.id);
			rhit.fbUserManagerLite.updatePendingReqs();
		})
		.catch((error) => {
			console.log("Error getting document: ", error);
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
		const appointment = new rhit.Appointment(
		  docSnapshot.id,
		  docSnapshot.get(rhit.FB_KEY_ITEM_DETAILS),
		  docSnapshot.get(rhit.FB_KEY_REQUESTER),
		  docSnapshot.get(rhit.FB_KEY_USER_REQUESTED),
		  docSnapshot.get(rhit.FB_KEY_PROPOSALS),
		  docSnapshot.get(rhit.FB_KEY_STATUS)
		);
		return appointment;
	}
}

rhit.FbSingleAppointmentManager = class {
	constructor(id) {
		this._id = id;
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase
		  .firestore()
		  .collection(rhit.FB_COLLECTION_APPOINTMENTS)
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
				window.location.href = "/appointments.html";
			}
			})
			.catch((error) => {
			console.log("Error getting document: ", error);
			});
	}
	
	stopListening() {
		this._unsubscribe();
	}

	acceptMeeting() {
		rhit.fbUserManagerLite = new rhit.FbUserManagerLite(this.requestee.username);
		rhit.fbUserManagerLite.beginListening();

		return this._ref.update({
			[rhit.FB_KEY_STATUS]: rhit.FbAppointmentManager.STATUS.ACCEPTED
		}).then(() => {
			console.log("Document successfully updated status!");
			rhit.fbUserManagerLite.deletePendingReq();
		})
		.catch(function (error) {
			console.error("Error updating document: ", error);
		});
	}

	declineMeeting() {
		rhit.fbUserManagerLite = new rhit.FbUserManagerLite(this.requestee.username);
		rhit.fbUserManagerLite.beginListening();

		return this._ref.update({
			[rhit.FB_KEY_STATUS]: rhit.FbAppointmentManager.STATUS.DECLINED
		}).then(() => {
			console.log("Document successfully updated status!");
			rhit.fbUserManagerLite.deletePendingReq();
		})
		.catch(function (error) {
			console.error("Error updating document: ", error);
		});
	}

	deleteMeeting() {
		return this._ref.delete().then(() => {
			console.log("Doc successfully deleted");
			window.location.href = '/appointments.html';
		  })
		  .catch((error) => {
			console.log("Error deleting document: ", error);
		  });
	}

	get itemDetails() {
		return this._documentSnapshot.get(rhit.FB_KEY_ITEM_DETAILS);
	}
	
	get proposals() {
		return this._documentSnapshot.get(rhit.FB_KEY_PROPOSALS);
	}

	get status() {
		return this._documentSnapshot.get(rhit.FB_KEY_STATUS);
	}

	get requester() {
		return this._documentSnapshot.get(rhit.FB_KEY_REQUESTER);
	}

	get requestee() {
		return this._documentSnapshot.get(rhit.FB_KEY_USER_REQUESTED);
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
		  rhit.fbAuthManager.signIn();
		}
	}
}

rhit.NavBarController = class {
	constructor(newTab) {
		this._newTab = newTab;
		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
	}

	updateView() {
		console.log('pending reqs:   ', rhit.fbUserManager.pendingReqs);

		document.querySelector("#logout").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		
		console.log('newTab   ', this._newTab);
		console.log('curr page index ', rhit.CURR_PAGE_INDEX);

		if (rhit.fbUserManager.pendingReqs) {
			document.querySelector("#appointments").innerHTML = `Appointments <span class="badge badge-warning">${rhit.fbUserManager.pendingReqs} Pending</span>`;
		}

		$("#" + rhit.PAGES[rhit.CURR_PAGE_INDEX]).removeClass('active');

		rhit.CURR_PAGE_INDEX = rhit.PAGES.indexOf(this._newTab);

		if (rhit.CURR_PAGE_INDEX > -1) {
			$("#" + rhit.PAGES[rhit.CURR_PAGE_INDEX]).addClass('active');
		}

		console.log('curr page index ', rhit.CURR_PAGE_INDEX);
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
		new rhit.NavBarController('home');
		rhit.fbAllItemManager = new rhit.FbAllItemManager();
		new rhit.MainPageController(uid);
	}

	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page.");
		new rhit.LoginPageController();
	}

	if (document.querySelector("#accountPage")) {
		console.log('You are on the account page');
		new rhit.NavBarController('account');
		new rhit.AccountPageController();
	}

	if (document.querySelector("#myItemsPage")) {
		console.log('You are on the my items page');
		new rhit.NavBarController('my_items');
		rhit.fbUserItemManager = new rhit.FbUserItemManager();
		new rhit.MyItemPageController();
	}

	if (document.querySelector("#newItemPage")) {
		console.log('You are on the new item page');
		new rhit.NavBarController('my_items');
		rhit.fbUserItemManager = new rhit.FbUserItemManager();
		new rhit.AddItemPageController();
	}

	if (document.querySelector("#itemDetailPage")) {
		console.log('You are on the item detail page');
		const id = urlParams.get("id");
		new rhit.NavBarController('');
		rhit.fbSingleItemManager = new rhit.FbSingleItemManager(id);
		rhit.fbAppointmentManager = new rhit.FbAppointmentManager(id);
		new rhit.ItemDetailPage(id);
	}

	if (document.querySelector("#editItemDetailPage")) {
		console.log('You are on the item detail page');
		const id = urlParams.get("id");
		new rhit.NavBarController('');
		rhit.fbSingleItemManager = new rhit.FbSingleItemManager(id);
		new rhit.EditItemDetailController(id);
	}

	if (document.querySelector("#favoritesPage")) {
		new rhit.NavBarController('favorites');
		console.log('You are on the favorites page');
		new rhit.FavoritesPageController();
	}

	if (document.querySelector("#chatListPage")) {
		new rhit.NavBarController('chats');
		console.log('You are on the chat list page');
		rhit.fbChatsManager = new rhit.FbChatsManager();
		new rhit.ChatListPageController();
	}

	if (document.querySelector("#chatPage")) {
		new rhit.NavBarController('');
		console.log('You are on the chat page');
		const senderUID = urlParams.get("sender");
		const receiverUID = urlParams.get('receiver');
		const receiverName = urlParams.get('receiverName');
		rhit.fbChatsManager = new rhit.FbChatsManager(senderUID, receiverUID);
		new rhit.ChatPageController(senderUID, receiverUID, receiverName);
	}

	if (document.querySelector("#appointmentListPage")) {
		new rhit.NavBarController('appointments');
		console.log('You are on the appointment list page');
		rhit.fbAppointmentManager = new rhit.FbAppointmentManager();
		new rhit.AppointmentListPageController();
	}

	if (document.querySelector("#appointmentDetailPage")) {
		new rhit.NavBarController('');
		console.log('You are on the appointment detail page');
		const id = urlParams.get("id");
		const isRequester = urlParams.get("isRequester");
		rhit.fbSingleAppointmentManager = new rhit.FbSingleAppointmentManager(id);
		new rhit.AppointmentDetailPageController(isRequester);
	}
};

/* Main */
rhit.main = function () {
	console.log("Ready");

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