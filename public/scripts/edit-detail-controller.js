var rhit = rhit || {};

rhit.EditItemDetailController = class {
	constructor(id) {
		console.log('im the edit item detail page controller');
		this._currFile = null;
		document.querySelector("#updateItemBtn").addEventListener("click", (event) => {
			const name = document.querySelector("#choseItemName").value;
			const description = document.querySelector("#choseItemDescription").value;
			const category = document.querySelector("#choseItemCategory").value;
			let slider = document.getElementById('choseItemRange');

			const priceRange = {
				low: slider.noUiSlider.get()[0],
				high: slider.noUiSlider.get()[1]
			};

			rhit.fbSingleItemManager.update(name, description, priceRange, category, this._currFile);
		});

		document.querySelector("#isActive").addEventListener("change", (event) => {
			rhit.fbSingleItemManager.updateActiveStatus();
		});

		// document.querySelector("#deleteItemBtn").onclick = (event) => {
		// 	console.log("delete button pressed");
		// 	rhit.fbSingleItemManager.delete().then((event) => {
		// 		window.location.href = "/my-item.html";
		// 	});
		// }

		document.querySelector("#photo").onclick = (event) => {
			const desertRef  = firebase.storage().ref().child(rhit.fbSingleItemManager.id);
				// Delete the file
			desertRef.delete().then(() => {
				console.log("firestorage DELETED");
			}).catch((error) => {
				console.log("ERROR:  ",error);
			});


			document.querySelector("#inputFile").click();
		}

		document.querySelector("#inputFile").addEventListener("change", (event) => {
			this._currFile = event.target.files[0];
			var reader = new FileReader();
			reader.onload = function(e) {
				$('#photo').attr('src', e.target.result);
			}

			reader.readAsDataURL(event.target.files[0]);
			console.log(`Received file named ${this._currFile.name}`);
		});

		// document.querySelector("#addPhoto").addEventListener("click", (event) => {
		// 	document.querySelector("#inputFile").click();
		// 	console.log(rhit.fbSingleItemManager.id);
		// });

		// document.querySelector("#inputFile").addEventListener("change", (event) => {
		// 	const file = event.target.files[0];
		// 	console.log(`Received file named ${file.name}`);
		// 	const storageRef = firebase.storage().ref().child(rhit.fbSingleItemManager.id);
		// 	storageRef.put(file).then((UploadTaskSnapshot) => {
		// 		console.log('photo uploaded');

		// 		storageRef.getDownloadURL().then((downloadUrl) => {
		// 			rhit.fbSingleItemManager.updatePhotoUrl(downloadUrl);
		// 		});
		// 	  });
		// });

		rhit.fbSingleItemManager.beginListening(this.updateView.bind(this));	
	}
  

	updateView() {
		console.log("category", rhit.fbSingleItemManager.category);

		document.querySelector("#choseItemName").value = rhit.fbSingleItemManager.name;
		document.querySelector("#choseItemDescription").value = rhit.fbSingleItemManager.description;
		document.querySelector("#choseItemCategory").value = rhit.fbSingleItemManager.category;
		console.log("photoURL=  ", rhit.fbSingleItemManager.photoUrl);
		document.querySelector("#photo").src = rhit.fbSingleItemManager.photoUrl || "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22290%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20290%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17730751f77%20text%20%7B%20fill%3A%23eceeef%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17730751f77%22%3E%3Crect%20width%3D%22290%22%20height%3D%22225%22%20fill%3D%22%2355595c%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2294.4453125%22%20y%3D%22119.1%22%3EThumbnail%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";
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

