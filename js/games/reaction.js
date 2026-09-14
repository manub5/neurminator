const TOTAL_TRIALS = 15;
const MIN_DELAY = 1000;
const MAX_DELAY = 2500;
const ANTICIPATION_MS = 150;
const RESPONSE_WINDOW = 2000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function prepare(level, { container, onFinish }) {
  container.innerHTML = "";
  const mode = modeForLevel(level);

  const instruction = document.createElement("p");
  instruction.className = "reaction-instruction";
  instruction.textContent =
    mode === 1
      ? "Tapez la balle dès qu'elle apparaît."
      : "Tapez la balle entourée, uniquement elle.";
  container.appendChild(instruction);

  const stage = document.createElement("div");
  stage.className = "reaction-stage";
  container.appendChild(stage);

  const rts = [];
  let correct = 0;
  let total = 0;
  let anticipations = 0;

  try {
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      stage.innerHTML = "";
      await wait(MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY));

      const count = mode;
      const positions = randomPositions(count);
      const activePos = positions[Math.floor(Math.random() * count)];

      const targets = [];
      for (const pos of positions) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "reaction-target";
        btn.style.gridArea = `${Math.floor(pos / 3) + 1} / ${(pos % 3) + 1}`;
        const isActive = pos === activePos;
        if (isActive) btn.classList.add("is-active");
        btn.dataset.active = isActive ? "true" : "false";
        stage.appendChild(btn);
        targets.push(btn);
      }

      const startedAt = performance.now();
      const result = await new Promise((resolve) => {
        let settled = false;
        const handlers = targets.map((btn) => {
          const h = () => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve({ pressed: true, active: btn.dataset.active === "true" });
          };
          btn.addEventListener("click", h);
          return { btn, h };
        });
        function cleanup() {
          handlers.forEach(({ btn, h }) => btn.removeEventListener("click", h));
          clearTimeout(timer);
        }
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve({ pressed: false, active: false });
        }, RESPONSE_WINDOW);
      });

      const rt = performance.now() - startedAt;
      total += 1;

      if (result.pressed && rt < ANTICIPATION_MS) {
        anticipations += 1;
      } else if (result.pressed && result.active) {
        correct += 1;
        rts.push(rt);
      }

      stage.innerHTML = "";
      await wait(400);
    }

    const avgRt = rts.length
      ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
      : null;
    onFinish({ avgRt, correct, total, mode, anticipations });
  } catch (err) {
    console.error("Reaction error", err);
    onFinish({
      avgRt: null,
      correct,
      total,
      mode,
      anticipations,
      error: String(err),
    });
  }
}
