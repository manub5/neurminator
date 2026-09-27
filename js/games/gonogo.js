import { mountGame } from "../engine/canvas-game.js";
import { themeColors, drawWrappedText } from "../engine/render.js";
import { playTouch } from "../sound.js";
import { getSettings } from "../storage/local.js";

// Go/No-Go : tâche classique d'inhibition et d'attention soutenue
// (utilisée en neuropsychologie, ex. dans l'évaluation du TDAH).
const TOTAL_TRIALS = 26;
const MIN_ISI = 0.5;
const MAX_ISI = 1.1;
const FEEDBACK_DURATION = 0.3;
const GO_SYMBOL = "🟢";
const NOGO_SYMBOL = "🛑";

export function noGoRatioForLevel(level) {
  return Math.min(0.4, 0.15 + (level - 1) * 0.05);
}

export function stimulusDurationForLevel(level) {
  return Math.max(0.5, 0.9 - (level - 1) * 0.05);
}

export function prepare(level, { container, onFinish }) {
  const noGoRatio = noGoRatioForLevel(level);
  const stimulusDuration = stimulusDurationForLevel(level);

  let finished = false;
  let trialIndex = 0;
  let phase = "delay";
  let timer = MIN_ISI + Math.random() * (MAX_ISI - MIN_ISI);
  let isGo = true;
  let pressedThisTrial = false;
  let shownAt = 0;
  let clock = () => performance.now();
  let rts = [];
  let correct = 0;
  let total = 0;
  let hits = 0;
  let misses = 0;
  let correctWithholds = 0;
  let falseAlarms = 0;
  let flash = null;

  function snapshot() {
    return {
      phase,
      trialIndex,
      isGo,
      correct,
      total,
      hits,
      misses,
      correctWithholds,
      falseAlarms,
    };
  }

  function beginStimulus() {
    isGo = Math.random() >= noGoRatio;
    pressedThisTrial = false;
    phase = "stimulus";
    timer = stimulusDuration;
    shownAt = clock();
  }

  function judge(pressed) {
    total += 1;
    if (isGo) {
      if (pressed) {
        correct += 1;
        hits += 1;
        rts.push(Math.max(1, clock() - shownAt));
        flash = "correct";
      } else {
        misses += 1;
        flash = "missed";
      }
    } else if (pressed) {
      falseAlarms += 1;
      flash = "wrong";
    } else {
      correct += 1;
      correctWithholds += 1;
      flash = "correct";
    }
  }

  function press() {
    if (finished || phase !== "stimulus" || pressedThisTrial) return;
    pressedThisTrial = true;
    judge(true);
    if (isGo) playTouch(getSettings().soundEnabled, trialIndex % 9);
    phase = "feedback";
    timer = FEEDBACK_DURATION;
  }

  function nextTrial() {
    flash = null;
    trialIndex += 1;
    if (trialIndex >= TOTAL_TRIALS) {
      finish();
      return;
    }
    phase = "delay";
    timer = MIN_ISI + Math.random() * (MAX_ISI - MIN_ISI);
  }

  function finish() {
    if (finished) return;
    finished = true;
    const avgRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
    onFinish({ correct, total, hits, misses, correctWithholds, falseAlarms, avgRt });
  }

  const scene = {
    keyDown(code) {
      if (code === "Space") press();
    },
    pointerDown() {
      press();
    },
    update(dt, { channel, gameClock }) {
      if (gameClock) clock = gameClock;
      if (!finished) {
        timer -= dt;
        if (phase === "delay") {
          if (timer <= 0) beginStimulus();
        } else if (phase === "stimulus") {
          if (timer <= 0) {
            judge(false);
            phase = "feedback";
            timer = FEEDBACK_DURATION;
          }
        } else if (phase === "feedback") {
          if (timer <= 0) nextTrial();
        }
      }
      if (channel) channel.setSnapshot(snapshot());
    },
    render({ ctx, size }) {
      const colors = themeColors();
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, size.width, size.height);

      const instruction = `Appuyez sur ${GO_SYMBOL} uniquement. Ne touchez rien pour ${NOGO_SYMBOL}.`;
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      drawWrappedText(ctx, instruction, size.width / 2, 16, size.width * 0.92, 15, 20);

      ctx.fillStyle = colors.textDim;
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillText(`Bonnes réponses : ${correct}/${total}`, size.width / 2, 64);

      const cx = size.width / 2;
      const cy = size.height * 0.5;

      if (phase === "delay") {
        ctx.fillStyle = colors.surface2;
        ctx.font = "300 40px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", cx, cy);
      } else {
        const symbol = isGo ? GO_SYMBOL : NOGO_SYMBOL;
        ctx.font = `${Math.round(Math.min(size.width, size.height) * 0.28)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbol, cx, cy);

        if (flash) {
          ctx.beginPath();
          ctx.arc(cx, cy, Math.min(size.width, size.height) * 0.19, 0, Math.PI * 2);
          ctx.lineWidth = 5;
          ctx.strokeStyle =
            flash === "correct" ? "#4caf50" : flash === "missed" ? colors.textDim : colors.danger;
          ctx.stroke();
        }
      }

      const progress = Math.min(trialIndex, TOTAL_TRIALS) / TOTAL_TRIALS;
      ctx.fillStyle = colors.surface2;
      ctx.fillRect(0, size.height - 4, size.width, 4);
      ctx.fillStyle = colors.accent;
      ctx.fillRect(0, size.height - 4, size.width * progress, 4);

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    },
  };

  const game = mountGame(container, { gameId: "gonogo", scene, describe: "Go/No-Go" });

  if (game.channel) {
    game.channel.onInput((payload) => {
      if (payload && payload.kind === "press") press();
    });
  }

  return { destroy: game.destroy, pause: game.pause };
}
