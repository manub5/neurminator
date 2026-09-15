import { mountGame } from "../engine/canvas-game.js";
import { roundRect, themeColors, drawWrappedText } from "../engine/render.js";
import { keyboardIndexFromCode } from "../engine/input.js";

const COLORS = [
  { id: "rouge", label: "Rouge", css: "#ff5c5c" },
  { id: "vert", label: "Vert", css: "#4caf50" },
  { id: "bleu", label: "Bleu", css: "#4f8cff" },
  { id: "jaune", label: "Jaune", css: "#f2c94c" },
  { id: "violet", label: "Violet", css: "#b06cff" },
  { id: "orange", label: "Orange", css: "#ff9f43" },
];
const TOTAL_TRIALS = 24;
const PAD_COLS = 3;

function incongruentRatio(level) {
  if (level <= 1) return 0.5;
  if (level === 2) return 0.65;
  if (level === 3) return 0.8;
  return 0.9;
}

export function buildTrial(incongruent) {
  const wordIndex = Math.floor(Math.random() * COLORS.length);
  let inkIndex = wordIndex;
  if (incongruent) {
    do {
      inkIndex = Math.floor(Math.random() * COLORS.length);
    } while (inkIndex === wordIndex);
  }
  return {
    word: COLORS[wordIndex].label.toUpperCase(),
    ink: COLORS[inkIndex],
    incongruent,
  };
}

export function incongruentRatioForLevel(level) {
  return incongruentRatio(level);
}

export function colorCount() {
  return COLORS.length;
}

function padLayout(size) {
  const rows = Math.ceil(COLORS.length / PAD_COLS);
  const gap = 8;
  const w = Math.min(size.width * 0.9, 400);
  const btnW = (w - gap * (PAD_COLS - 1)) / PAD_COLS;
  const btnH = 52;
  const totalH = rows * btnH + (rows - 1) * gap;
  const x0 = (size.width - w) / 2;
  const y0 = size.height - totalH - 16;
  const items = COLORS.map((color, i) => {
    const col = i % PAD_COLS;
    const row = Math.floor(i / PAD_COLS);
    return {
      color,
      x: x0 + col * (btnW + gap),
      y: y0 + row * (btnH + gap),
      w: btnW,
      h: btnH,
    };
  });
  return { items, top: y0 };
}

function zoneAtPoint(items, x, y) {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return i;
  }
  return -1;
}

export function prepare(level, { container, onFinish }) {
  const ratio = incongruentRatio(level);

  let finished = false;
  let trialIndex = 0;
  let trial = buildTrial(Math.random() < ratio);
  let chosenId = null;
  let feedbackTimer = 0;
  let correct = 0;
  let total = 0;
  let congruent = 0;
  let incongruent = 0;
  let items = [];

  function finish() {
    if (finished) return;
    finished = true;
    onFinish({ correct, total, congruent, incongruent });
  }

  function snapshot() {
    return {
      phase: feedbackTimer > 0 ? "feedback" : "stimulus",
      trialIndex,
      word: trial.word,
      ink: trial.ink.id,
      incongruent: trial.incongruent,
      chosenId,
      correct,
      total,
    };
  }

  function choose(index) {
    if (finished || chosenId !== null || !Number.isInteger(index) || index < 0 || index >= COLORS.length) return;
    const id = COLORS[index].id;
    chosenId = id;
    if (id === trial.ink.id) correct += 1;
    if (trial.incongruent) incongruent += 1;
    else congruent += 1;
    total += 1;
    feedbackTimer = 0.25;
  }

  function nextTrial() {
    trialIndex += 1;
    if (trialIndex >= TOTAL_TRIALS) {
      finish();
      return;
    }
    trial = buildTrial(Math.random() < ratio);
    chosenId = null;
  }

  const scene = {
    keyDown(code) {
      const index = keyboardIndexFromCode(code, COLORS.length);
      if (index >= 0) choose(index);
    },
    pointerDown(x, y) {
      choose(zoneAtPoint(items, x, y));
    },
    update(dt, { channel }) {
      if (feedbackTimer > 0) {
        feedbackTimer -= dt;
        if (feedbackTimer <= 0) nextTrial();
      }
      if (channel) channel.setSnapshot(snapshot());
    },
    render({ ctx, size }) {
      const colors = themeColors();
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, size.width, size.height);

      const instruction = "Choisissez la COULEUR DE L'ENCRE (pas le mot lu).";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      drawWrappedText(ctx, instruction, size.width / 2, 16, size.width * 0.92, 15, 20);

      const layout = padLayout(size);
      items = layout.items;

      const wordSize = Math.min(size.width * 0.22, (layout.top - 90) * 0.7, 96);
      ctx.fillStyle = trial.ink.css;
      ctx.font = `700 ${wordSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(trial.word, size.width / 2, layout.top / 2 + 10);

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const isChosen = chosenId === it.color.id;
        ctx.globalAlpha = chosenId !== null && !isChosen ? 0.4 : 1;
        ctx.fillStyle = it.color.css;
        roundRect(ctx, it.x, it.y, it.w, it.h, 10);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isChosen) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = colors.text;
          roundRect(ctx, it.x - 2, it.y - 2, it.w + 4, it.h + 4, 12);
          ctx.stroke();
        }

        ctx.fillStyle = "#14161a";
        ctx.font = "700 14px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.color.label, it.x + it.w / 2, it.y + it.h / 2);
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    },
  };

  const game = mountGame(container, { gameId: "stroop", scene, describe: "Stroop" });

  if (game.channel) {
    game.channel.onInput((payload) => {
      if (payload && Number.isInteger(payload.index)) choose(payload.index);
    });
  }

  return { destroy: game.destroy };
}
