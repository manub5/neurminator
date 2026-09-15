const MAX_DPR = 2;

export function fitCanvas(canvas, ctx, { maxDpr = MAX_DPR } = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: w, height: h, dpr };
}

export function screenToLogical(clientX, clientY, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = (canvas.clientWidth || rect.width) / rect.width || 1;
  const scaleY = (canvas.clientHeight || rect.height) / rect.height || 1;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function themeColors() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => {
    const value = styles.getPropertyValue(name).trim();
    return value || fallback;
  };
  return {
    background: read("--bg", "#14161a"),
    surface: read("--surface", "#1d2027"),
    surface2: read("--surface-2", "#2a2e38"),
    text: read("--text", "#f2f3f5"),
    textDim: read("--text-dim", "#9aa1ad"),
    accent: read("--accent", "#4f8cff"),
    accentText: read("--accent-text", "#0b0d10"),
    danger: read("--danger", "#ff5c5c"),
  };
}

export function fitText(ctx, text, maxWidth, startSize, family = "system-ui, sans-serif") {
  let size = startSize;
  while (size > 9) {
    ctx.font = `700 ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

export function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawWrappedText(ctx, text, x, y, maxWidth, fontSize, lineHeight, family = "system-ui, sans-serif") {
  ctx.font = `500 ${fontSize}px ${family}`;
  const lines = wrapLines(ctx, text, maxWidth);
  const startY = y;
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
  return lines.length;
}
