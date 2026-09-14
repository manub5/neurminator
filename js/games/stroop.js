const COLORS = [
  { id: "rouge", label: "Rouge", css: "#ff5c5c" },
  { id: "vert", label: "Vert", css: "#4caf50" },
  { id: "bleu", label: "Bleu", css: "#4f8cff" },
  { id: "jaune", label: "Jaune", css: "#f2c94c" },
  { id: "violet", label: "Violet", css: "#b06cff" },
  { id: "orange", label: "Orange", css: "#ff9f43" },
];
const TOTAL_TRIALS = 24;

function incongruentRatio(level) {
  if (level <= 1) return 0.5;
  if (level === 2) return 0.65;
  if (level === 3) return 0.8;
  return 0.9;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function prepare(level, { container, onFinish }) {
  container.innerHTML = "";

  const instruction = document.createElement("p");
  instruction.className = "stroop-instruction";
  instruction.textContent = "Choisissez la COULEUR DE L'ENCRE (pas le mot lu).";
  container.appendChild(instruction);

  const stimulus = document.createElement("div");
  stimulus.className = "stroop-stimulus";
  container.appendChild(stimulus);

  const pad = document.createElement("div");
  pad.className = "stroop-pad";
  container.appendChild(pad);

  const buttons = COLORS.map((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = color.label;
    btn.style.background = color.css;
    btn.style.color = "#14161a";
    btn.dataset.id = color.id;
    pad.appendChild(btn);
    return btn;
  });

  const ratio = incongruentRatio(level);
  let correct = 0;
  let total = 0;
  let congruent = 0;
  let incongruent = 0;

  try {
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      const trial = buildTrial(Math.random() < ratio);
      stimulus.textContent = trial.word;
      stimulus.style.color = trial.ink.css;

      const chosen = await new Promise((resolve) => {
        const handlers = buttons.map((btn) => {
          const h = () => {
            handlers.forEach(({ b, fn }) => b.removeEventListener("click", fn));
            resolve(btn.dataset.id);
          };
          btn.addEventListener("click", h);
          return { b: btn, fn: h };
        });
      });

      if (chosen === trial.ink.id) correct += 1;
      if (trial.incongruent) incongruent += 1;
      else congruent += 1;
      total += 1;

      stimulus.textContent = "";
      await wait(250);
    }

    onFinish({ correct, total, congruent, incongruent });
  } catch (err) {
    console.error("Stroop error", err);
    onFinish({ correct, total, congruent, incongruent, error: String(err) });
  }
}
