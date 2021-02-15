
var rhit = rhit || {};

rhit.AddItemPageController = class {
	constructor() {
		console.log('im the add item page controller');

		this._currFile = null;

		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
	
		document.querySelector("#addPhoto").addEventListener("click", (event) => {
			console.log('upload photo pressed');
			document.querySelector("#inputFile").click();
			document.querySelector("#inputFile").addEventListener("change", (event) => {
				this._currFile = event.target.files[0];
				console.log(`Received file named ${this._currFile.name}`);
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
			
			console.log(name, description, category, priceRange, rhit.fbUserManager.name, this._currFile);

			rhit.fbUserItemManager.add(name, description, priceRange, category, rhit.fbUserManager.name, this._currFile);
		});
	}

	updateView() {

	}
}