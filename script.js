import { WORDS } from "./words.js";

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
const gamePanel = document.querySelector(".game__panel");
const soloModeButton = document.querySelector("#solo-mode");
const multiplayerModeButton = document.querySelector("#multiplayer-mode");
const onlineControls = document.querySelector("#online-controls");
const playerNameInput = document.querySelector("#player-name");
const roomCodeInput = document.querySelector("#room-code");
const onlineStatus = document.querySelector("#online-status");
const createRoomButton = document.querySelector("#create-room");
const joinRoomButton = document.querySelector("#join-room");

let currentWord;
let guessedLetters;
let mistakes;
let gameOver;
let previousWord;
let nextRoundTimeout;
let onlineMode = false;
let multiplayerState = null;
let multiplayerSocket = null;
let playerId = null;

function normalizeLetter(letter) {
  return letter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function startGame() {
  clearTimeout(nextRoundTimeout);
  const choices = WORDS.filter((entry) => entry.word !== previousWord);
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
      guessedLetters.has(normalizeLetter(letter)) || (gameOver && mistakes >= maxMistakes)
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
  const usedLetters = onlineMode
    ? new Set(multiplayerState?.guessedLetters || [])
    : guessedLetters;
  const isPlayersTurn =
    !onlineMode ||
    (multiplayerState?.players?.[multiplayerState.turn]?.id === playerId &&
      multiplayerState.players.length === 2);

  for (const letter of alphabet) {
    const key = document.createElement("button");
    const alreadyUsed = usedLetters.has(letter);
    const isCorrect = onlineMode
      ? multiplayerState?.word?.some((character) => normalizeLetter(character) === letter)
      : currentWord &&
        [...currentWord].some((character) => normalizeLetter(character) === letter);
    key.className = `key${alreadyUsed ? (isCorrect ? " is-correct" : " is-wrong") : ""}`;
    key.type = "button";
    key.textContent = letter;
    key.setAttribute("aria-label", `Letra ${letter}`);
    key.disabled =
      alreadyUsed ||
      (onlineMode
        ? !multiplayerSocket ||
          multiplayerSocket.readyState !== WebSocket.OPEN ||
          multiplayerState?.gameOver ||
          !isPlayersTurn
        : gameOver);
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
  if (onlineMode) {
    if (
      !multiplayerSocket ||
      multiplayerSocket.readyState !== WebSocket.OPEN ||
      multiplayerState?.gameOver ||
      multiplayerState?.players?.[multiplayerState.turn]?.id !== playerId
    ) {
      return;
    }
    multiplayerSocket.send(JSON.stringify({ type: "guess", letter: normalized }));
    return;
  }

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
    nextRoundTimeout = setTimeout(startGame, 3000);
  } else if (mistakes >= maxMistakes) {
    gameOver = true;
    messageElement.textContent = `Fim de jogo! A palavra era ${currentWord.toUpperCase()}.`;
    messageElement.classList.add("is-loss");
    renderWord();
    nextRoundTimeout = setTimeout(startGame, 3000);
  } else {
    messageElement.textContent = "Boa! Tente outra letra.";
  }

  renderKeyboard();
}

function setMode(isOnline) {
  onlineMode = isOnline;
  soloModeButton.classList.toggle("is-active", !isOnline);
  soloModeButton.setAttribute("aria-pressed", String(!isOnline));
  multiplayerModeButton.classList.toggle("is-active", isOnline);
  multiplayerModeButton.setAttribute("aria-pressed", String(isOnline));
  onlineControls.hidden = !isOnline;
  gamePanel.hidden = isOnline;
  newGameButton.hidden = isOnline;

  if (!isOnline) {
    multiplayerSocket?.close();
    multiplayerSocket = null;
    multiplayerState = null;
    playerId = null;
    startGame();
  } else {
    onlineStatus.textContent = "Crie uma sala e compartilhe o código com outra pessoa.";
  }
}

function getWorkerUrl() {
  const configuredUrl = window.FORCA_MULTIPLAYER_URL?.trim();
  if (!configuredUrl) {
    throw new Error("O endereço do Worker ainda não foi configurado em config.js.");
  }
  return new URL(configuredUrl);
}

function getPlayerName() {
  const name = playerNameInput.value.trim();
  if (!name || name.length > 24) {
    throw new Error("Digite um nome com até 24 caracteres.");
  }
  return name;
}

async function createRoom() {
  setMode(true);
  try {
    const name = getPlayerName();
    const endpoint = getWorkerUrl();
    createRoomButton.disabled = true;
    joinRoomButton.disabled = true;
    onlineStatus.textContent = "Criando sala...";
    const response = await fetch(new URL("/api/rooms", endpoint), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível criar a sala.");
    roomCodeInput.value = result.code;
    await connectToRoom(result.code, name, endpoint);
  } catch (error) {
    onlineStatus.textContent = error.message;
  } finally {
    createRoomButton.disabled = false;
    joinRoomButton.disabled = false;
  }
}

async function joinRoom() {
  setMode(true);
  try {
    const name = getPlayerName();
    const code = roomCodeInput.value.replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (code.length !== 6) throw new Error("Digite o código de seis caracteres da sala.");
    roomCodeInput.value = code;
    await connectToRoom(code, name, getWorkerUrl());
  } catch (error) {
    onlineStatus.textContent = error.message;
  }
}

function connectToRoom(code, name, endpoint) {
  multiplayerSocket?.close();
  multiplayerState = null;
  playerId = null;
  gamePanel.hidden = false;
  onlineStatus.textContent = `Conectando à sala ${code}...`;

  const tokenKey = `forca-player-${code}`;
  let token = sessionStorage.getItem(tokenKey);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(tokenKey, token);
  }

  const socketUrl = new URL(`/rooms/${code}/ws`, endpoint);
  socketUrl.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:";
  socketUrl.searchParams.set("name", name);
  socketUrl.searchParams.set("token", token);
  multiplayerSocket = new WebSocket(socketUrl);

  multiplayerSocket.addEventListener("open", () => {
    onlineStatus.textContent = `Conectado à sala ${code}. Compartilhe este código com o outro jogador.`;
  });
  multiplayerSocket.addEventListener("message", (event) => {
    let response;
    try {
      response = JSON.parse(event.data);
    } catch (error) {
      console.error("Resposta inválida do servidor multiplayer.", error);
      onlineStatus.textContent = "O servidor enviou uma resposta inválida.";
      return;
    }
    if (response.type === "state") {
      multiplayerState = response.state;
      playerId = multiplayerState.selfId;
      renderMultiplayerState();
    } else if (response.type === "error") {
      messageElement.textContent = response.message;
      messageElement.className = "message is-loss";
    }
  });
  multiplayerSocket.addEventListener("error", () => {
    onlineStatus.textContent = "Não foi possível conectar. Confira o código e a configuração do Worker.";
  });
  multiplayerSocket.addEventListener("close", () => {
    if (onlineMode) onlineStatus.textContent = "Conexão encerrada. Você pode tentar entrar novamente.";
    renderKeyboard();
  });
}

function renderMultiplayerState() {
  const state = multiplayerState;
  gamePanel.hidden = false;
  categoryElement.textContent = state.category || "Aguardando jogador";
  mistakes = state.mistakes;
  gameOver = state.gameOver;
  guessedLetters = new Set(state.guessedLetters);
  updateDrawing();
  wordElement.replaceChildren();
  for (const letter of state.word) {
    const letterElement = document.createElement("span");
    letterElement.className = "word-letter";
    letterElement.textContent = letter || "\u00a0";
    wordElement.append(letterElement);
  }
  wordElement.setAttribute(
    "aria-label",
    state.answer ? `Palavra: ${state.answer}` : "Palavra com letras ainda escondidas",
  );

  const activePlayer = state.players[state.turn];
  if (state.gameOver) {
    if (state.winnerId) {
      const won = state.winnerId === playerId;
      messageElement.textContent = won
        ? "Você acertou a palavra e venceu!"
        : `${state.players.find((player) => player.id === state.winnerId)?.name} venceu!`;
      messageElement.className = `message ${won ? "is-win" : "is-loss"}`;
    } else {
      messageElement.textContent = `Fim de jogo! A palavra era ${state.answer.toUpperCase()}.`;
      messageElement.className = "message is-loss";
    }
  } else if (state.players.length < 2) {
    messageElement.textContent = "Aguardando o segundo jogador entrar na sala.";
    messageElement.className = "message";
  } else if (activePlayer?.id === playerId) {
    messageElement.textContent = "Sua vez! Escolha uma letra.";
    messageElement.className = "message is-win";
  } else {
    messageElement.textContent = `Vez de ${activePlayer?.name || "outro jogador"}.`;
    messageElement.className = "message";
  }

  onlineStatus.textContent = `Sala ${state.code} · ${state.players
    .map((player) => player.name)
    .join(" × ")}`;
  renderKeyboard();
}

newGameButton.addEventListener("click", startGame);
soloModeButton.addEventListener("click", () => setMode(false));
multiplayerModeButton.addEventListener("click", () => setMode(true));
createRoomButton.addEventListener("click", createRoom);
joinRoomButton.addEventListener("click", joinRoom);
roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = roomCodeInput.value.replace(/[^a-z0-9]/gi, "").toUpperCase();
});

document.addEventListener("keydown", (event) => {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.key.length !== 1 ||
    event.target instanceof HTMLInputElement
  ) {
    return;
  }

  const letter = normalizeLetter(event.key);
  if (alphabet.includes(letter)) guessLetter(letter);
});

startGame();
