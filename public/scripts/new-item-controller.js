var rhit = rhit || {};

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