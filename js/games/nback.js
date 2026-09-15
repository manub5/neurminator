import { mountGame } from "../engine/canvas-game.js";
import { roundRect, themeColors, drawWrappedText } from "../engine/render.js";

const LETTERS = ["B", "D", "F", "G", "K", "M", "P", "T"];
const SHOW_DURATION = 1.5;
const GAP_DURATION = 0.5;
const READY_DURATION = 1.2;
const JUDGED_TRIALS = 20;
const TARGET_RATIO = 0.3;
const MAX_N = 5;

function randomLetter(avoid) {
  let letter;
  do {
    letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  } while (letter === avoid);
  return letter;
}

export function buildSequence(n, judgedTrials, targetRatio) {
  const total = n + judgedTrials;
  const seq = [randomLetter(null)];
  const targetFlags = [];
  for (let i = 1; i < total; i++) {
    const isJudged = i >= n;
    const wantTarget = isJudged && Math.random() < targetRatio;
    let letter;
    if (wantTarget) {
      letter = seq[i - n];
      targetFlags.push(true);
    } else {
      letter = randomLetter(seq[i - n]);
      if (isJudged) targetFlags.push(false);
    }
    seq.push(letter);
  }
  return { seq, targetFlags };
}

function respondRect(size) {
  const w = Math.min(size.width * 0.8, 320);
  const h = 56;
  return { x: (size.width - w) / 2, y: size.height - h - 16, w, h };
}

export function prepare(level, { container, onFinish }) {
  const maxN = Math.max(1, Math.min(level, MAX_N));
  const { seq } = buildSequence(maxN, JUDGED_TRIALS, TARGET_RATIO);

  let finished = false;
  let correct = 0;
  let total = 0;
  let targetCount = 0;
  let index = 0;
  let pressed = false;
  let phase = "ready";
  let timer = READY_DURATION;
  let rect = { x: 0, y: 0, w: 0, h: 0 };

  function isJudged(i) {
    return i >= maxN;
  }

  function currentIsTarget() {
    return isJudged(index) && seq[index] === seq[index - maxN];
  }

  function judge() {
    if (!isJudged(index)) return;
    const isTarget = currentIsTarget();
    if (isTarget) targetCount += 1;
    const ok = isTarget ? pressed : !pressed;
    if (ok) correct += 1;
    total += 1;
  }

  function finish() {
    if (finished) return;
    finished = true;
    onFinish({ maxN, correct, total, targets: targetCount });
  }

  function advanceTrial() {
    if (index === seq.length - 1) {
      finish();
      return;
    }
    index += 1;
    pressed = false;
    phase = "show";
    timer = SHOW_DURATION;
  }

  function snapshot() {
    return {
      phase,
      index,
      letter: phase === "show" ? seq[index] : "",
      pressed,
      correct,
      total,
      target: currentIsTarget(),
      maxN,
    };
  }

  function press() {
    if (finished || !isJudged(index) || phase !== "show") return;
    pressed = true;
    judge();
    phase = "gap";
    timer = GAP_DURATION;
  }

  const scene = {
    keyDown(code) {
      if (code === "Space") press();
    },
    pointerDown(x, y) {
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        press();
      }
    },
    update(dt, { channel }) {
      if (!finished) {
        timer -= dt;
        if (phase === "ready") {
          if (timer <= 0) {
            phase = "show";
            timer = SHOW_DURATION;
          }
        } else if (phase === "show") {
          if (timer <= 0) {
            judge();
            phase = "gap";
            timer = GAP_DURATION;
          }
        } else if (phase === "gap") {
          if (timer <= 0) advanceTrial();
        }
      }
      if (channel) channel.setSnapshot(snapshot());
    },
    render({ ctx, size }) {
      const colors = themeColors();
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, size.width, size.height);

      rect = respondRect(size);

      const instruction = `${maxN}-back : « Correspond » si la lettre est la même qu'il y a ${maxN} lettres.`;
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      drawWrappedText(ctx, instruction, size.width / 2, 16, size.width * 0.92, 15, 20);

      if (phase === "show") {
        const letter = seq[index];
        const fontSize = Math.min(size.width * 0.4, size.height * 0.3, 160);
        ctx.fillStyle = colors.accent;
        ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(letter, size.width / 2, size.height * 0.42);
      }

      const judged = isJudged(index);
      ctx.fillStyle = judged ? colors.accent : colors.surface2;
      ctx.globalAlpha = judged ? (pressed ? 0.6 : 1) : 0.5;
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = judged ? colors.accentText : colors.text;
      ctx.font = "600 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Correspond", size.width / 2, rect.y + rect.h / 2);

      const judgedTotal = JUDGED_TRIALS;
      const progress = Math.min(total, judgedTotal) / judgedTotal;
      ctx.fillStyle = colors.surface2;
      ctx.fillRect(0, size.height - 4, size.width, 4);
      ctx.fillStyle = colors.accent;
      ctx.fillRect(0, size.height - 4, size.width * progress, 4);

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    },
  };

  const game = mountGame(container, { gameId: "nback", scene, describe: `N-back ${maxN}` });

  if (game.channel) {
    game.channel.onInput((payload) => {
      if (payload && payload.kind === "press") press();
    });
  }

  return { destroy: game.destroy };
}
