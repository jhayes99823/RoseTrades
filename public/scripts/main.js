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
rhit.FB_KEY_FNAME = 'firstName';
rhit.FB_KEY_LNAME = 'lastName';

rhit.fbAuthManager = null;

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
		  this._user = user;
		  changeListener();
		});
	  }

	  signIn() {
		Rosefire.signIn("b64b1811-556e-4087-a51b-49e2e7b0c2d7", (err, rfUser) => {
		  if (err) {
			console.log("Rosefire error!", err);
			return;
		  }

		  console.log("Rosefire success!", rfUser);

		  let query = this._ref.where(rhit.FB_KEY_USERNAME, "==", rfUser).onSnapshot((doc) => {
			if (!doc.exists) {
					const names = this._splitName(rfUser.name);
					this._ref.add({
						[rhit.FB_KEY_USERNAME]: rfUser.username,
						[rhit.FB_KEY_FNAME]: names[0],
						[rhit.FB_KEY_LNAME]: names[names.length - 1]
					});
				}
		  });

		  firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
			if (error.code === 'auth/invalid-custom-token') {
			  console.log("The token you provided is not valid.");
			} else {
			  console.log("signInWithCustomToken error", error.message);
			}
		  });
		});
	
	  }
	
	  signOut() {
		firebase.auth().signOut().catch((error) => {
		  console.log("sign out error ", error);
		});
	  }
	
	  get isSignedIn() {
		return !!this._user;
	  }
	
	  get uid() {
		return this._user.uid;
	  }

	  _splitName(user) {
		  return user.split(" ");
	  }
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
	  window.location.href = "/main-list.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
	  window.location.href = "/";
	}
  }

  rhit.initPage = function () {
	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page");
		new rhit.LoginPageController();
	  }

	if (document.querySelector("#mainList")) {
		console.log("You are on the main listing page");
		new rhit.MainPageController();
	}

	if (document.querySelector("#profilePage")) {
		console.log("You are on the profile page");
		new rhit.ProfilePageController();
	}
  }

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
	constructor() {
		console.log('im the profile page controller');

		document.querySelector("#homeBtn").onclick = (event) => {
			window.location.href = "/main-list.html";
		}
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log('check for redirects and init the page');
	
		// check for redirects
		rhit.checkForRedirects();
	
		// init page
		rhit.initPage();
	  });
};

rhit.main();
