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

rhit.FB_KEY_SCHEDULE = "schedule";
rhit.fbAuthManager = null;
rhit.fbUserManager = null;
rhit.fbUserItemManager = null;
rhit.fbAllItemManager = null
rhit.fbSingleItemManager = null;

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
			console.log('fb user manager     ', doc);
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
					[rhit.FB_KEY_FAVORITE_ITEMS]: []
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
}

rhit.FbUserItemManager = class {
	static CATEGORIES = ["BOOKS", "ELECTRONICS", "FOOD", "FURNITURE", "OTHER"];

	constructor() {
		this.documents = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ITEMS);
    	this._unsubscribe = null;
	}

	add(name, description, priceRange, category) {
		this._ref.add({
			[rhit.FB_KEY_ITEM_NAME]: name,
			[rhit.FB_KEY_CATEGORY]: rhit.FbUserItemManager.CATEGORIES[category - 1],
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_PRICE]: priceRange,
			[rhit.FB_KEY_SELLER]: rhit.fbAuthManager.uid
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
		  docSnapshot.get(rhit.FB_KEY_PRICE)
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
		this._unsubscribe = this._ref.where(rhit.FB_KEY_SELLER, '!=', rhit.fbAuthManager.uid).onSnapshot((querySnapshot) => {
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
		  docSnapshot.get(rhit.FB_KEY_PRICE)
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