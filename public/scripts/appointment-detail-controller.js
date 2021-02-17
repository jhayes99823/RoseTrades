var rhit = rhit || {};

rhit.AppointmentDetailPageController = class {
    constructor(isRequester) {
        console.log('i am the appointment detail page controller');

        this._isRequester = isRequester;

        rhit.fbSingleAppointmentManager.beginListening(this.updateView.bind(this));
    }

    updateView() {
        const bidAmt = document.querySelector("#bidAmount");
        const meetingDate = document.querySelector('#meetingDate');
        const meetingTime = document.querySelector("#meetingTime");
        const meetingPlace = document.querySelector("#meetingPlace");
        const itemName = document.querySelector("#itemName");
        const itemPhoto = document.querySelector("#photo");
        const status = document.querySelector("#statusLabel");
        const updateStatusBtn = $("#statusAction");
        const deleteIcon = $("#deleteIcon");

        status.innerHTML = `STATUS - ${rhit.fbSingleAppointmentManager.status}`;

        const meetingDetails = rhit.fbSingleAppointmentManager.proposals[rhit.fbSingleAppointmentManager.proposals.length - 1];
        console.log(rhit.fbSingleAppointmentManager.proposals);

        bidAmt.value = meetingDetails.bidAmount;
        meetingDate.value = meetingDetails.meetingDate;
        meetingTime.value = meetingDetails.meetingTime;
        meetingPlace.value = meetingDetails.meetingPlace;

        itemName.value = rhit.fbSingleAppointmentManager.itemDetails.name;
        itemPhoto.src = rhit.fbSingleAppointmentManager.itemDetails.photoURL;

        if (this._isRequester === 'false' && rhit.fbSingleAppointmentManager.status === rhit.FbAppointmentManager.STATUS.PENDING) {
            updateStatusBtn.attr('hidden', false);
        }

        if (rhit.fbSingleAppointmentManager.status !== rhit.FbAppointmentManager.STATUS.PENDING) {
            deleteIcon.attr('hidden', false);
        }

        document.querySelector("#acceptMeeting").addEventListener('click', (event) => {
            rhit.fbSingleAppointmentManager.acceptMeeting();
            this.updateView();
        });

        document.querySelector("#submitDeclineMeeting").addEventListener('click', (event) => {
            rhit.fbSingleAppointmentManager.declineMeeting();
            this.updateView();
        });

        deleteIcon.on('click', (event) => {
            rhit.fbSingleAppointmentManager.deleteMeeting();
        });
    }
}