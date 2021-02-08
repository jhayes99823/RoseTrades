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

rhit.MainPageController = class {
	constructor() {
		console.log('im the main page controller')

		document.querySelector("#logout").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}

		rhit.fbAllItemManager.beginListening(this.updateList.bind(this));
	}

	updateList() {
		const newList = htmlToElement('<div id="itemRow" class="row"> </div>');

		for (let i = 0; i < rhit.fbAllItemManager.length; i++) {
			const item = rhit.fbAllItemManager.getItemAtIndex(i);
			const newCard = this._createCard(item);
		
			// newCard.onclick = (event) => {
			//   console.log(`You clicked on ${mq.id}`);
			//   // rhit.storage.setMovieQuoteId(mq.id);
		
			//   window.location.href = `/moviequote.html?id=${mq.id}`;
			// };
			newList.appendChild(newCard);
		}

		// remove old quoteListContainer
		const oldList = document.querySelector("#itemRow");
		oldList.removeAttribute("id");
		oldList.hidden = true;
	
		// put in new quoteListContainer
		oldList.parentElement.appendChild(newList);

		const allCards = document.querySelectorAll(".card-with-non-favorite");
		
		for (const card of allCards) {
			const moreDetailBtn = card.querySelector('.more-details');

			moreDetailBtn.addEventListener("click", (event) => {
				window.location.href = `item-detail.html?id=${card.id}`;
			});

			// const favoriteBtn = card.querySelector(".favorite-btn");

			// favoriteBtn.addEventListener("click", (event) => {
			// 	const userFavs = rhit.fbUserManager.favorites;

			// 	console.log('userFavs', userFavs);

			// 	// userFavs.append(card.id);

			// 	// rhit.fbUserManager.updateFavorites(userFavs);

			// 	// favoriteBtn.innerHTML = favorite;
			// });
		}
	}

	_createCard(item) {
		return htmlToElement(`
		<div id="${item.id}" class="col-md-4 card-with-non-favorite">
              <div class="card mb-4 box-shadow" data-item-id="${item.id}">
                <img class="card-img-top"
                  data-src="holder.js/100px225?theme=thumb&amp;bg=55595c&amp;fg=eceeef&amp;text=Thumbnail"
                  alt="Thumbnail [100%x225]" style="height: 225px; width: 100%; display: block"
                  src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22290%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20290%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17730751f77%20text%20%7B%20fill%3A%23eceeef%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17730751f77%22%3E%3Crect%20width%3D%22290%22%20height%3D%22225%22%20fill%3D%22%2355595c%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2294.4453125%22%20y%3D%22119.1%22%3EThumbnail%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                  data-holder-rendered="true" />
                <div class="card-body">
                  <p class="card-text">${item.name} - $${item.priceRange.low} - ${item.priceRange.high}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="btn-group">
                      <button type="button" class="btn btn-sm more-details">
                        More Details
                      </button>
					</div>

					</div>
                </div>
              </div>
			</div>
		`);
	}
}

rhit.AccountPageController = class {
	constructor() {
		console.log('im the account page controller');

		document.querySelector("#logout").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
	}

	updateView() {
		let name = rhit.fbUserManager.name.split(" ");

		const savedFirstName = name[0];
		const savedLastName = name[name.length - 1];

		const firstNameInput = document.querySelector("#firstNameInput");
		const lastNameInput = document.querySelector("#lastNameInput");

		firstNameInput.value = savedFirstName;
		lastNameInput.value = savedLastName;

		firstNameInput.addEventListener("input", (event) => {
			if ((firstNameInput.value != savedFirstName) || (lastNameInput.value != savedLastName)) {
				$("#updateBtn").attr("disabled", false);
			} else {
				$("#updateBtn").attr("disabled", true);
			}
		});

		lastNameInput.addEventListener("input", (event) => {
			if ((lastNameInput.value != savedLastName) || (firstNameInput.value != savedFirstName)) {
				$("#updateBtn").attr("disabled", false);
			} else {
				$("#updateBtn").attr("disabled", true);
			}
		});

		document.querySelector("#updateBtn").addEventListener('click', (event) => {
			rhit.fbUserManager.updateName(firstNameInput.value + " " + lastNameInput.value);
		});
	}
}

rhit.MyItemPageController = class {
	constructor() {
		console.log('I am at the MyItemPageController');

		document.querySelector("#addItemBtn").addEventListener("click", (event) => {
			window.location.href = "/new-item.html";
		});

		rhit.fbUserItemManager.beginListening(this.updateList.bind(this));
	}

	updateList() {
		const newList = htmlToElement('<div id="itemRow" class="row"> </div>');

		for (let i = 0; i < rhit.fbUserItemManager.length; i++) {
			const item = rhit.fbUserItemManager.getItemAtIndex(i);
			const newCard = this._createCard(item);
			//// added them so that more details can jump to item-detail.html
			// newCard.addEventListener("click", (event) => {
			// console.log(`You clicked on ${item.id}`);
			// window.location.href = `item-detail.html?id=${item.id}`;
			// });
		
		
			newList.appendChild(newCard);
		}

		// remove old quoteListContainer
		const oldList = document.querySelector("#itemRow");
		oldList.removeAttribute("id");
		oldList.hidden = true;
	
		// put in new quoteListContainer
		oldList.parentElement.appendChild(newList);

		const allCards = document.querySelectorAll(".detail-card");
        console.log(allCards);
        for (const card of allCards) {
			console.log("item id;  ", card.id);
            const moreDetailBtn = card.querySelector('.more-details');
            moreDetailBtn.addEventListener("click", (event) => {
				window.location.href = `item-detail.html?id=${card.id}`;
            });

    	}
		
	}

	_createCard(item) {
		return htmlToElement(`
		<div id = "${item.id}" class="col-md-4 detail-card">
              <div class="card mb-4 box-shadow">
                <img class="card-img-top"
                  data-src="holder.js/100px225?theme=thumb&amp;bg=55595c&amp;fg=eceeef&amp;text=Thumbnail"
                  alt="Thumbnail [100%x225]" style="height: 225px; width: 100%; display: block"
                  src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22290%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20290%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17730751f77%20text%20%7B%20fill%3A%23eceeef%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17730751f77%22%3E%3Crect%20width%3D%22290%22%20height%3D%22225%22%20fill%3D%22%2355595c%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2294.4453125%22%20y%3D%22119.1%22%3EThumbnail%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                  data-holder-rendered="true" />
                <div class="card-body">
                  <p class="card-text">${item.name} - $${item.priceRange.low} - ${item.priceRange.high}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="btn-group">
                      <button type="button" class="more-details btn btn-sm">
                        More Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
			</div>
		`);
	}
}

rhit.AddItemPageController = class {
	constructor() {
		console.log('im the add item page controller');

		document.querySelector("#logout").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
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

		document.querySelector("#addItemBtn").addEventListener("click", (event) => {
			const name = document.querySelector("#newItemName").value;
			const description = document.querySelector("#newItemDescription").value;
			const category = document.querySelector("#newItemCategory").value;
			const priceRange = {
				low: slider.noUiSlider.get()[0],
				high: slider.noUiSlider.get()[1]
			};
			
			console.log(name, description, category, priceRange);

			rhit.fbUserItemManager.add(name, description, priceRange, category);
		});
	}
}

rhit.ItemDetailPage = class {
	constructor(id) {
		console.log('im the item detail page controller');
		//Reference code from MYMOVIEQUOTE
		// if(rhit.fbSingleQuoteManager.author == rhit.fbAuthManager.uid){
		// 	document.querySelector("#menuEdit").style.display = "flex";
		// 	document.querySelector("#menuDelete").style.display = "flex";
		// }
		let editMode = false;
		if(rhit.fbSingleItemManager.seller == rhit.fbAuthManager.uid){
			document.querySelector("#editItemBtn").style.display = "flex";
			document.querySelector("#editItemBtn").onclick = (event) => {
				editMode = !editMode;
				console.log("editMode ON");
				//console.log(document.querySelector("#detailButtomButton").innerHTML );
				document.querySelector("#choseItemName").disabled = false;
				document.querySelector("#choseItemDescription").disabled = false;
				document.querySelector("#choseItemRange").disabled = false;
				document.querySelector("#choseItemCategory").disabled = false;
				document.querySelector("#updateItemBtn").style.visibility = 'visible';
				document.querySelector("#editItemBtn").style.display = "none";
			};
		
			if(document.querySelector("#updateItemBtn")){
				const name = document.querySelector("#choseItemName").value;
				const description = document.querySelector("#choseItemDescription").value;
				const priceRange = document.querySelector("#choseItemRange").value;
				const category = document.querySelector("#choseItemCategory").value;
				//rhit.fbSingleItemManager.update(name, description, priceRange, category );
			}
		
			
		};

		// document.querySelector("#submitEditQuote").onclick = (event) => {
		// 	const quote = document.querySelector("#inputQuote").value;
		// 	const movie = document.querySelector("#inputMovie").value;
		// 	console.log(quote, movie);
		// 	rhit.fbSingleQuoteManager.update(quote, movie);
		// };

		rhit.fbSingleItemManager.beginListening(this.updateView.bind(this));
			
		
	}


	updateView() {

		document.querySelector("#choseItemName").value = rhit.fbSingleItemManager.name;
		document.querySelector("#choseItemDescription").value = rhit.fbSingleItemManager.description;
		document.querySelector("#choseItemCategory").value = rhit.fbSingleItemManager.category;

		let slider = document.getElementById('choseItemRange');

		noUiSlider.create(slider, {
			start: [rhit.fbSingleItemManager.priceRange.low, 
				rhit.fbSingleItemManager.priceRange.high],
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
		slider.style.marginTop = "70px";
		
		

		console.log("name ", rhit.fbSingleItemManager.name);
		console.log("description", rhit.fbSingleItemManager.description);
		console.log("category", rhit.fbSingleItemManager.category);
		console.log("price low ", rhit.fbSingleItemManager.priceRange.low);
		console.log("price high ", rhit.fbSingleItemManager.priceRange.high);
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