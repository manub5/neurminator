import { mount, randomSequence } from "./span-grid.js";

const SHOW_DURATION = 600;
const GAP_DURATION = 250;
const READY_DURATION = 800;
const FEEDBACK_DURATION = 700;
const MAX_LENGTH = 12;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function prepare(level, { container, onFinish }) {
  const startLevel = Math.max(1, level);
  const trials = [];
  const results = [];
  let maxSpan = 0;

  container.innerHTML = "";
  const instruction = document.createElement("p");
  instruction.className = "span-instruction";
  container.appendChild(instruction);
  const grid = mount(container);
  const actions = document.createElement("div");
  actions.className = "span-actions";
  const validate = document.createElement("button");
  validate.type = "button";
  validate.textContent = "Valider";
  actions.appendChild(validate);
  container.appendChild(actions);

  try {
    let length = startLevel;
    let keepPlaying = true;

    while (keepPlaying && length <= MAX_LENGTH) {
      const sequence = randomSequence(length, { maxLength: MAX_LENGTH });

      instruction.textContent = "Observez la séquence…";
      validate.disabled = true;
      grid.clear();
      await wait(READY_DURATION);

      for (const index of sequence) {
        grid.setActive(index);
        await wait(SHOW_DURATION);
        grid.clear();
        await wait(GAP_DURATION);
      }

      instruction.textContent = "Reproduisez la séquence, puis validez.";
      validate.disabled = false;
      const answer = await new Promise((resolve) => {
        const picks = [];

        function onClick(event) {
          const index = grid.cellIndexFromEvent(event);
          if (index < 0) return;
          picks.push(index);
          grid.highlight(index);
          setTimeout(() => {
            if (grid.cells[index]) grid.cells[index].classList.remove("is-highlight");
          }, 150);
        }

        function onValidate() {
          grid.element.removeEventListener("click", onClick);
          validate.removeEventListener("click", onValidate);
          resolve(picks);
        }

        grid.element.addEventListener("click", onClick);
        validate.addEventListener("click", onValidate);
      });

      validate.disabled = true;
      const correct =
        answer.length === sequence.length &&
        answer.every((value, i) => value === sequence[i]);

      trials.push(length);
      results.push(correct);
      if (correct) {
        maxSpan = length;
        length += 1;
      } else {
        keepPlaying = false;
      }

      instruction.textContent = correct ? "Réussi !" : "Raté. La bonne séquence :";
      grid.clear();
      for (const index of sequence) grid.setActive(index);
      await wait(FEEDBACK_DURATION);
      grid.clear();
    }

    onFinish({
      startLevel,
      maxSpan,
      trials,
      results,
      correctCount: results.filter(Boolean).length,
      total: results.length,
    });
  } catch (err) {
    console.error("Span game error", err);
    onFinish({
      startLevel,
      maxSpan,
      trials,
      results,
      correctCount: results.filter(Boolean).length,
      total: trials.length,
      error: String(err && err.message ? err.message : err),
    });
  }

  return () => {
    grid.clear();
  };
}
