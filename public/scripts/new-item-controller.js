
var rhit = rhit || {};

rhit.AddItemPageController = class {
	constructor() {
		console.log('im the add item page controller');

		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
		
		document.querySelector("#logout").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#addPhoto").addEventListener("click", (event) => {
			console.log('upload photo pressed');
			document.querySelector("#inputFile").click();
			document.querySelector("#inputFile").addEventListener("change", (event) => {
				const file = event.target.files[0];
				console.log(`Received file named ${file.name}`);
				const storageRef = firebase.storage().ref().child(file.name);
				storageRef.put(file).then((UploadTaskSnapshot) => {
					console.log('photo uploaded');

					storageRef.getDownloadURL().then((downloadUrl) => {
						rhit.fbSingleItemManager.updatePhotoUrl(downloadUrl);
					});
				  });
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
		
		mergeTooltips(slider, 15, ' - ');

		document.querySelector("#addItemBtn").addEventListener("click", (event) => {
			const name = document.querySelector("#newItemName").value;
			const description = document.querySelector("#newItemDescription").value;
			const category = document.querySelector("#newItemCategory").value;
			const priceRange = {
				low: slider.noUiSlider.get()[0],
				high: slider.noUiSlider.get()[1]
			};
			
			console.log(name, description, category, priceRange, rhit.fbUserManager.name);

			rhit.fbUserItemManager.add(name, description, priceRange, category, rhit.fbUserManager.name);
		});
	}

	updateView() {

	}
}