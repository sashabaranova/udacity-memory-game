// Declaring some global variables to be used further in the app
const containerEl = document.getElementById('container');
const moveCountEl = document.getElementById('move-count');
const refreshEl = document.getElementById('refresh');
const timerEl = document.getElementById('timer');
const starsEl = document.getElementById('stars');

let appState = null;

/*
*
 EVENT LISTENERS
*
*/

// Enable card clicking feature by delegating event listener to container children elements
containerEl.addEventListener('click', function(e) {
	if (e.target.nodeName === 'DIV') {
		// get card index value from data-index attribute
		const index = e.target.getAttribute('data-index');
		dispatch({type: 'click', index: index});
	}
});

//Refresh the page by clicking the refresh arrow button and calling dispatch function for load event
refreshEl.addEventListener('click', function() {
	dispatch({type: 'load'});
});

// Enable card shuffling function
function shuffleCards(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // swap i and j values
        [array[j], array[i]] = [array[i], array[j]];
    }
}

// function adding new index value to newly shuffled cards
function addIndex(array) {
	for (let i = 0; i < array.length; i++) {
		array[i].index = i;
	}
}

// generateCards function creates gameState object that contains a list of proprties and cards array
// 16 cards objects of 8 different types are pushed into cards array with a for loop
function generateCards() {
	const gameState = {
		cards: [],
		// cardVersion property helps not to render content if the version of the cards has not been changed
		cardVersion: 0,
		moveCount: 0,
		solvedCount: 0,
		starCount: 3,
		// animationInProgress property set to true prevents new cards from being clicked
		animationInProgress: false,
		secondsElapsed: 0,
		timerStarted: false,
		// intervalDesc property is introduced to be used in clearInteval function to stop the timer
		intervalDesc: null,
		// doRefresh: false,
		win: false
	}

	for (let i = 0; i <= 7; i++) {
		gameState.cards.push(
			{type: i, clicked: false, solved: false, animation: null},
			{type: i, clicked: false, solved: false, animation: null}
		);
	}
	return gameState;
}

// Function clones the current state of the game to avoid current state change
function cloneState(state) {
	if (state === null) {
		return null;
	}
	// const newState = {...state}; - Changed to ES5 for Safari
	const newState = JSON.parse(JSON.stringify(state));
	newState.cards = [];
	for (const card of state.cards) {
		// newState.cards.push({...card}); - Changed to ES5 for Safari
		newState.cards.push(JSON.parse(JSON.stringify(card)));
	}
	return newState;
}

// Minor function setting the text content for the win board 
function generateStarCountText(state, element) {
	const defaultText = 'You won with ' + state.moveCount + ' moves and ';
	if (state.starCount > 0 && state.starCount !== 1) {
		element.textContent = defaultText + state.starCount + ' stars \u{1F609}';
	} else {
		element.textContent = defaultText + state.starCount + ' star \u{1F60A}';
	}
}

// Function rendering win board content by clearing body html and adding new elements to DOM
function renderWin(state) {
	const fragment = document.createDocumentFragment();
	const header = document.createElement('h2');
	const p1 = document.createElement('p');
	const p2 = document.createElement('p');
	const button = document.createElement('button');
	const icon = document.createElement('i');
	icon.setAttribute('class', 'far fa-check-circle fa-3x');
	button.setAttribute('id', 'btn');
	header.textContent = 'Congratulations! Winter is here!';
	generateStarCountText(state, p1);
	p2.textContent = 'Your time is ' + timerEl.textContent;
	button.textContent = 'Play again';
	fragment.appendChild(icon);
	fragment.appendChild(header);
	fragment.appendChild(p1);
	fragment.appendChild(p2);
	fragment.appendChild(button);
	document.body.innerHTML='';
	document.body.appendChild(fragment);

	// reload page and game by clicking play again button
	button.addEventListener('click', function() {
		location.reload();
	});
}

// Minor function adding one star to the game rating
function addStar(fragment, cls) {
	const star = document.createElement('span');
	star.setAttribute('class', cls);
	star.textContent = '\u2605';
	fragment.appendChild(star);
}

// Minor function setting correspondinng card class attributes
function setCardClass(card, element) {
	let className;
	if (card.clicked && card.animation === 'shake') {
		className = 'card front shake';
	} else if (card.solved && card.animation === 'flash') {
		className = 'card front flash';
	} else if (card.clicked || card.solved) {
		className = 'card front';
	} else {
		className = 'card back';
	}

	element.setAttribute('class', className);
}

// Major function containing DOM interaction logic
function render(currentState, newState) {
	// call renderWin function to display winboard
	if (newState.win) {
		renderWin(newState);
		return;
	}

	// enable move counting feature in game bar
	if (currentState === null || currentState.moveCount !== newState.moveCount) {
		moveCountEl.textContent = newState.moveCount + ' moves';
	}

	//enable time counting feature in game bar
	if (currentState === null || currentState.secondsElapsed !== newState.secondsElapsed) {
		const minutes = Math.floor(newState.secondsElapsed / 60);
		const seconds = newState.secondsElapsed - minutes*60;

		timerEl.textContent = (minutes < 10 ? '0' + minutes + ':' : minutes + ':') + (seconds < 10 ? '0' + seconds : seconds);
	}

	//enable rating (star) count feature in game bar by appending stars and setting their classes depending on starCount value
	if (currentState === null || currentState.starCount !== newState.starCount) {
		const fragment = document.createDocumentFragment();
		for (let i = 0; i < newState.starCount; i++) {
			addStar(fragment, 'on');
		}

		for (let i = 0; i < 3 - newState.starCount; i++) {
			addStar(fragment, 'off');
		}

		starsEl.innerHTML = '';
		starsEl.appendChild(fragment);
	}

	//create new cards and set essential card attributes;
	if (currentState === null || currentState.cardVersion !== newState.cardVersion) {
		const fragment = document.createDocumentFragment();
		for (const card of newState.cards) {
			const cardElement = document.createElement('div');
			// store card.index property value in data-index attribute
			cardElement.setAttribute('data-index', card.index);
			// store card.type property value in type attribute
			cardElement.setAttribute('type', card.type);
			setCardClass(card, cardElement);
			//display card type for testing
			// cardElement.textContent = card.type;
			fragment.appendChild(cardElement);
		}
		containerEl.innerHTML = '';
		containerEl.appendChild(fragment);
	}
}

//function checking if a card was clicked and returning either card or null
function getClicked(state) {
	for (const card of state.cards) {
		if (card.clicked) {
			return card;
		}
	}
	return null;
}

// timerCallback function used for setting interval
function timerCallback() {
	dispatch({type: 'tick'});
}

//function calculating the starCount depending on the moveCount
function countStars(state) {
	switch (state.moveCount) {
	case 16:
	case 20:
		state.starCount--;
	}
}

// major function that calculates the new game state by using the current game state and the event that triggers the state change
function changeState(state, event) {
	// make a deep copy of the current state into the new state not to make changes in the current state
	let newState = cloneState(state);

	// Introduce switch statement with cases corresponding to game events
	switch (event.type) {

	// load event triggers cards initializing functions and resets the timer if needed
	case 'load':
		if (newState !== null && newState.intervalDesc !== null) {
			clearInterval(newState.intervalDesc);
		}

		newState = generateCards();
		shuffleCards(newState.cards);
		addIndex(newState.cards);
		break;

	// tick event controls seconds count
	case 'tick':
	    newState.secondsElapsed++;
	    break;

	// click event is the most complex: it checks if any cards have been clicked and if two card match or don't match
	case 'click':

		//start the timer if it is not started
		if(!newState.timerStarted) {
			newState.timerStarted = true;
			newState.intervalDesc = window.setInterval(timerCallback, 1000);
		}

		// prevent new cards from being clicked
		if (newState.animationInProgress) {
			break;
		}

		const currCard = newState.cards[event.index];
		// prevent a solved card from being clicked
		if (currCard.solved) {
			break;
		}

		const clickedCard = getClicked(newState);
		// prevent a card from being clicked twice
		if (clickedCard !== null && clickedCard.index === currCard.index) {
			break;
		}
		// change cardVersion
		newState.cardVersion++;

		//open the first card in a move		
		if (clickedCard === null) {
			currCard.clicked = true;
		} else {
		// add a move if the clicked card is the second card in the move
			newState.moveCount++;
			countStars(newState);

			//check if the cards in a move match
			if (clickedCard.type === currCard.type) {
				// set clicked property value of both cards to false to prevent them from being clicked further
				currCard.clicked = false;
				clickedCard.clicked = false;
				// set solved property value of both cards to true as they match
				clickedCard.solved = true;
				currCard.solved = true;
				// add corrsponding animation property values to matched cards
				currCard.animation = 'flash';
				clickedCard.animation = 'flash';

				// increase solvedCount by 1
				newState.solvedCount++;
				//prevent new cards from being clicked during animation
				newState.animationInProgress = true;

				// check if all cards are matched
				if (newState.solvedCount === 8) {
					setTimeout(function() {
						// call dispatch function for win event and render win board
						dispatch({type: 'win'});
					}, 500);
					//exit to win board
					break;
				}
				
				// call dispatch function for clear event to remove animation
				setTimeout(function() {
					dispatch({type: 'clear'});
				}, 500);
				
			} else {
				// if the cards don't match set the clicked property value of current card to true to open it			
				currCard.clicked = true;
				// add corrsponding animation property values to cards that don't match
				currCard.animation = 'shake';
				clickedCard.animation = 'shake';
				//prevent new cards from being clicked during animation
				newState.animationInProgress = true;
				setTimeout(function() {
					// call dispatch function for clear event to remove animation and set clicked property value of cards to false
					dispatch({type: 'clear'});
				}, 500);
			}
		}

		break;
	//clear event removes any animation and sets clicked property value of cards to false to close them
	case 'clear':
		for (const card of newState.cards) {
			//remove animation from the previously clicked cards
			card.animation = null;
			if (card.clicked && !card.solved) {
				card.clicked = false;
			}
		}
		newState.animationInProgress = false;
		//change cardVersion
		newState.cardVersion++;
		break;

	//win event sets game win property to true and triggers win board rendering; it also stops the timer
	case 'win':
		newState.win = true;
		clearInterval(newState.intervalDesc);
		newState.intervalDesc = null;
		timerStarted = false;
	}

	return newState;
}
//dispatch is a major function function that fires the event
function dispatch(event) {
	const newState = changeState(appState, event);
	render(appState, newState);
	appState = newState;
}

// call dispatch function for load event to initialize the game 
dispatch({type: 'load'});

// preloading images, source - https://www.mediacollege.com/internet/javascript/image/preload.html

if (document.images) {
    img1 = new Image();
    img1.src = "img/arya_sm.jpg";
    img2 = new Image();
    img2.src = "img/cersei_sm.jpg";
    img3 = new Image();
    img3.src = "img/daenerys_sm.jpg";
    img4 = new Image();
    img4.src = "img/jonsnow_sm.jpg";
    img5 = new Image();
    img5.src = "img/night_king_sm.jpg";
    img6 = new Image();
    img6.src = "img/sansa_sm.jpg";
    img7 = new Image();
    img7.src = "img/tyrion_sm.jpg";
    img8 = new Image();
    img8.src = "img/viserion_sm.jpg";
}
