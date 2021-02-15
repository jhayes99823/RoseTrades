var rhit = rhit || {};

 // From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.EditItemDetailController = class {
	constructor(id) {
		console.log('im the edit item detail page controller');

		document.querySelector("#updateItemBtn").addEventListener("click", (event) => {
			const name = document.querySelector("#choseItemName").value;
			const description = document.querySelector("#choseItemDescription").value;
			const category = document.querySelector("#choseItemCategory").value;
			let slider = document.getElementById('choseItemRange');

			const priceRange = {
				low: slider.noUiSlider.get()[0],
				high: slider.noUiSlider.get()[1]
			};

			rhit.fbSingleItemManager.update(name, description, priceRange, category);
		});

		document.querySelector("#isActive").addEventListener("change", (event) => {
			rhit.fbSingleItemManager.updateActiveStatus();
		});

		document.querySelector("#addPhoto").addEventListener("click", (event) => {
			document.querySelector("#inputFile").click();
			console.log(rhit.fbSingleItemManager.id);
		});

		document.querySelector("#inputFile").addEventListener("change", (event) => {
			const file = event.target.files[0];
			console.log(`Received file named ${file.name}`);
			const storageRef = firebase.storage().ref().child(rhit.fbSingleItemManager.id);
			storageRef.put(file).then((UploadTaskSnapshot) => {
				console.log('photo uploaded');

				storageRef.getDownloadURL().then((downloadUrl) => {
					rhit.fbSingleItemManager.updatePhotoUrl(downloadUrl);
				});
			  });
		});



		rhit.fbSingleItemManager.beginListening(this.updateView.bind(this));	
	}
  

	updateView() {
		document.querySelector("#choseItemName").value = rhit.fbSingleItemManager.name;
		document.querySelector("#choseItemDescription").value = rhit.fbSingleItemManager.description;
		document.querySelector("#choseItemCategory").value = rhit.fbSingleItemManager.category;
		document.querySelector("#photo").innerHTML = htmlToElement(`<img
		src= "${rhit.fbSingleItemManager.photoUrl}"
		alt="The seller didn't post any pictues yet>`);


		$("#isActive").attr("checked", rhit.fbSingleItemManager.isActive);
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
		console.log("is active ", rhit.fbSingleItemManager.isActive);
		console.log("item id", rhit.fbSingleItemManager.id);
		console.log("photoUrl  ", rhit.fbSingleItemManager.photoUrl);
	}

}

