var rhit = rhit || {};

rhit.AppointmentListPageController = class {
    constructor() {
        console.log('im the appointment list controller page');

        rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
        rhit.fbAppointmentManager.beginListening(this.updateView.bind(this));
    }

    search(nameKey, myArray){
		for (let i = 0; i < myArray.length; i++) {
			if (myArray[i].username === nameKey) {
				return myArray[i];
			}
		}
    }

    updateView() {
        const newList = htmlToElement('<div id="appointment-list"> <h4>Your Requested Meetings</h4> </div>');

        for (let i = 0; i < rhit.fbAppointmentManager.length; i++) {
            const appointment = rhit.fbAppointmentManager.getItemAtIndex(i);


            if (appointment.requester.username === rhit.fbAuthManager.uid) {
                let listCard = null;

                listCard = this._createCardList(appointment);

                newList.appendChild(listCard);
            }

        }

        const oldList = document.querySelector("#appointment-list");
		oldList.removeAttribute("id");
		oldList.hidden = true;
	
		// put in new quoteListContainer
        oldList.parentElement.appendChild(newList);


        const requesteeList = htmlToElement('<div id="request-list" class="mt-3"> <h4>Requested Meetings With You</h4> </div>')

        for (let i = 0; i < rhit.fbAppointmentManager.length; i++) {
            const appointment = rhit.fbAppointmentManager.getItemAtIndex(i);


            if (appointment.requestee.username === rhit.fbAuthManager.uid) {
                let listCard = null;

                listCard = this._createCardList(appointment);

                requesteeList.appendChild(listCard);
            }

        }

        const oldReqList = document.querySelector("#request-list");
		oldReqList.removeAttribute("id");
		oldReqList.hidden = true;
	
		// put in new quoteListContainer
        oldReqList.parentElement.appendChild(requesteeList);
    }

    _createCardList(appointment) {
        const meetingDetails = appointment.proposals[appointment.proposals.length - 1];
        return htmlToElement(
            `
                <div class="list-group-item list-group-item-action flex-column align-items-start active chat-list-container">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${appointment.requester.name} - ${appointment.requestee.name}</h5>
                    </div>
                    <p class="mb-1">Bid Amount - $${meetingDetails.bidAmount}</p>
                    <p class="mb-1">Date - ${meetingDetails.meetingDate} @ ${meetingDetails.meetingTime}</p>
                    <p class="mb-1">${appointment.status}</p>
                </div>
            `
        )
    }
}