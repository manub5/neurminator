import { mountGame } from "../engine/canvas-game.js";
import { roundRect, themeColors, drawWrappedText, wrapLines } from "../engine/render.js";
import { keyboardIndexFromCode } from "../engine/input.js";
import { playNotice } from "../sound.js";
import { getSettings } from "../storage/local.js";

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

// La règle alterne toutes les RULE_SWITCH_INTERVAL réponses : encre, puis mot, etc.
const RULE_SWITCH_INTERVAL = 6;
const RULE_BANNER_DURATION = 1.6;
const PEEK_DURATION = 0.85;
const CLASSIC_FEEDBACK_DURATION = 0.25;
const RECALL_FEEDBACK_DURATION = 0.3;

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
    wordColorId: COLORS[wordIndex].id,
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

// "ink" : nommer la couleur de l'encre. "word" : nommer la couleur du mot lu.
export function ruleForTrial(trialIndex) {
  return Math.floor(trialIndex / RULE_SWITCH_INTERVAL) % 2 === 0 ? "ink" : "word";
}

export function targetIdFor(trial, rule) {
  return rule === "word" ? trial.wordColorId : trial.ink.id;
}

// À partir du niveau 2, plusieurs stimuli s'enchaînent et se répondent de
// mémoire d'affilée, comme les séquences du span de mémoire.
export function burstSizeForLevel(level) {
  if (level <= 1) return 1;
  if (level <= 2) return 2;
  return 3;
}

function trialsLeftInRuleBlock(trialIndex) {
  return RULE_SWITCH_INTERVAL - (trialIndex % RULE_SWITCH_INTERVAL);
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
  const maxBurst = burstSizeForLevel(level);

  let finished = false;
  let trialIndex = 0;
  let correct = 0;
  let total = 0;
  let congruent = 0;
  let incongruent = 0;
  let items = [];

  let rule = "ink";
  let lastAnnouncedRule = null;

  let burst = [];
  let burstPos = 0;
  let mode = "classic";

  let phase = "rule";
  let timer = 0;
  let chosenId = null;
  let feedbackTimer = 0;

  function currentTarget() {
    return burst[burstPos] ?? null;
  }

  function enterPresentation() {
    chosenId = null;
    burstPos = 0;
    if (mode === "classic") {
      phase = "stimulus";
    } else {
      phase = "peek";
      timer = PEEK_DURATION;
    }
  }

  function startRound() {
    const remaining = TOTAL_TRIALS - trialIndex;
    if (remaining <= 0) {
      finish();
      return;
    }
    rule = ruleForTrial(trialIndex);
    const size = Math.min(maxBurst, trialsLeftInRuleBlock(trialIndex), remaining);
    burst = Array.from({ length: size }, () => buildTrial(Math.random() < ratio));
    burstPos = 0;
    mode = size > 1 ? "memory" : "classic";

    if (rule !== lastAnnouncedRule) {
      lastAnnouncedRule = rule;
      phase = "rule";
      timer = RULE_BANNER_DURATION;
      playNotice(getSettings().soundEnabled);
      return;
    }
    enterPresentation();
  }

  function advancePeek() {
    burstPos += 1;
    if (burstPos >= burst.length) {
      burstPos = 0;
      phase = "recall";
      chosenId = null;
    } else {
      timer = PEEK_DURATION;
    }
  }

  function afterFeedback() {
    if (mode === "memory" && burstPos + 1 < burst.length) {
      burstPos += 1;
      chosenId = null;
      phase = "recall";
      return;
    }
    startRound();
  }

  function finish() {
    if (finished) return;
    finished = true;
    onFinish({ correct, total, congruent, incongruent });
  }

  function snapshot() {
    const target = currentTarget();
    const visiblePhase =
      phase === "rule" ? "rule" : phase === "peek" ? "peek" : feedbackTimer > 0 ? "feedback" : phase;
    return {
      phase: visiblePhase,
      rule,
      trialIndex,
      burstSize: burst.length,
      burstIndex: burstPos,
      word: target ? target.word : "",
      wordColorId: target ? target.wordColorId : null,
      ink: target ? target.ink.id : null,
      incongruent: target ? target.incongruent : false,
      chosenId,
      correct,
      total,
    };
  }

  function choose(index) {
    if (finished || chosenId !== null) return;
    if (!Number.isInteger(index) || index < 0 || index >= COLORS.length) return;
    if (phase !== "stimulus" && phase !== "recall") return;
    const target = currentTarget();
    if (!target) return;

    const id = COLORS[index].id;
    chosenId = id;
    if (id === targetIdFor(target, rule)) correct += 1;
    if (target.incongruent) incongruent += 1;
    else congruent += 1;
    total += 1;
    trialIndex += 1;
    feedbackTimer = mode === "classic" ? CLASSIC_FEEDBACK_DURATION : RECALL_FEEDBACK_DURATION;
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
      if (!finished) {
        if (phase === "rule") {
          timer -= dt;
          if (timer <= 0) enterPresentation();
        } else if (phase === "peek") {
          timer -= dt;
          if (timer <= 0) advancePeek();
        } else if (feedbackTimer > 0) {
          feedbackTimer -= dt;
          if (feedbackTimer <= 0) afterFeedback();
        }
      }
      if (channel) channel.setSnapshot(snapshot());
    },
    render({ ctx, size }) {
      const colors = themeColors();
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, size.width, size.height);

      if (phase === "rule") {
        ctx.fillStyle = colors.textDim;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "600 15px system-ui, sans-serif";
        ctx.fillText("🔄 Nouvelle règle", size.width / 2, size.height * 0.36);

        const label =
          rule === "word"
            ? "Choisissez la couleur DU MOT écrit"
            : "Choisissez la couleur DE L'ENCRE";
        ctx.fillStyle = colors.accent;
        ctx.font = "700 26px system-ui, sans-serif";
        const lines = wrapLines(ctx, label, size.width * 0.82);
        lines.forEach((line, i) => {
          ctx.fillText(line, size.width / 2, size.height * 0.36 + 42 + i * 32);
        });

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        return;
      }

      const instruction =
        rule === "word"
          ? "Choisissez la couleur DU MOT écrit (pas l'encre)."
          : "Choisissez la couleur DE L'ENCRE (pas le mot lu).";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      drawWrappedText(ctx, instruction, size.width / 2, 16, size.width * 0.92, 15, 20);

      if (mode === "memory") {
        const label =
          phase === "peek"
            ? `👀 Mémorisez : ${burstPos + 1}/${burst.length}`
            : `🧠 Réponse ${burstPos + 1}/${burst.length}`;
        ctx.fillStyle = colors.textDim;
        ctx.font = "600 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(label, size.width / 2, 56);
      }

      const layout = padLayout(size);
      items = layout.items;

      const target = currentTarget();
      const showWord = target && (phase === "stimulus" || phase === "peek");

      if (showWord) {
        const wordSize = Math.min(size.width * 0.22, (layout.top - 90) * 0.7, 96);
        ctx.fillStyle = target.ink.css;
        ctx.font = `700 ${wordSize}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(target.word, size.width / 2, layout.top / 2 + 10);
      } else if (phase === "recall") {
        ctx.fillStyle = colors.textDim;
        ctx.font = "600 18px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("De mémoire…", size.width / 2, layout.top / 2 + 10);
      }

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

  startRound();
  const game = mountGame(container, { gameId: "stroop", scene, describe: "Stroop" });

  if (game.channel) {
    game.channel.onInput((payload) => {
      if (payload && Number.isInteger(payload.index)) choose(payload.index);
    });
  }

  return { destroy: game.destroy, pause: game.pause };
}
