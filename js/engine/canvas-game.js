import { createLoop } from "./loop.js";
import { fitCanvas } from "./render.js";
import { createInput } from "./input.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isLocalHost() {
  try {
    return LOCAL_HOSTS.has(window.location.hostname);
  } catch {
    return false;
  }
}

function testMode() {
  try {
    if (!isLocalHost()) return false;
    return new URLSearchParams(window.location.search).get("test") === "1";
  } catch {
    return false;
  }
}

function testTimeScale() {
  try {
    const raw = Number(new URLSearchParams(window.location.search).get("speed"));
    if (!Number.isFinite(raw) || raw < 1) return 1;
    return Math.min(raw, 20);
  } catch {
    return 1;
  }
}

export function createTestChannel(gameId) {
  const state = { game: gameId, submitted: [], snapshot: null, paused: false };
  return {
    activeGame: gameId,
    submit(payload) {
      state.submitted.push(payload);
      if (state.handler) state.handler(payload);
    },
    onInput(handler) {
      state.handler = handler;
    },
    setSnapshot(snapshot) {
      state.snapshot = snapshot;
    },
    state() {
      return state.snapshot ? { ...state.snapshot } : null;
    },
    setPaused(value) {
      state.paused = Boolean(value);
    },
    isPaused() {
      return state.paused;
    },
    reset() {
      state.submitted = [];
      state.snapshot = null;
      state.handler = null;
    },
  };
}

export function createGameClock(now = () => performance.now()) {
  const reasons = new Set();
  let pausedAt = 0;
  let offset = 0;

  return {
    now() {
      return (reasons.size ? pausedAt : now()) - offset;
    },
    setPaused(reason, paused) {
      if (paused && !reasons.has(reason)) {
        if (reasons.size === 0) pausedAt = now();
        reasons.add(reason);
      } else if (!paused && reasons.delete(reason) && reasons.size === 0) {
        offset += now() - pausedAt;
      }
    },
  };
}

export function mountGame(container, { gameId, scene, describe = "" }) {
  const canvas = document.createElement("canvas");
  canvas.className = "game-canvas";
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", describe || "Jeu");
  canvas.tabIndex = 0;
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let size = fitCanvas(canvas, ctx);

  const channel = testMode() ? createTestChannel(gameId) : null;
  if (channel) {
    window.__cog = channel;
  }
  const timeScale = channel ? testTimeScale() : 1;

  if (scene.enter) scene.enter({ ctx, channel, size });

  let paused = false;
  const clock = createGameClock();
  const gameClock = () => clock.now();

  const input = createInput(canvas, {
    onKeyDown(code) {
      if (paused) return;
      if (scene.keyDown) scene.keyDown(code);
    },
    onPointer(x, y) {
      if (paused) return;
      if (scene.pointerDown) scene.pointerDown(x, y);
    },
    onEscape() {
      paused = !paused;
      clock.setPaused("manual", paused);
      input.clear();
      if (channel) channel.setPaused(paused);
      if (scene.pause) scene.pause(paused);
    },
  });

  function onResize() {
    size = fitCanvas(canvas, ctx);
    if (scene.resize) scene.resize(size);
  }

  let resizeTimer = 0;
  function debouncedResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 100);
  }
  window.addEventListener("resize", debouncedResize);
  window.addEventListener("orientationchange", debouncedResize);

  let gameTime = 0;

  const loop = createLoop({
    onPauseChange(hidden) {
      clock.setPaused("visibility", hidden);
    },
    update(dt) {
      if (paused) return;
      const scaled = dt * timeScale;
      gameTime += scaled;
      scene.update(scaled, { channel, gameTime, gameClock });
    },
    render(alpha) {
      ctx.clearRect(0, 0, size.width, size.height);
      scene.render({ ctx, size, alpha, channel, gameTime, gameClock });
      if (paused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, size.width, size.height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 24px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("En pause", size.width / 2, size.height / 2 - 12);
        ctx.font = "500 15px system-ui, sans-serif";
        ctx.fillText("Échap pour reprendre", size.width / 2, size.height / 2 + 20);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }
    },
  });
  loop.start();

  return {
    canvas,
    channel,
    destroy() {
      loop.stop();
      input.destroy();
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("orientationchange", debouncedResize);
      clearTimeout(resizeTimer);
      if (scene.exit) scene.exit();
      if (window.__cog === channel) delete window.__cog;
      canvas.remove();
    },
  };
}
