const NUM_ROUNDS = 6;
const ANSWER_LENGTH = 5;
const letterCells = document.querySelectorAll(".letter-cell");
const loadingBar = document.querySelector(".loading-bar");


async function init() {
    let currentRow = 0;
    let currentGuess = "";
    let isLoading = true;
    let finishedGame = false;

    const res = await fetch("https://words.dev-apis.com/word-of-the-day"); // res = response
    const resObj = await res.json();
    const wordOfDay = (resObj.word).toUpperCase();
    const wordOfDayArr = wordOfDay.split("");
    isLoading = false;
    setLoadingVisibility(isLoading); // once the response has finished being fetched, hide loading icon (no longer loading)
    
    function addLetter(letter) {
        if (currentGuess.length < ANSWER_LENGTH) {
            currentGuess += letter;
        } else {
            currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter; // replace last letter of current guess with new letter
        }
        const currCellIndex = (currentGuess.length - 1) + (currentRow * ANSWER_LENGTH);
        letterCells[currCellIndex].innerText = letter;
    }
    /* 
    currentGuess.length = 2
    currentRow = 3 (user on 4th guess)
    
    currCellIndex = (2 - 1) + (3 * 5) = 1 + 15 = 16
    letter is displayed in cell 16 on the 4th row (at index 3)
    */

    async function commitGuess() {
        if (currentGuess.length !== ANSWER_LENGTH) { // if user does not input all 5 letters before pressing ENTER
            // do nothing
            return;
        }

        // (1) validate the word
        isLoading = true;
        setLoadingVisibility(isLoading);
        const res = await fetch("https://words.dev-apis.com/validate-word", {
            method: "POST",
            body: JSON.stringify({ word: currentGuess })
        });
        const resObj = await res.json();
        const isValidWord = resObj.validWord; // can instead do: const { valid word } = resObj;
        isLoading = false;
        setLoadingVisibility(isLoading);
        if (!isValidWord) {
            markInvalidWord();
            return;
        }

        // (2) do all marking as "correct", "close" or "wrong"
        const currentGuessArr = currentGuess.split("");
        const numOccurrences = mapLetterOccurrences(wordOfDayArr);

        // mark as correct
        for (let i = 0; i < ANSWER_LENGTH; i++) {
            const letter = currentGuessArr[i]
            if (letter === wordOfDayArr[i]) { // correct letter + index
                const correctCell = letterCells[currentRow * ANSWER_LENGTH + i];
                correctCell.classList.add("correct");
                numOccurrences[letter]--; // account for number of occurrences of the letter in word of day
            }
        }

        // mark as close or wrong
        for (let i = 0; i < ANSWER_LENGTH; i++) {
            const letter = currentGuessArr[i]
            if (letter === wordOfDayArr[i]) { // correct letter + index
                // do nothing (handled above)
            }
            else if (wordOfDayArr.includes(letter) && numOccurrences[letter] > 0) { // correct letter but wrong index 
                const closeCell = letterCells[currentRow * ANSWER_LENGTH + i];
                closeCell.classList.add("close");
                numOccurrences[letter]--;
            }
            else { // wrong letter
                const wrongCell = letterCells[currentRow * ANSWER_LENGTH + i];
                wrongCell.classList.add("wrong");
            }
        }
        /* numOccurrences[letter] > 0 
           if false, then the user has inputted the letter more times than there are occurrences of it in word of day -> the letter is wrong
           if true, then there are still more occurrences of the letter in word of day -> the letter is close
        */

        currentRow++;

        // (3) does user win or lose?
        if (currentGuess === wordOfDay) { // user wins game
            alert("Congrats! You got it right!");
            document.querySelector("body").classList.add("winner");
            finishedGame = true;
            return;
        } else if (currentRow === NUM_ROUNDS) { // user loses game
            alert(`Sorry. You lost! The word was ${wordOfDay}.`);
            finishedGame = true;
            return;
        }

        currentGuess = "";
    }

    function markInvalidWord() {
        for (let i = 0; i < ANSWER_LENGTH; i++) {
            letterCells[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");

            setTimeout(function () {
                letterCells[currentRow * ANSWER_LENGTH + i].classList.add("invalid");
            }, 10);
        }
    }

    function backspace() {
        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
        const lastCellIndex = currentGuess.length + (currentRow * ANSWER_LENGTH);
        letterCells[lastCellIndex].innerText = "";
    }
    /* OR 
    function backspace() {
        const cellIndex = (currentGuess.length - 1) + (currentRow * ANSWER_LENGTH); can keep the -1 here
        letterCells[cellIndex].innerText = "";
        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    }
    */

    function setLoadingVisibility(isLoading) {
        loadingBar.classList.toggle("visible", isLoading)
        /* if isLoading, toggle will add the class visible
           if !isLoading, toggle will remove the class visible */
    }

    function mapLetterOccurrences(arr) {
        const numOccurrences = {};
        for (let i = 0; i < arr.length; i++) {
            const letter = arr[i];
            if (numOccurrences[letter]) {
                numOccurrences[letter]++; // if letter already a key in the object, increment its value
            } else {
                numOccurrences[letter] = 1;
            }
        }
        return numOccurrences;
    }

    function isLetter(letter) {
        return /^[a-zA-Z]$/.test(letter);
    }

    document.addEventListener("keydown", function handleKeyDown(event) { // naming the callback function here can help with debugging (optional)
        if (finishedGame || isLoading) { // if game finished or is loading, don't let user type anything
            // do nothing
            return;
        }
        const keyValue = event.key;
        if (keyValue === "Enter") {
            commitGuess();
        } else if (keyValue === "Backspace") {
            backspace();
        } else if (isLetter(keyValue)) {
            addLetter(keyValue.toUpperCase());
        } else {
            // invalid input - do nothing
            // (this else statement is optional and only for clarity)
        }
    });  
}

init();