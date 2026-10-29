const words = [
  { word: "abacaxi", category: "Fruta" },
  { word: "bicicleta", category: "Objeto" },
  { word: "borboleta", category: "Animal" },
  { word: "chocolate", category: "Comida" },
  { word: "computador", category: "Tecnologia" },
  { word: "elefante", category: "Animal" },
  { word: "girassol", category: "Natureza" },
  { word: "janela", category: "Casa" },
  { word: "mochila", category: "Objeto" },
  { word: "passarinho", category: "Animal" },
  { word: "violao", category: "Música" },
  { word: "amizade", category: "Sentimento" },
];

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const maxMistakes = 6;
const parts = [
  "part-head",
  "part-body",
  "part-left-arm",
  "part-right-arm",
  "part-left-leg",
  "part-right-leg",
];

const categoryElement = document.querySelector("#category");
const mistakesElement = document.querySelector("#mistakes");
const wordElement = document.querySelector("#word");
const messageElement = document.querySelector("#message");
const keyboardElement = document.querySelector("#keyboard");
const newGameButton = document.querySelector("#new-game");

let currentWord;
let guessedLetters;
let mistakes;
let gameOver;
let previousWord;

function normalizeLetter(letter) {
  return letter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function startGame() {
  const choices = words.filter((entry) => entry.word !== previousWord);
  const selection = choices[Math.floor(Math.random() * choices.length)];
  currentWord = selection.word;
  previousWord = currentWord;
  guessedLetters = new Set();
  mistakes = 0;
  gameOver = false;

  categoryElement.textContent = selection.category;
  mistakesElement.textContent = String(mistakes);
  messageElement.textContent = "Escolha uma letra para começar.";
  messageElement.className = "message";
  renderWord();
  renderKeyboard();
  updateDrawing();
}

function renderWord() {
  wordElement.replaceChildren();

  for (const letter of currentWord) {
    const letterElement = document.createElement("span");
    letterElement.className = "word-letter";
    letterElement.textContent =
      guessedLetters.has(normalizeLetter(letter)) || gameOver && mistakes >= maxMistakes
        ? letter
        : "\u00a0";
    wordElement.append(letterElement);
  }

  const hiddenLetters = [...currentWord].some(
    (letter) => !guessedLetters.has(normalizeLetter(letter)),
  );
  wordElement.setAttribute(
    "aria-label",
    hiddenLetters && !(gameOver && mistakes >= maxMistakes)
      ? "Palavra com letras ainda escondidas"
      : `Palavra: ${currentWord}`,
  );
}

function renderKeyboard() {
  keyboardElement.replaceChildren();

  for (const letter of alphabet) {
    const key = document.createElement("button");
    key.className = "key";
    key.type = "button";
    key.textContent = letter;
    key.setAttribute("aria-label", `Letra ${letter}`);
    key.disabled = guessedLetters.has(letter) || gameOver;
    key.addEventListener("click", () => guessLetter(letter));
    keyboardElement.append(key);
  }
}

function updateDrawing() {
  parts.forEach((part, index) => {
    document.querySelector(`#${part}`).classList.toggle("is-visible", index < mistakes);
  });
  mistakesElement.textContent = String(mistakes);
}

function guessLetter(letter) {
  const normalized = normalizeLetter(letter);
  if (gameOver || guessedLetters.has(normalized)) {
    return;
  }

  guessedLetters.add(normalized);
  if (![...currentWord].some((character) => normalizeLetter(character) === normalized)) {
    mistakes += 1;
  }

  updateDrawing();
  renderWord();

  if (![...currentWord].some((character) => !guessedLetters.has(normalizeLetter(character)))) {
    gameOver = true;
    messageElement.textContent = "Você acertou! Mandou bem!";
    messageElement.classList.add("is-win");
  } else if (mistakes >= maxMistakes) {
    gameOver = true;
    messageElement.textContent = `Fim de jogo! A palavra era ${currentWord.toUpperCase()}.`;
    messageElement.classList.add("is-loss");
    renderWord();
  } else {
    messageElement.textContent = "Boa! Tente outra letra.";
  }

  renderKeyboard();
}

newGameButton.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
    return;
  }

  const letter = normalizeLetter(event.key);
  if (alphabet.includes(letter)) {
    guessLetter(letter);
  }
});

startGame();
