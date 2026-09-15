export const STEP = 1 / 60;
export const MAX_FRAME = 0.25;

export function advance(acc, elapsed, { step = STEP, maxFrame = MAX_FRAME } = {}) {
  let frame = elapsed;
  if (frame > maxFrame) frame = maxFrame;
  let a = acc + frame;
  let steps = 0;
  while (a >= step) {
    a -= step;
    steps += 1;
  }
  return { acc: a, steps, elapsed: frame };
}

export function createLoop({ update, render, onPauseChange, step = STEP, maxFrame = MAX_FRAME }) {
  let acc = 0;
  let last = 0;
  let running = false;
  let paused = false;
  let rafId = 0;

  function frame(now) {
    if (!running) return;
    if (paused) {
      last = now;
      rafId = requestAnimationFrame(frame);
      return;
    }
    const elapsed = (now - last) / 1000;
    last = now;
    const r = advance(acc, elapsed, { step, maxFrame });
    acc = r.acc;
    for (let i = 0; i < r.steps; i++) update(step);
    if (render) render(r.steps ? acc / step : 0);
    rafId = requestAnimationFrame(frame);
  }

  function onVisibility() {
    paused = document.hidden;
    if (onPauseChange) onPauseChange(paused);
    if (!paused) last = performance.now();
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    acc = 0;
    document.addEventListener("visibilitychange", onVisibility);
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener("visibilitychange", onVisibility);
  }

  return { start, stop, isPaused: () => paused };
}
