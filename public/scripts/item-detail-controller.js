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

		document.querySelector("#helpIcon").addEventListener('mouseover', (event) => {
			$('#helpIcon').tooltip('show')
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

	_makeMeetingDetailObj(bidAmount, meetingPlace, meetingDate, meetingTime) {
		return {
			bidAmount,
			meetingPlace,
			meetingDate,
			meetingTime
		};
	}

	_makeUserObj(username, name) {
		return {
			username,
			name
		};
	}

	_makeItemObj(id, name, photoURL) {
		return {
			id,
			name,
			photoURL
		};
	}

	updateView() {
		document.querySelector("#choseItemName").value = rhit.fbSingleItemManager.name;
		document.querySelector("#choseItemDescription").value = rhit.fbSingleItemManager.description;
		document.querySelector("#choseItemCategory").value = rhit.fbSingleItemManager.category;
		document.querySelector("#photo").src = rhit.fbSingleItemManager.photoUrl || "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22290%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20290%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17730751f77%20text%20%7B%20fill%3A%23eceeef%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17730751f77%22%3E%3Crect%20width%3D%22290%22%20height%3D%22225%22%20fill%3D%22%2355595c%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2294.4453125%22%20y%3D%22119.1%22%3EThumbnail%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

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

		const warningIcon = document.querySelector("#warningContainer");

		warningIcon.addEventListener('mouseover', (event) => {
			$('#warningContainer').tooltip('show')
		});

		if (!rhit.fbSingleItemManager.isActive) {
			$("#warningContainer").attr('hidden', false);
		}

		const bidAmount = document.querySelector("#bidInput");
		const meetingDate = document.querySelector("#meetingDate");
		const meetingTime = document.querySelector("#meetingTime");
		const meetingPlace = document.querySelector("#meetingPlace");
		const submit = document.querySelector("#submitMeeting");

		$("#requestMeeting").on('show.bs.modal', (event) => {
			bidAmount.value = rhit.fbSingleItemManager.priceRange.high;
		});

		submit.addEventListener('click', (event) => {
			console.log(bidAmount.value, ' ', meetingDate.value, ' ', meetingTime.value, ' ', meetingPlace.value);

			const meetingDetails = this._makeMeetingDetailObj(bidAmount.value, meetingPlace.value, meetingDate.value, meetingTime.value);
			const requester = this._makeUserObj(rhit.fbAuthManager.uid, rhit.fbUserManager.name);
			const requestee = this._makeUserObj(rhit.fbSingleItemManager.seller, rhit.fbSingleItemManager.sellerName);
			const itemDetails = this._makeItemObj(rhit.fbSingleItemManager.id, rhit.fbSingleItemManager.name, rhit.fbSingleItemManager.photoUrl);

			rhit.fbAppointmentManager.newProposal(itemDetails, requestee, requester, meetingDetails);
			$("#success").snackbar("toggle");
		});

		console.log("name ", rhit.fbSingleItemManager.name);
		console.log("description", rhit.fbSingleItemManager.description);
		console.log("category", rhit.fbSingleItemManager.category);
		console.log("price low ", rhit.fbSingleItemManager.priceRange.low);
		console.log("price high ", rhit.fbSingleItemManager.priceRange.high);
		console.log("photoUrl", rhit.fbSingleItemManager.photoUrl);
		console.log("isActive", rhit.fbSingleItemManager.isActive);

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
						priceRange: rhit.fbSingleItemManager.priceRange,
						photoUrl: rhit.fbSingleItemManager.photoUrl
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
