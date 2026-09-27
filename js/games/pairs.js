import { mountGame } from "../engine/canvas-game.js";
import { roundRect, themeColors, fitText } from "../engine/render.js";
import { playTouch } from "../sound.js";
import { getSettings } from "../storage/local.js";

// Jeu des paires (concentration) : mémoire visuelle de reconnaissance,
// un classique de la littérature (Duncker) repris ici en variante familière.
const EMOJI_POOL = ["🍎", "🍋", "🍇", "🍒", "🍉", "🍑", "🍓", "🥝", "🍍", "🥥", "🍊", "🍌"];
const PAIRS_BY_LEVEL = [4, 6, 8, 10, 12];
const MISMATCH_DURATION = 0.7;
const MATCH_PAUSE = 0.25;

export function pairsForLevel(level) {
  const idx = Math.min(Math.max(level, 1), PAIRS_BY_LEVEL.length) - 1;
  return PAIRS_BY_LEVEL[idx];
}

export function gridDims(pairs) {
  const cards = pairs * 2;
  const cols = cards <= 12 ? 4 : cards <= 20 ? 5 : 6;
  const rows = Math.ceil(cards / cols);
  return { cols, rows };
}

export function buildDeck(pairs, { rng = Math.random } = {}) {
  const symbols = EMOJI_POOL.slice(0, pairs);
  const deck = symbols.flatMap((s) => [s, s]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function gridLayout(size, cols, rows) {
  const availW = size.width * 0.94;
  const availH = size.height * 0.8;
  const cell = Math.min(availW / cols, availH / rows, 110);
  const w = cell * cols;
  const h = cell * rows;
  return {
    x: (size.width - w) / 2,
    y: (size.height - h) / 2 + 14,
    w,
    h,
    cell,
    cols,
    rows,
  };
}

function indexFromPoint(layout, count, x, y) {
  if (x < layout.x || y < layout.y || x > layout.x + layout.w || y > layout.y + layout.h) return -1;
  const col = Math.floor((x - layout.x) / layout.cell);
  const row = Math.floor((y - layout.y) / layout.cell);
  if (col < 0 || col >= layout.cols || row < 0 || row >= layout.rows) return -1;
  const index = row * layout.cols + col;
  return index < count ? index : -1;
}

export function prepare(level, { container, onFinish }) {
  const pairs = pairsForLevel(level);
  const { cols, rows } = gridDims(pairs);
  const deck = buildDeck(pairs);

  const revealed = new Array(deck.length).fill(false);
  const matched = new Array(deck.length).fill(false);
  let pendingIndices = [];
  let locked = false;
  let mismatchTimer = 0;
  let matchPauseTimer = 0;
  let attempts = 0;
  let matchCount = 0;
  let cursor = 0;
  let finished = false;
  let layout = gridLayout({ width: 0, height: 0 }, cols, rows);

  function snapshot() {
    return {
      phase: locked ? "mismatch" : "playing",
      pairs,
      cards: deck.length,
      deck: deck.slice(),
      revealed: revealed.slice(),
      matched: matched.slice(),
      cursor,
      attempts,
      matches: matchCount,
    };
  }

  function finish() {
    if (finished) return;
    finished = true;
    onFinish({ pairs, attempts, matches: matchCount });
  }

  function flip(index) {
    if (finished || locked) return;
    if (!Number.isInteger(index) || index < 0 || index >= deck.length) return;
    if (revealed[index] || matched[index]) return;
    if (pendingIndices.length >= 2) return;

    revealed[index] = true;
    cursor = index;
    playTouch(getSettings().soundEnabled, index % 9);
    pendingIndices.push(index);

    if (pendingIndices.length === 2) {
      attempts += 1;
      const [a, b] = pendingIndices;
      if (deck[a] === deck[b]) {
        matched[a] = true;
        matched[b] = true;
        matchCount += 1;
        pendingIndices = [];
        if (matched.every(Boolean)) {
          matchPauseTimer = MATCH_PAUSE;
        }
      } else {
        locked = true;
        mismatchTimer = MISMATCH_DURATION;
      }
    }
  }

  function moveCursor(dx, dy) {
    const col = Math.min(cols - 1, Math.max(0, (cursor % cols) + dx));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(cursor / cols) + dy));
    const next = row * cols + col;
    if (next < deck.length) cursor = next;
  }

  const scene = {
    keyDown(code) {
      if (code === "ArrowRight") moveCursor(1, 0);
      else if (code === "ArrowLeft") moveCursor(-1, 0);
      else if (code === "ArrowDown") moveCursor(0, 1);
      else if (code === "ArrowUp") moveCursor(0, -1);
      else if (code === "Space" || code === "Enter") flip(cursor);
    },
    pointerDown(x, y) {
      flip(indexFromPoint(layout, deck.length, x, y));
    },
    update(dt, { channel }) {
      if (!finished) {
        if (matchPauseTimer > 0) {
          matchPauseTimer -= dt;
          if (matchPauseTimer <= 0) finish();
        } else if (locked) {
          mismatchTimer -= dt;
          if (mismatchTimer <= 0) {
            for (const i of pendingIndices) revealed[i] = false;
            pendingIndices = [];
            locked = false;
          }
        }
      }
      if (channel) channel.setSnapshot(snapshot());
    },
    render({ ctx, size }) {
      const colors = themeColors();
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, size.width, size.height);

      const label = `🃏 Paires trouvées : ${matchCount}/${pairs} · essais : ${attempts}`;
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const fontSize = fitText(ctx, label, size.width * 0.92, 15);
      ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
      ctx.fillText(label, size.width / 2, 16);

      layout = gridLayout(size, cols, rows);

      for (let i = 0; i < deck.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const pad = layout.cell * 0.07;
        const x = layout.x + col * layout.cell + pad;
        const y = layout.y + row * layout.cell + pad;
        const s = layout.cell - pad * 2;

        const isFaceUp = revealed[i] || matched[i];
        ctx.globalAlpha = matched[i] ? 0.55 : 1;
        ctx.fillStyle = isFaceUp ? colors.surface : colors.surface2;
        roundRect(ctx, x, y, s, s, 10);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isFaceUp) {
          ctx.fillStyle = colors.text;
          ctx.font = `${Math.floor(s * 0.55)}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(deck[i], x + s / 2, y + s / 2 + 2);
        } else {
          ctx.fillStyle = colors.textDim;
          ctx.font = `600 ${Math.floor(s * 0.32)}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("?", x + s / 2, y + s / 2);
        }

        if (matched[i]) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#4caf50";
          roundRect(ctx, x, y, s, s, 10);
          ctx.stroke();
        } else if (i === cursor) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = colors.accent;
          roundRect(ctx, x, y, s, s, 10);
          ctx.stroke();
        }
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    },
  };

  const game = mountGame(container, { gameId: "pairs", scene, describe: "Paires" });

  if (game.channel) {
    game.channel.onInput((payload) => {
      if (payload && Number.isInteger(payload.index)) flip(payload.index);
    });
  }

  return { destroy: game.destroy, pause: game.pause };
}
