import { screenToLogical } from "./render.js";

export function keyboardIndexFromCode(code, count) {
  if (!code) return -1;
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(code);
  if (!match) return -1;
  const index = Number(match[1]) - 1;
  return index < count ? index : -1;
}

export function gridIndexFromClient(clientX, clientY, rect, cols, rows) {
  if (clientX < rect.left || clientY < rect.top) return -1;
  const cellW = rect.width / cols;
  const cellH = rect.height / rows;
  const col = Math.floor((clientX - rect.left) / cellW);
  const row = Math.floor((clientY - rect.top) / cellH);
  if (col < 0 || col >= cols || row < 0 || row >= rows) return -1;
  return row * cols + col;
}

const PREVENT_KEYS = new Set([
  "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape",
]);

export function createInput(canvas, { onKeyDown, onPointer, onEscape } = {}) {
  const down = new Set();

  function handleKeyDown(event) {
    if (PREVENT_KEYS.has(event.code)) event.preventDefault();
    if (event.repeat) return;
    down.add(event.code);
    if (event.code === "Escape" && onEscape) {
      onEscape();
      return;
    }
    if (onKeyDown) onKeyDown(event.code, event);
  }

  function handleKeyUp(event) {
    down.delete(event.code);
  }

  function clearKeys() {
    down.clear();
  }

  function handlePointerDown(event) {
    event.preventDefault();
    canvas.focus();
    if (onPointer) {
      const p = screenToLogical(event.clientX, event.clientY, canvas);
      onPointer(p.x, p.y, event);
    }
  }

  function handleVisibility() {
    if (document.hidden) clearKeys();
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", clearKeys);
  document.addEventListener("visibilitychange", handleVisibility);
  canvas.addEventListener("pointerdown", handlePointerDown);

  return {
    isDown: (code) => down.has(code),
    clear: clearKeys,
    destroy() {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearKeys);
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      down.clear();
    },
  };
}
