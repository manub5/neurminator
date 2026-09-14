const LETTERS = ["B", "D", "F", "G", "K", "M", "P", "T"];
const SHOW_DURATION = 1500;
const GAP_DURATION = 500;
const READY_DURATION = 1200;
const JUDGED_TRIALS = 20;
const TARGET_RATIO = 0.3;
const MAX_N = 5;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLetter(avoid) {
  let letter;
  do {
    letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  } while (letter === avoid);
  return letter;
}

export function buildSequence(n, judgedTrials, targetRatio) {
  const total = n + judgedTrials;
  const seq = [randomLetter(null)];
  const targetFlags = [];
  for (let i = 1; i < total; i++) {
    const isJudged = i >= n;
    const wantTarget = isJudged && Math.random() < targetRatio;
    let letter;
    if (wantTarget) {
      letter = seq[i - n];
      targetFlags.push(true);
    } else {
      letter = randomLetter(seq[i - n]);
      if (isJudged) targetFlags.push(false);
    }
    seq.push(letter);
  }
  return { seq, targetFlags };
}

export async function prepare(level, { container, onFinish }) {
  const maxN = Math.max(1, Math.min(level, MAX_N));
  container.innerHTML = "";

  const instruction = document.createElement("p");
  instruction.className = "nback-instruction";
  container.appendChild(instruction);

  const stimulus = document.createElement("div");
  stimulus.className = "nback-stimulus";
  container.appendChild(stimulus);

  const respond = document.createElement("button");
  respond.type = "button";
  respond.className = "nback-respond";
  respond.textContent = "Correspond";
  container.appendChild(respond);

  const { seq, targetFlags } = buildSequence(maxN, JUDGED_TRIALS, TARGET_RATIO);

  instruction.textContent = `${maxN}-back : tapez « Correspond » si la lettre est la même qu'il y a ${maxN} lettres.`;

  let correct = 0;
  let total = 0;
  let targetCount = 0;

  try {
    await wait(READY_DURATION);

    for (let i = 0; i < seq.length; i++) {
      const isJudged = i >= maxN;
      stimulus.textContent = seq[i];
      let pressed = false;
      respond.disabled = !isJudged;

      if (isJudged) {
        await new Promise((resolve) => {
          const onClick = () => {
            pressed = true;
            respond.removeEventListener("click", onClick);
            resolve();
          };
          respond.addEventListener("click", onClick);
          wait(SHOW_DURATION).then(() => {
            respond.removeEventListener("click", onClick);
            resolve();
          });
        });
      } else {
        await wait(SHOW_DURATION);
      }

      if (isJudged) {
        const isTarget = targetFlags[total];
        if (isTarget) targetCount += 1;
        const ok = isTarget ? pressed : !pressed;
        if (ok) correct += 1;
        total += 1;
      }

      stimulus.textContent = "";
      await wait(GAP_DURATION);
    }

    onFinish({ maxN, correct, total, targets: targetCount });
  } catch (err) {
    console.error("N-back error", err);
    onFinish({ maxN, correct, total, targets: targetCount, error: String(err) });
  }
}
