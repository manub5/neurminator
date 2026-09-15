import { mountGame } from "../engine/canvas-game.js";
import { roundRect, themeColors, fitText } from "../engine/render.js";
import { keyboardIndexFromCode } from "../engine/input.js";
import { randomSequence, isSequenceCorrect, GRID_SIZE } from "../core/sequence.js";

const COLS = 3;
const ROWS = 3;

const READY_DURATION = 0.8;
const SHOW_DURATION = 0.6;
const GAP_DURATION = 0.25;
const FEEDBACK_DURATION = 0.7;
const MAX_LENGTH = 12;

function gridRect(size) {
  const side = Math.min(size.width, size.height) * 0.9;
  const cell = Math.min(side / COLS, side / ROWS, 140);
  const w = cell * COLS;
  const h = cell * ROWS;
  return {
    x: (size.width - w) / 2,
    y: (size.height - h) / 2,
    w,
    h,
    cell,
    cols: COLS,
    rows: ROWS,
  };
}

function indexFromPoint(rect, x, y) {
  if (x < rect.x || y < rect.y || x > rect.x + rect.w || y > rect.y + rect.h) return -1;
  const col = Math.floor((x - rect.x) / rect.cell);
  const row = Math.floor((y - rect.y) / rect.cell);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
  return row * COLS + col;
}

function digitIndex(code) {
  return keyboardIndexFromCode(code, GRID_SIZE);
}

export function prepare(level, { container, onFinish }) {
  const startLevel = Math.min(MAX_LENGTH, Math.max(1, level));
  const results = [];
  const trials = [];
  let maxSpan = 0;
  let finished = false;

  let rect = { x: 0, y: 0, w: 0, h: 0, cell: 0 };
  let length = startLevel;
  let sequence = [];
  let phase = "ready";
  let timer = READY_DURATION;
  let showIndex = 0;
  let showOn = false;
  let picks = [];
  let highlight = -1;
  let highlightTimer = 0;
  let feedbackSequence = [];
  let allowInput = false;

  function snapshot() {
    return {
      phase,
      length,
      sequence: sequence.slice(),
      picks: picks.slice(),
      maxSpan,
      allowInput,
      highlight,
      results: results.slice(),
    };
  }

  function startTrial() {
    sequence = randomSequence(length, { maxLength: MAX_LENGTH });
    phase = "ready";
    timer = READY_DURATION;
    showIndex = 0;
    showOn = false;
    picks = [];
    allowInput = false;
    feedbackSequence = [];
  }

  function finish() {
    if (finished) return;
    finished = true;
    onFinish({
      startLevel,
      maxSpan,
      trials: trials.slice(),
      results: results.slice(),
      correctCount: results.filter(Boolean).length,
      total: results.length,
    });
  }

  function pick(index) {
    if (!Number.isInteger(index) || index < 0 || index >= GRID_SIZE) return;
    if (!allowInput || picks.length >= sequence.length) return;
    picks.push(index);
    highlight = index;
    highlightTimer = 0.15;
    if (picks.length >= sequence.length) {
      allowInput = false;
      const correct = isSequenceCorrect(sequence, picks);
      results.push(correct);
      trials.push(length);
      if (correct) maxSpan = length;
      feedbackSequence = sequence.slice();
      phase = "feedback";
      timer = FEEDBACK_DURATION;
    }
  }

  const scene = {
    keyDown(code) {
      pick(digitIndex(code));
    },
    pointerDown(x, y) {
      pick(indexFromPoint(rect, x, y));
    },
    update(dt, { channel }) {
      if (highlightTimer > 0) {
        highlightTimer -= dt;
        if (highlightTimer <= 0) highlight = -1;
      }

      if (!finished) {
        timer -= dt;

        if (phase === "ready") {
          if (timer <= 0) {
            phase = "show";
            showIndex = 0;
            showOn = true;
            timer = SHOW_DURATION;
          }
        } else if (phase === "show") {
          if (timer <= 0) {
            if (showOn) {
              showOn = false;
              timer = GAP_DURATION;
            } else {
              showIndex += 1;
              if (showIndex >= sequence.length) {
                phase = "answer";
                allowInput = true;
                picks = [];
              } else {
                showOn = true;
                timer = SHOW_DURATION;
              }
            }
          }
        } else if (phase === "feedback") {
          if (timer <= 0) {
            if (results[results.length - 1] && length + 1 <= MAX_LENGTH) {
              length += 1;
              startTrial();
            } else {
              finish();
            }
          }
        }
      }

      if (channel) channel.setSnapshot(snapshot());
    },
    render({ ctx, size }) {
      const colors = themeColors();
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, size.width, size.height);

      rect = gridRect(size);
      const r = rect;

      const activeSet = new Set();
      if (phase === "show" && showOn && sequence[showIndex] != null) {
        activeSet.add(sequence[showIndex]);
      }
      if (phase === "feedback") {
        for (const idx of feedbackSequence) activeSet.add(idx);
      }

      for (let i = 0; i < GRID_SIZE; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const pad = r.cell * 0.08;
        const x = r.x + col * r.cell + pad;
        const y = r.y + row * r.cell + pad;
        const s = r.cell - pad * 2;

        const isActive = activeSet.has(i);
        const isPick = phase === "answer" && picks.includes(i);

        ctx.fillStyle = isActive ? colors.accent : colors.surface2;
        roundRect(ctx, x, y, s, s, 12);
        ctx.fill();

        if (isPick) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = colors.accent;
          roundRect(ctx, x, y, s, s, 12);
          ctx.stroke();
        }
        if (highlight === i) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = colors.text;
          roundRect(ctx, x, y, s, s, 12);
          ctx.stroke();
        }
      }

      const label =
        phase === "answer"
          ? "Reproduisez la séquence"
          : phase === "feedback"
            ? (results[results.length - 1] ? "Réussi !" : "Raté")
            : "Observez…";

      ctx.fillStyle = colors.textDim;
      const fontSize = fitText(ctx, label, size.width * 0.9, 20);
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, size.width / 2, Math.max(20, r.y - 12));
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    },
  };

  startTrial();
  const game = mountGame(container, { gameId: "span", scene, describe: "Span de mémoire" });

  if (game.channel) {
    game.channel.onInput((payload) => {
      if (payload && Number.isInteger(payload.index)) pick(payload.index);
    });
  }

  return { destroy: game.destroy };
}
