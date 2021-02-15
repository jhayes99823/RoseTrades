var rhit = rhit || {};

rhit.ItemDetailPage = class {
	static ICON_STATUS = {
		FAVORITED: "favorite",
		UN_FAV: "favorite_border"
	}

	constructor(id) {
		this._itemId = id;
		console.log('im the item detail page controller');

		document.querySelector("#chatWithSellerBtn").addEventListener('click', (event) => {
			window.location.href = `/chat.html?sender=${rhit.fbAuthManager.uid}&receiver=${rhit.fbSingleItemManager.seller}&receiverName=${rhit.fbSingleItemManager.sellerName}`
		});

		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
		rhit.fbSingleItemManager.beginListening(this.updateView.bind(this));	
	}

	search(nameKey, myArray){
		for (let i = 0; i < myArray.length; i++) {
			if (myArray[i].id === nameKey) {
				return myArray[i];
			}
		}
	}

	searchIndex(nameKey, myArray){
		for (let i = 0; i < myArray.length; i++) {
			if (myArray[i].id === nameKey) {
				return i;
			}
		}
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

		mergeTooltips(slider, 15, ' - ');
		slider.style.marginTop = "70px";

		console.log("name ", rhit.fbSingleItemManager.name);
		console.log("description", rhit.fbSingleItemManager.description);
		console.log("category", rhit.fbSingleItemManager.category);
		console.log("price low ", rhit.fbSingleItemManager.priceRange.low);
		console.log("price high ", rhit.fbSingleItemManager.priceRange.high);

		const favs = rhit.fbUserManager.favorites;
		const favoriteIcon = document.querySelector("#favoritedContainer");

		if (this.search(this._itemId, favs)) {
			favoriteIcon.innerHTML = rhit.ItemDetailPage.ICON_STATUS.FAVORITED;
		} else {
			favoriteIcon.innerHTML = rhit.ItemDetailPage.ICON_STATUS.UN_FAV;
		}

		favoriteIcon.addEventListener("click", (event) => {
			favoriteIcon.innerHTML = (favoriteIcon.innerHTML == rhit.ItemDetailPage.ICON_STATUS.FAVORITED) ? rhit.ItemDetailPage.ICON_STATUS.UN_FAV : rhit.ItemDetailPage.ICON_STATUS.FAVORITED;

			if (favoriteIcon.innerHTML == rhit.ItemDetailPage.ICON_STATUS.FAVORITED) {
				if (!this.search(this._itemId, favs)) {
					favs.push({
						id: this._itemId,
						name: rhit.fbSingleItemManager.name,
						priceRange: rhit.fbSingleItemManager.priceRange
					});
				}
			} else if (favoriteIcon.innerHTML == rhit.ItemDetailPage.ICON_STATUS.UN_FAV){
				const index = this.searchIndex(this._itemId, favs);
				if (index > -1) {
					favs.splice(index, 1);
				}
			}

			rhit.fbUserManager.updateFavorites(favs);
		});
	}
}
