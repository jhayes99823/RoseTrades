var rhit = rhit || {};

rhit.AccountPageController = class {
	constructor() {
		console.log('im the account page controller');

		
        
        document.querySelector("#updateBtn").addEventListener('click', (event) => {
            rhit.fbUserManager.updateName(firstNameInput.value + " " + lastNameInput.value);
            
            $("#updateBtn").attr("disabled", true);

            this.updateView();
		});

		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
	}

	updateView() {
		let name = rhit.fbUserManager.name.split(" ");

		const savedFirstName = name[0];
		const savedLastName = name[name.length - 1];

		const firstNameInput = document.querySelector("#firstNameInput");
		const lastNameInput = document.querySelector("#lastNameInput");

		firstNameInput.value = savedFirstName;
		lastNameInput.value = savedLastName;

		firstNameInput.addEventListener("input", (event) => {
			if ((firstNameInput.value != savedFirstName) || (lastNameInput.value != savedLastName)) {
				$("#updateBtn").attr("disabled", false);
			} else {
				$("#updateBtn").attr("disabled", true);
			}
		});

		lastNameInput.addEventListener("input", (event) => {
			if ((lastNameInput.value != savedLastName) || (firstNameInput.value != savedFirstName)) {
				$("#updateBtn").attr("disabled", false);
			} else {
				$("#updateBtn").attr("disabled", true);
			}
		});
	}
}
