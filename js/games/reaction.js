import { mountGame } from "../engine/canvas-game.js";
import { themeColors, drawWrappedText } from "../engine/render.js";
import { keyboardIndexFromCode } from "../engine/input.js";

const TOTAL_TRIALS = 15;
const MIN_DELAY = 1.0;
const MAX_DELAY = 2.5;
const RESPONSE_WINDOW = 2.0;
const POST_TRIAL = 0.4;

export function modeForLevel(level) {
  if (level <= 1) return 1;
  if (level === 2) return 2;
  return 4;
}

function randomPositions(count, cols = 3, rows = 3) {
  const cells = [];
  for (let i = 0; i < cols * rows; i++) cells.push(i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, count);
}

function stageLayout(size) {
  const side = Math.min(size.width, size.height * 0.8) * 0.9;
  const cell = side / 3;
  const w = cell * 3;
  const h = cell * 3;
  return { x: (size.width - w) / 2, y: (size.height - h) / 2 + 12, cell, w, h, radius: cell * 0.36 };
}

function positionCenter(layout, pos) {
  const col = pos % 3;
  const row = Math.floor(pos / 3);
  return {
    cx: layout.x + col * layout.cell + layout.cell / 2,
    cy: layout.y + row * layout.cell + layout.cell / 2,
  };
}

function hitPosition(layout, x, y) {
  for (let pos = 0; pos < 9; pos++) {
    const { cx, cy } = positionCenter(layout, pos);
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= layout.radius * layout.radius * 1.2) return pos;
  }
  return -1;
}

export function prepare(level, { container, onFinish }) {
  const mode = modeForLevel(level);

  let finished = false;
  let trialIndex = 0;
  let phase = "delay";
  let timer = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
  let positions = [];
  let activePos = -1;
  let shownAt = 0;
  let elapsed = 0;
  let clock = () => performance.now();
  let rts = [];
  let correct = 0;
  let total = 0;
  let anticipations = 0;
  let layout = stageLayout({ width: 0, height: 0 });
  let flash = null;

  function snapshot() {
    return {
      phase,
      trialIndex,
      mode,
      positions: positions.slice(),
      activePos,
      correct,
      total,
      anticipations,
    };
  }

  function beginStimulus() {
    const count = mode;
    positions = randomPositions(count);
    activePos = positions[Math.floor(Math.random() * count)];
    phase = "stimulus";
    elapsed = 0;
    shownAt = clock();
  }

  function resolve(hitPos) {
    if (phase !== "stimulus") return;
    if (!Number.isInteger(hitPos) || hitPos < 0 || hitPos > 8) return;
    const rt = Math.max(1, clock() - shownAt);
    total += 1;

    if (hitPos === activePos) {
      correct += 1;
      rts.push(rt);
      flash = { pos: activePos, color: "correct" };
    } else {
      flash = { pos: hitPos, color: "wrong" };
    }

    phase = "post";
    timer = POST_TRIAL;
  }

  function nextTrial() {
    flash = null;
    trialIndex += 1;
    if (trialIndex >= TOTAL_TRIALS) {
      finish();
      return;
    }
    positions = [];
    activePos = -1;
    phase = "delay";
    timer = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
  }

  function finish() {
    if (finished) return;
    finished = true;
    const avgRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
    onFinish({ avgRt, correct, total, mode, anticipations });
  }

  function pressAt(x, y) {
    if (phase !== "stimulus") return;
    const pos = hitPosition(layout, x, y);
    if (pos < 0 || !positions.includes(pos)) return;
    resolve(pos);
  }

  function pressIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index > 8) return;
    if (phase === "delay") {
      anticipe(index);
      return;
    }
    if (phase === "stimulus" && positions.includes(index)) resolve(index);
  }

  function anticipe(pos) {
    if (phase !== "delay") return;
    anticipations += 1;
    total += 1;
    flash = { pos: pos >= 0 ? pos : activePos, color: "anticipation" };
    phase = "post";
    timer = POST_TRIAL;
  }

  const scene = {
    keyDown(code) {
      const index = keyboardIndexFromCode(code, 9);
      if (index >= 0) {
        pressIndex(index);
      } else if (code === "Space" && mode === 1) {
        if (phase === "delay") anticipe(-1);
        else if (phase === "stimulus") resolve(activePos);
      }
    },
    pointerDown(x, y) {
      pressAt(x, y);
    },
    update(dt, { channel, gameClock }) {
      if (gameClock) clock = gameClock;
      if (!finished) {
        timer -= dt;
        if (phase === "delay") {
          if (timer <= 0) beginStimulus();
        } else if (phase === "stimulus") {
          elapsed = (clock() - shownAt) / 1000;
          if (elapsed >= RESPONSE_WINDOW) {
            total += 1;
            flash = null;
            phase = "post";
            timer = POST_TRIAL;
          }
        } else if (phase === "post") {
          if (timer <= 0) nextTrial();
        }
      }
      if (channel) channel.setSnapshot(snapshot());
    },
    render({ ctx, size }) {
      const colors = themeColors();
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, size.width, size.height);

      layout = stageLayout(size);

      const instruction =
        mode === 1 ? "Tapez la balle dès qu'elle apparaît." : "Tapez la balle entourée, uniquement elle.";
      ctx.fillStyle = colors.textDim;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      drawWrappedText(ctx, instruction, size.width / 2, 16, size.width * 0.92, 15, 20);

      const showTargets = phase === "stimulus" || phase === "post";
      if (showTargets && positions.length) {
        for (const pos of positions) {
          const { cx, cy } = positionCenter(layout, pos);
          const isActive = pos === activePos;
          ctx.beginPath();
          ctx.arc(cx, cy, layout.radius, 0, Math.PI * 2);
          ctx.fillStyle = isActive ? colors.accent : colors.surface2;
          ctx.fill();
        }
        if (activePos >= 0) {
          const { cx, cy } = positionCenter(layout, activePos);
          ctx.beginPath();
          ctx.arc(cx, cy, layout.radius * 1.18, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = colors.text;
          ctx.stroke();
        }
      }

      if (flash && flash.pos >= 0) {
        const { cx, cy } = positionCenter(layout, flash.pos);
        ctx.beginPath();
        ctx.arc(cx, cy, layout.radius * 1.05, 0, Math.PI * 2);
        ctx.lineWidth = 5;
        ctx.strokeStyle = flash.color === "correct" ? "#4caf50" : colors.danger;
        ctx.stroke();
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

  const game = mountGame(container, { gameId: "reaction", scene, describe: "Temps de réaction" });

  if (game.channel) {
    game.channel.onInput((payload) => {
      if (payload && Number.isInteger(payload.index)) pressIndex(payload.index);
    });
  }

  return { destroy: game.destroy };
}
