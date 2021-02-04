/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Jordan Hayes and Bowen Ding
 */

/** namespace. */
var rhit = rhit || {};

/**
 * 
 * USER COLLECTION VARIABLES
 * 
 */
rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_KEY_USERNAME = "username";
rhit.FB_KEY_NAME = "name";

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
rhit.fbProfileItemManger = null;

rhit.ROSEFIRE_REGISTRY_TOKEN = "b64b1811-556e-4087-a51b-49e2e7b0c2d7";

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

	get name() {
		return this._document.get(rhit.FB_KEY_NAME);
	}
}

rhit.FbProfileItemManger = class {
	constructor() {
		this.documents = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ITEMS);
    	this._unsubscribe = null;
	}

	add(name, description, priceRange, category) {
		this._ref.add({
			[rhit.FB_KEY_ITEM_NAME]: name,
			[rhit.FB_KEY_CATEGORY]: category,
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_PRICE]: priceRange,
			[rhit.FB_KEY_SELLER]: rhit.fbAuthManager.uid
		}).then(function (docRef) {
			console.log("Document written in ID: ", docRef.id);
		  })
		  .catch(function (error) {
			console.error("Error adding document: ", error);
		  });
	}

	get length() {
		return this._documentSnapshots.length;
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

rhit.MainPageController = class {
	constructor() {
		console.log('im the main page controller')

		document.querySelector("#logoutBtn").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}

		document.querySelector("#profileBtn").onclick = (event) => {
			window.location.href = "/profile-page.html";
		}
	}
}

rhit.ProfilePageController = class {
	static NAV_TABS = {
		ACCOUNT: "account",
		CHATS: "chats",
		FAVORITES: "favorites",
		MY_ITEMS: "my_items",
		APPOINTMENTS: "appointments"
	}
	
	constructor() {
		console.log('im the profile page controller');

		this._currentTab = rhit.ProfilePageController.NAV_TABS.ACCOUNT;
		this._previousTab = null;

		document.querySelector("#logoutBtn").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}

		document.querySelector("#homeBtn").onclick = (event) => {
			window.location.href = "/main-list.html";
		}

		document.querySelectorAll(".side-bar-nav").forEach((item) => {
			item.addEventListener("click", (event) => {
				this._setCurrentTab(item.id);
			});
		});

				let slider = document.getElementById('newItemRange');

		noUiSlider.create(slider, {
			start: [0, 100],
			connect: true,
			step: 5,
			tooltips: true,
			range: {
				'min': 0,
				'max': 500
			},
			format: {
				from: function(value) {
						return parseInt(value);
					},
				to: function(value) {
						return parseInt(value);
					}
				}
		});

		slider.noUiSlider.on('change', function () { 
			console.log(slider.noUiSlider.get());
		});

		mergeTooltips(slider, 15, ' - ');

		const myItemsListDiv = $("#my_items-list");
		const newItemsDiv = $("#my_items-new-item");

		document.querySelector("#addItemBtn").onclick = (event) => {
			const name = document.querySelector("#newItemName").value;
			const description = document.querySelector("#newItemDescription").value;
			const category = document.querySelector("#newItemCategory").value;
			const priceRange = {
				low: slider.noUiSlider.get()[0],
				high: slider.noUiSlider.get()[1]
			}

			rhit.fbItemManger.add(name, description, category, priceRange);

			myItemsListDiv.attr("hidden", false);
			newItemsDiv.attr("hidden", true);
		}

		document.querySelector("#switchNewItem").onclick = (event) => {
			myItemsListDiv.attr("hidden", true);
			newItemsDiv.attr("hidden", false);
		}

		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
	}

	updateView() {
		/**
		 * 
		 * ACCOUNT DOC SELECTORS
		 * 
		 */
		let name = rhit.fbUserManager.name.split(" ");
		document.querySelector("#firstNameInput").value = name[0];
		document.querySelector("#lastNameInput").value = name[name.length - 1];
	
		
	}

	_setCurrentTab(newTabName) {
		if (newTabName != this._currentTab) {
			$("#" + newTabName).addClass("selected-sidebar-item");
			$("#" + newTabName + "-div").attr("hidden", false);
			this._previousTab = this._currentTab;
	
			$("#" + this._previousTab).removeClass("selected-sidebar-item");
			$("#" + this._previousTab + "-div").attr("hidden", true);
			this._currentTab = newTabName;
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
		new rhit.MainPageController(uid);
	}

	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page.");
		new rhit.LoginPageController();
	}

	if (document.querySelector("#profilePage")) {
		const uid = urlParams.get("uid");
		console.log("You are on the profile page.");
		rhit.fbProfileItemManger = new rhit.FbProfileItemManger();
		new rhit.ProfilePageController(uid);
	}
};

/* Main */
rhit.main = function () {
	console.log("Ready");
	rhit.fbUserManager = new rhit.FbUserManager();
	rhit.fbAuthManager = new rhit.FbAuthManager();
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