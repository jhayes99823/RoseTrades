var rhit = rhit || {};

rhit.FavoritesPageController = class {
    constructor() {
        console.log('i am the favorites page controller');

		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
    }

    updateView() {
        const newList = htmlToElement('<div id="itemRow" class="row"> </div>');

		for (let i = 0; i < rhit.fbUserManager.favorites.length; i++) {
            const item = rhit.fbUserManager.favorites[i];
			const newCard = this._createCard(item);
		
			newList.appendChild(newCard);
        }
        
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
		}
    }

    _createCard(item) {
		return htmlToElement(`
		<div id="${item.id}" class="col-md-4 card-with-non-favorite">
              <div class="card mb-4 box-shadow" data-item-id="${item.id}">
                <img class="card-img-top"
                  data-src="holder.js/100px225?theme=thumb&amp;bg=55595c&amp;fg=eceeef&amp;text=Thumbnail"
                  alt="Thumbnail [100%x225]" style="height: 225px; width: 100%; display: block"
                  src=${item.photoUrl || "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22290%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20290%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_17730751f77%20text%20%7B%20fill%3A%23eceeef%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_17730751f77%22%3E%3Crect%20width%3D%22290%22%20height%3D%22225%22%20fill%3D%22%2355595c%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2294.4453125%22%20y%3D%22119.1%22%3EThumbnail%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"}
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