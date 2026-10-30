import { WORDS } from "./words.js";

const maxMistakes = 6;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
    }

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ error: "Envie um nome válido para criar a sala." }, 400);
      }

      if (typeof payload.name !== "string" || !payload.name.trim() || payload.name.length > 24) {
        return jsonResponse({ error: "O nome deve ter entre 1 e 24 caracteres." }, 400);
      }

      const code = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
      const room = env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(code));
      const initialized = await room.fetch(`https://room/init?code=${code}`, { method: "POST" });
      if (!initialized.ok) {
        return jsonResponse({ error: "Não foi possível criar a sala. Tente novamente." }, 500);
      }
      return jsonResponse({ code });
    }

    if (url.pathname.startsWith("/rooms/")) {
      const code = url.pathname.split("/")[2]?.toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(code || "")) {
        return jsonResponse({ error: "Código de sala inválido." }, 400);
      }
      const room = env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(code));
      const forwardedUrl = new URL(request.url);
      forwardedUrl.pathname = url.pathname.slice(`/rooms/${code}`.length) || "/";
      return room.fetch(new Request(forwardedUrl, request));
    }

    return jsonResponse({ error: "Rota não encontrada." }, 404);
  },
};

export class GameRoom {
  constructor(ctx) {
    this.ctx = ctx;
    this.room = null;
    this.ready = ctx.storage.get("room").then((room) => {
      this.room = room || null;
    });
  }

  async fetch(request) {
    await this.ready;
    const url = new URL(request.url);

    if (url.pathname === "/init" && request.method === "POST") {
      if (this.room) return new Response(null, { status: 409 });
      this.room = {
        code: url.searchParams.get("code"),
        players: [],
        word: null,
        category: null,
        guessedLetters: [],
        mistakes: 0,
        turn: 0,
        gameOver: false,
        winnerId: null,
      };
      await this.save();
      return new Response(null, { status: 201 });
    }

    if (url.pathname !== "/ws" || request.headers.get("Upgrade") !== "websocket") {
      return new Response("Rota não encontrada.", { status: 404 });
    }
    if (!this.room) return new Response("Sala não encontrada.", { status: 404 });

    const name = url.searchParams.get("name")?.trim();
    const token = url.searchParams.get("token");
    if (!name || name.length > 24 || !token || token.length > 100) {
      return new Response("Nome ou token inválido.", { status: 400 });
    }

    let player = this.room.players.find((entry) => entry.token === token);
    if (!player) {
      if (this.room.players.length >= 2 || this.room.gameOver) {
        return new Response("A sala já está cheia ou a partida terminou.", { status: 409 });
      }
      player = {
        id: `player-${this.room.players.length + 1}`,
        name,
        token,
      };
      this.room.players.push(player);
    } else {
      player.name = name;
    }

    if (this.room.players.length === 2 && !this.room.word) {
      const selection = WORDS[Math.floor(Math.random() * WORDS.length)];
      this.room.word = selection.word;
      this.room.category = selection.category;
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.serializeAttachment({ playerId: player.id });
    this.ctx.acceptWebSocket(server);
    await this.save();
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket, message) {
    await this.ready;
    const playerId = socket.deserializeAttachment()?.playerId;
    if (typeof message !== "string") {
      this.sendError(socket, "Mensagem inválida.");
      return;
    }

    let data;
    try {
      data = JSON.parse(message);
    } catch {
      this.sendError(socket, "Mensagem inválida.");
      return;
    }

    if (data.type !== "guess" || typeof data.letter !== "string") {
      this.sendError(socket, "Jogada inválida.");
      return;
    }
    const letter = data.letter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    if (!/^[A-Z]$/.test(letter) || this.room.gameOver || !this.room.word) {
      this.sendError(socket, "Essa jogada não pode ser feita agora.");
      return;
    }
    if (this.room.players[this.room.turn]?.id !== playerId) {
      this.sendError(socket, "Ainda não é a sua vez.");
      return;
    }
    if (this.room.guessedLetters.includes(letter)) {
      this.sendError(socket, "Essa letra já foi escolhida.");
      return;
    }

    this.room.guessedLetters.push(letter);
    const normalizedWord = this.room.word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    if (!normalizedWord.includes(letter)) {
      this.room.mistakes += 1;
    }

    const solved = [...normalizedWord].every((character) => this.room.guessedLetters.includes(character));
    if (solved) {
      this.room.gameOver = true;
      this.room.winnerId = playerId;
    } else if (this.room.mistakes >= maxMistakes) {
      this.room.gameOver = true;
    } else {
      this.room.turn = (this.room.turn + 1) % this.room.players.length;
    }

    await this.save();
    this.broadcast();
  }

  async webSocketClose(socket) {
    await this.ready;
    this.broadcast();
  }

  async webSocketError() {
    await this.ready;
    this.broadcast();
  }

  async save() {
    await this.ctx.storage.put("room", this.room);
  }

  publicState() {
    const guessed = new Set(this.room.guessedLetters);
    const letters = this.room.word
      ? [...this.room.word].map((letter) => {
          const normalized = letter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
          return this.room.gameOver || guessed.has(normalized) ? letter : "";
        })
      : [];
    return {
      code: this.room.code,
      players: this.room.players.map(({ id, name }) => ({ id, name })),
      word: letters,
      answer: this.room.gameOver ? this.room.word : null,
      category: this.room.category,
      guessedLetters: this.room.guessedLetters,
      mistakes: this.room.mistakes,
      turn: this.room.turn,
      gameOver: this.room.gameOver,
      winnerId: this.room.winnerId,
    };
  }

  broadcast() {
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(
          JSON.stringify({
            type: "state",
            state: { ...this.publicState(), selfId: socket.deserializeAttachment()?.playerId },
          }),
        );
      } catch (error) {
        console.error("Não foi possível sincronizar um jogador.", error);
      }
    }
  }

  sendError(socket, message) {
    socket.send(JSON.stringify({ type: "error", message }));
  }
}
