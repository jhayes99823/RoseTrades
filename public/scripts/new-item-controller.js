
var rhit = rhit || {};

rhit.AddItemPageController = class {
	constructor() {
		console.log('im the add item page controller');

		this._currFile = null;

		rhit.fbUserManager.beginListening(rhit.fbAuthManager.uid, this.updateView.bind(this));
	
		document.querySelector("#addPhoto").addEventListener("click", (event) => {
			console.log('upload photo pressed');
			document.querySelector("#inputFile").click();
		});

					
		document.querySelector("#inputFile").addEventListener("change", (event) => {
			this._currFile = event.target.files[0];
			var reader = new FileReader();
			reader.onload = function(e) {
				$('#photo').attr('src', e.target.result);
			}

			reader.readAsDataURL(event.target.files[0]);
			console.log(`Received file named ${this._currFile.name}`);
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

			const keywords = [];
			const scrubbed = this.scrubDescription(name + " " + description);

			for (let i = 0; i < scrubbed.length; i++) {
				const tempKeywords = this.createKeywords(scrubbed[i]);
				keywords.push(...tempKeywords);
			}
			
			console.log(name, description, category, priceRange, rhit.fbUserManager.name, this._currFile, keywords);

			rhit.fbUserItemManager.add(name, description, priceRange, category, rhit.fbUserManager.name, this._currFile, keywords);
		});
	}

	createKeywords(word) {
		const arrName = [];
		let curName = '';
		word.split('').forEach(letter => {
		  curName += letter;
		  arrName.push(curName);
		});
		return arrName;
	}

	scrubDescription(sentence) {
		const common = ["a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your", "ain't", "aren't", "can't", "could've", "couldn't", "didn't", "doesn't", "don't", "hasn't", "he'd", "he'll", "he's", "how'd", "how'll", "how's", "i'd", "i'll", "i'm", "i've", "isn't", "it's", "might've", "mightn't", "must've", "mustn't", "shan't", "she'd", "she'll", "she's", "should've", "shouldn't", "that'll", "that's", "there's", "they'd", "they'll", "they're", "they've", "wasn't", "we'd", "we'll", "we're", "weren't", "what'd", "what's", "when'd", "when'll", "when's", "where'd", "where'll", "where's", "who'd", "who'll", "who's", "why'd", "why'll", "why's", "won't", "would've", "wouldn't", "you'd", "you'll", "you're", "you've"]
		var wordArr = sentence.match(/\w+/g),
            commonObj = {},
            uncommonArr = [],
            word, i;

        for (i = 0; i < common.length; i++) {
            commonObj[ common[i].trim() ] = true;
        }

        for (i = 0; i < wordArr.length; i++) {
            word = wordArr[i].trim().toLowerCase();
            if (!commonObj[word]) {
                uncommonArr.push(word);
            }
        }
        return uncommonArr;
	}

	updateView() {

	}
}