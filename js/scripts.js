/* GAME VARIABLES */
//list of card symbols used in the game
const symbolClasses = ["fa-cat", "fa-kiwi-bird", "fa-anchor", "fa-bolt", "fa-cube", "fa-leaf", "fa-bicycle", "fa-bomb"];
//list of thresholds used to calculate the star score
const scoreThresholds = calculateScoreThresholds(symbolClasses.length);
//list of cards as li.card elements
const cardCollection = createCardCollection(symbolClasses);
//list of turned cards in a move
const cardsOfMove = [];
//the number of moves performed in a game session
let numberOfMoves = 0;
//the number of matched card pairs in a game session
let numberOfMatches = 0;
//the time a game session was started
let startedOn;
//the timer keeping track of and reporting each second how much time has elapsed for the current game session
let elapsedTimer;
//the delay after a mismatch making it possible for the user to see and memorize the turned card before next move
let postMismatchTimeout;

/* HTML ELEMENTS */
//the game deck element 
const deckElement = document.querySelector(".deck");
//all elements containing the number of moves
const movesElements = document.querySelectorAll(".moves");
//all elements containing a star based rating
const starsElements = document.querySelectorAll(".stars");
//all elements containing the elapsed time
const elapsedElements = document.querySelectorAll(".elapsed");
//the score-panel restart button element
const restartButtonElement = document.querySelector(".restart");
//the modal element
const modalElement = document.querySelector(".modal");
//the play agagin button element for the modal
const playAgainButtonElement = document.querySelector("#play-again-button");

/* EVENTS */
//deck event listener handling all card clicks
deckElement.addEventListener("click", clickDeck);
//event listener handling restart button clicks
restartButtonElement.addEventListener("click", resetDeck);
//event listener handling clicks outside the modal content element in order to close it, which is common behavior 
document.addEventListener("click", function (event) {
    if (modalElement.classList.contains("show-modal") && !event.target.closest(".modal-content").length) {
        toggleModal();
    }
});
//event listener handling modal play again button clicks
playAgainButtonElement.addEventListener("click", function () {
    toggleModal();
    resetDeck();
});

/* INITIALIZE */
//resets all and starts a new game session
resetDeck();

/* FUNCTIONS */
/**
 * returns three thresholds for the three star rating based on the number of card pairs in the game
 * The thresholds are based on the thinking that the best possible, but extremely unlikely, move count
 * is equal to the number of card pairs, hence in any game a really good score is the number of pairs plus 
 * a certain number of random misses - this is not base don stats, but could be. It is merely to illustrate how 
 * a function could be designed to work well regardless of the size of deck
 * @param {number} numberOfCardPairs 
 * @return {number[]} a list with three thresholds
 */
function calculateScoreThresholds(numberOfCardPairs) {
    return [numberOfCardPairs + Math.ceil(numberOfCardPairs * 0.5), numberOfCardPairs * 2, numberOfCardPairs + Math.ceil(numberOfCardPairs * 0.5) * 3];
}

/**
 * Creates a closed card with the symbol provided
 * @param {string} symbolClass
 * @return {Element} a closed card with the specified symbol
 */
function createCard(symbolClass) {
    let card = document.createElement("li");
    card.classList.add("card");
    card.setAttribute("title", "click to turn card");
    let symbol = document.createElement("i");
    symbol.classList.add("fa", symbolClass);
    card.appendChild(symbol);
    return card;
}

/**
 * Creates a collection of card pairs based on a provided list of symbols
 * @param {string[]} symbolClasses a list of symbols
 * @return {Element[]} a list of closed cards, two for each symbol provided   
 */
function createCardCollection(symbolClasses) {
    const cardCollection = [];
    for (const symbolClass of symbolClasses) {
        cardCollection.push(createCard(symbolClass), createCard(symbolClass));
    }
    return cardCollection;
}

/**
 * Resets the deck and starts a new game session
 */
function resetDeck() {
    //clears running post mismatch delay if any
    if (postMismatchTimeout !== null) {
        clearTimeout(postMismatchTimeout);
        postMismatchTimeout = null;
    }
    //resets game session variables
    startedOn = Date.now();
    numberOfMoves = 0;
    numberOfMatches = 0;
    //resets elapsed timer
    elapsedTimer = setInterval(function () { setElapsed(Date.now() - startedOn) }, 1000);
    //remove cards from deck
    clearDeck();
    //close all cards
    closeCards(...cardCollection);
    //shuffle all cards
    shuffle(cardCollection);
    //add all cards to the deck  
    setDeck();
    //reset score and move indicators
    setScore(numberOfMoves);
    setMoves(numberOfMoves);
}

/**
 * Removes all cards from the deck
 */
function clearDeck() {
    while (deckElement.lastChild) {
        deckElement.removeChild(deckElement.lastChild);
    }
}

/**
 * Add all cards to the deck
 */
function setDeck() {
    for (const card of cardCollection) {
        deckElement.appendChild(card);
    }
}

/**
 * Shuffles elements in a list - from http://stackoverflow.com/a/2450976
 * @param {Array} array a list of elements
 */
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * Calculates a score from three (best) to zero (worst) based on a number of moves
 * performed in a game session. 
 * @param {number} numberOfMoves 
 * @return {number} the calculated score
 */
function calculateScore(numberOfMoves) {
    if (numberOfMoves <= scoreThresholds[0]) {
        return 3;
    }
    else if (numberOfMoves <= scoreThresholds[1]) {
        return 2;
    }
    else {
        return 1;
    }
}

/**
 * Calculates and sets the score for all star based score panels
 * The calculated score is reflected in the number of filled stars
 * i.e. a score of two, will be reflected as two filled stars, and one empty star 
 * @param {number} numberOfMoves 
 */
function setScore(numberOfMoves) {
    const score = calculateScore(numberOfMoves);

    for (const starsElement of starsElements) {
        //fetch all star symbol placeholders
        for (const [index, star] of starsElement.querySelectorAll("i.fa-star").entries()) {
            //fill stars correpsonding to score from left to right
            if (index < score) {
                //set star as full
                star.classList.remove("far"); //corresponds to 'regular' (empty)
                star.classList.add("fas"); //corresponds to 'solid' (full)
            }
            else {
                //set star as empty
                star.classList.remove("fas");
                star.classList.add("far");
            }
        }
    }
}

/**
 * sets the number of moves for all relevant elements
 * @param {number} numberOfMoves 
 */
function setMoves(numberOfMoves) {
    for (const movesElement of movesElements) {
        movesElement.textContent = numberOfMoves;
    }
}

/**
 * sets the elapsed game session time in the format HH:MM:SS for all relevant elements
 * @param {number} elapsedInMilliseconds time elapsed since the start of the game session in milliseconds
 */
function setElapsed(elapsedInMilliseconds) {
    const elapsedAsDate = new Date(elapsedInMilliseconds);
    for (const elapsedElement of elapsedElements) {
        //toISOString can be used with substr(11,8) as the ISO return format is static        
        elapsedElement.textContent = elapsedAsDate.toISOString().substr(11, 8);
    }
}

/**
 * Toggles game completed modal
 */
function toggleModal() {
    modalElement.classList.toggle("show-modal");
}

/**
 * Handles user clicks within the deck
 * @param {MouseEvent} event 
 */
function clickDeck(event) {
    //get card, also if descendant such as the inner symbol is clicked. If no card was clicked returns null
    card = event.target.closest(".card");

    //ignore click, if:
    //- a clicked element is not a card element or its descendant    
    //- the clicked card is already turned     
    if (!card || isCardTurned(card)) {
        event.preventDefault();
        return;
    }

    //if a post mismatch delay in progress, the user should be able to override it, if clicking a closed card
    //implicitly this means that if the user would want to turn an already turned card, they will have to wait until
    //the delay has executed
    if (postMismatchTimeout !== null) {
        endMoveAsMismatch();
    }

    //make it impossible to turn more than two cards at a time
    if (cardsOfMove.length >= 2) {
        event.preventDefault();
        return;
    }

    //turn card    
    turnCard(card);
}

/**
 * Turns a specified card on the deck and takes action accordingly
 * @param {Element} card 
 */
function turnCard(card) {
    //turn the card
    cardsOfMove.push(card);
    card.classList.add("turned")


    //take further action only if the card turned is the second one in a move
    if (cardsOfMove.length == 2) {
        //get the first card turned in the move
        const otherCard = cardsOfMove[0];
        //check if cards matches
        if (isMatch(card, otherCard)) {
            endMoveAsMatch();
        }
        else {
            //set card pair as mismatch (to enable mismatch animation)
            setCardsAsMismatch(card, otherCard);
            //close turned cards after a delay of 1 second - the delay duration was chosen based on UX feel
            postMismatchTimeout = setTimeout(function () {
                endMoveAsMismatch();
            }, 1000);
        }
    }
}

function endMove() {
    if (cardsOfMove.length !== 2) throw new Error("move not finished");
    //clear stack of turned cards in move    
    cardsOfMove.length = 0;
    //increment move counter
    numberOfMoves++;
    //set move and score indicators
    setMoves(numberOfMoves);
    setScore(numberOfMoves);
    //end the game if the number of matches equals the number of card pairs in the game
    if (numberOfMatches === symbolClasses.length) {
        completeGame();
    }
    postMismatchTimeout = null;
}

/**
 * Closes the specified card
 * @param {Element} card 
 */
function closeCard(card) {
    card.classList.remove("turned", "match", "mismatch");
    card.setAttribute("title", "click to turn card");
}

/**
 * Closes a specified list of cards
 * @param  {...Element} cards 
 */
function closeCards(...cards) {
    for (const card of cards) {
        closeCard(card);
    }
}

/**
 * Closes the cards of the current move and completes the move
 */
function endMoveAsMismatch() {
    if (cardsOfMove.length !== 2) throw new Error("move not finished");
    //set cards as match
    closeCards(cardsOfMove[0], cardsOfMove[1]);
    //end move
    endMove();
}

/**
 * Sets a specified card as match
 * @param {Element} card 
 */
function setCardAsMatch(card) {
    card.classList.add("match");
    card.classList.remove("turned", "mismatch");
    card.setAttribute("title", "it's a match!");
}

/**
 * Turns a specified list of cards as matches
 * @param  {...Element} cards
 */
function setCardsAsMatch(...cards) {
    for (const card of cards) {
        setCardAsMatch(card);
    }
}

/**
 * Sets the cards of the current move as matches, counts the match and ends the move
 */
function endMoveAsMatch() {
    if (cardsOfMove.length !== 2) throw new Error("move not finished");
    //set cards as match
    setCardsAsMatch(cardsOfMove[0], cardsOfMove[1]);
    //increment match counter
    numberOfMatches++;
    //end move
    endMove();
}

/**
 * Sets a specified card as mismatch
 * @param {Element} card 
 */
function setCardAsMismatch(card) {
    card.classList.add("mismatch");
    card.classList.remove("match");
    card.setAttribute("title", "no match, better luck next move!");
}

/**
 * Turns a specified list of cards as mismatches
 * @param  {...Element} cards
 */
function setCardsAsMismatch(...cards) {
    for (const card of cards) {
        setCardAsMismatch(card);
    }
}

/**
 * Returns a boolean indicating whether a specified card is turned
 * @param {Element} card 
 * @return {Boolean} true if the specified card is turned
 */
function isCardTurned(card) {
    //a card is considered turned when it is either in turned or match state
    //the mismatch state is irrelevant as this state is only possible along with the turned state
    return card.classList.contains("turned") || card.classList.contains("match");
}

/**
 * Gets the font-awesome symbol class of a specified card
 * @param {Element} card 
 * @return {string} the font-awesome card symbol of the specified card or null if none exists
 */
function getCardSymbol(card) {
    for (const cardClass of card.querySelector("i").classList) {
        if (cardClass.includes("fa-")) {
            return cardClass;
        }
    }
    return null;
}

/**
 * Returns a boolean indicating whether two cards match
 * @param {Element} card1 
 * @param {Element} card2 
 * @return {Boolean} true if both cards have the same font-awesome symbol
 */
function isMatch(card1, card2) {
    return getCardSymbol(card1) === getCardSymbol(card2);
}

/**
 * Stops the timer and brings up the game completed modal
 */
function completeGame() {
    clearInterval(elapsedTimer);
    toggleModal();
}