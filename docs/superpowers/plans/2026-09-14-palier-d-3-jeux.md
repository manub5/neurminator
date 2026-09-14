# neurminator — Palier D : 3 jeux — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer N-back, Stroop et Temps de réaction, chacun complet (partie, score, difficulté, historique), en JS natif, avec `core/scoring.js` et `core/difficulty.js` étendus et testés.

**Architecture:** Chaque jeu est un module `js/games/<id>.js` exposant `prepare(level, {container, onFinish})`. La vue `game.js` route le résultat via `scoring` → `difficulty` → `storage`. Grille de styles dans `css/games.css`.

**Tech Stack:** JS natif, modules ES, localStorage. Sans build.

**Spec:** `docs/superpowers/specs/2026-09-14-palier-d-3-jeux-design.md`

## Global Constraints

- **Code en anglais**, interface en français. Chemins relatifs. Sans build.
- Ids : `nback`, `span`, `stroop`, `reaction`.
- `raw` non testé automatiquement au-delà de `scoring`/`difficulty`.
- Scoring : nback et stroop `correct/total` (higherIsBetter) ; reaction `avgRt` (lower).
- Difficulté : fenêtre 3, min 2, `rate>0.5` → +1, `rate<0.5` → −1, plancher 1.
- Réutiliser les helpers existants (`wait`, styles `.span-actions`, `.result-card`).

---

### Task D1: Étendre `core/scoring.js` et `core/difficulty.js` (TDD)

**Files:**
- Modify: `js/core/scoring.js`
- Modify: `js/core/difficulty.js`
- Modify: `tests/scoring.test.js`
- Modify: `tests/difficulty.test.js`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `scoring.normalize(gameId, raw)` gère `nback`, `span`, `stroop`, `reaction`.
  - `difficulty.nextLevel(gameId, currentLevel, recentScores)` gère les 4 jeux.

- [ ] **Step 1: Ajouter les tests scoring (failing)**

Ajouter dans `tests/scoring.test.js`, après la suite `score span` :

```js
  suite("scoring: nback/stroop/reaction", () => {
    test("nback = correct/total", () => {
      const r = scoring.normalize("nback", { correct: 8, total: 10 });
      assertEqual(r.score, 0.8);
      assertEqual(r.higherIsBetter, true);
    });

    test("stroop = correct/total", () => {
      const r = scoring.normalize("stroop", { correct: 18, total: 24 });
      assertEqual(r.score, 0.75);
      assertEqual(r.higherIsBetter, true);
    });

    test("reaction = avgRt, plus bas mieux", () => {
      const r = scoring.normalize("reaction", { avgRt: 412 });
      assertEqual(r.score, 412);
      assertEqual(r.higherIsBetter, false);
    });

    test("nback total 0 ne divise pas par zéro", () => {
      const r = scoring.normalize("nback", { correct: 0, total: 0 });
      assertEqual(r.score, 0);
    });
  });
```

- [ ] **Step 2: Ajouter les tests difficulty (failing)**

Ajouter dans `tests/difficulty.test.js` :

```js
  suite("difficulty: nback", () => {
    test("3 scores ≥ 0.85 → montée", () => {
      assertEqual(difficulty.nextLevel("nback", 2, [0.9, 0.9, 0.9]), 3);
    });
    test("3 scores faibles → descente", () => {
      assertEqual(difficulty.nextLevel("nback", 2, [0.5, 0.5, 0.5]), 1);
    });
    test("plafond nback à 5", () => {
      assertEqual(difficulty.nextLevel("nback", 5, [0.99, 0.99]), 5);
    });
  });

  suite("difficulty: stroop", () => {
    test("3 scores ≥ 0.85 → montée", () => {
      assertEqual(difficulty.nextLevel("stroop", 1, [0.9, 0.9, 0.9]), 2);
    });
  });

  suite("difficulty: reaction", () => {
    test("temps sous le seuil → montée", () => {
      assertEqual(difficulty.nextLevel("reaction", 1, [400, 420, 430]), 2);
    });
    test("temps au-dessus du seuil → descente", () => {
      assertEqual(difficulty.nextLevel("reaction", 3, [600, 620, 610]), 2);
    });
    test("score 0 (aucun correct) → descente", () => {
      assertEqual(difficulty.nextLevel("reaction", 2, [0, 0, 0]), 1);
    });
  });
```

- [ ] **Step 3: Lancer les tests, vérifier l'échec**

Run: `tests/run.html`. Expected : nouveaux tests FAIL (jeux inconnus).

- [ ] **Step 4: Étendre `js/core/scoring.js`**

```js
const RULES = {
  span: {
    extractScore: (raw) => raw.maxSpan,
    higherIsBetter: true,
  },
  nback: {
    extractScore: (raw) => (raw.total > 0 ? raw.correct / raw.total : 0),
    higherIsBetter: true,
  },
  stroop: {
    extractScore: (raw) => (raw.total > 0 ? raw.correct / raw.total : 0),
    higherIsBetter: true,
  },
  reaction: {
    extractScore: (raw) => raw.avgRt,
    higherIsBetter: false,
  },
};
```

- [ ] **Step 5: Étendre `js/core/difficulty.js`**

Remplacer la table `RULES` et ajouter les seuils réaction :

```js
const REACTION_TARGET = { 1: 500, 2: 480, 3: 460 };
const REACTION_TARGET_HIGH = 440;

function reactionTarget(level) {
  return REACTION_TARGET[level] ?? REACTION_TARGET_HIGH;
}

const RULES = {
  span: {
    isSuccess: (score, level) => score >= level,
  },
  nback: {
    isSuccess: (score) => score >= 0.85,
  },
  stroop: {
    isSuccess: (score) => score >= 0.85,
  },
  reaction: {
    isSuccess: (score, level) => score > 0 && score <= reactionTarget(level),
  },
};

const CEILINGS = { nback: 5 };

// dans nextLevel, après calcul du nouveau niveau :
//   return Math.min(newLevel, CEILINGS[gameId] ?? Infinity)
```

Adapter `nextLevel` :

```js
export function nextLevel(gameId, currentLevel, recentScores) {
  const rate = successRate(gameId, currentLevel, recentScores);
  if (rate === null) return currentLevel;

  let next = currentLevel;
  if (rate > UP_THRESHOLD) next = currentLevel + 1;
  else if (rate < DOWN_THRESHOLD) next = Math.max(MIN_LEVEL, currentLevel - 1);

  const ceiling = CEILINGS[gameId];
  if (ceiling) next = Math.min(next, ceiling);
  return next;
}
```

- [ ] **Step 6: Lancer les tests, vérifier le vert**

Run: `tests/run.html`. Expected : tous verts (span + 3 jeux + garde-fous).

- [ ] **Step 7: Commit**

```bash
git add js/core/ tests/
git commit -m "feat: scoring et difficulté des 3 jeux (nback, stroop, reaction)"
```

---

### Task D2: Jeu N-back

**Files:**
- Create: `js/games/nback.js`
- Modify: `css/games.css`

**Interfaces:**
- Consumes: rien (JS natif).
- Produces: `nback.prepare(level, { container, onFinish })` → `onFinish({ maxN, correct, total, targets })`.

- [ ] **Step 1: Écrire `js/games/nback.js`**

```js
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
```

- [ ] **Step 2: Ajouter les styles dans `css/games.css`**

```css
.nback-instruction {
  text-align: center;
  color: var(--text-dim);
  margin: 0 0 16px;
  min-height: 1.5em;
}

.nback-stimulus {
  min-height: 30vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  font-weight: 700;
  color: var(--accent);
}

.nback-respond {
  display: block;
  width: min(80vw, 340px);
  margin: 24px auto 0;
  padding: 20px;
  font-size: 1.2rem;
  background: var(--accent);
  color: var(--accent-text);
}

.nback-respond:disabled {
  opacity: 0.4;
}
```

- [ ] **Step 3: Vérifier la syntaxe**

Run: `node --check js/games/nback.js`. Expected : OK.

- [ ] **Step 4: Commit**

```bash
git add js/games/nback.js css/games.css
git commit -m "feat: jeu n-back"
```

---

### Task D3: Jeu Stroop

**Files:**
- Create: `js/games/stroop.js`
- Modify: `css/games.css`

**Interfaces:**
- Consumes: rien.
- Produces: `stroop.prepare(level, { container, onFinish })` → `onFinish({ correct, total, congruent, incongruent })`.

- [ ] **Step 1: Écrire `js/games/stroop.js`**

```js
const COLORS = [
  { id: "rouge", label: "Rouge", css: "#ff5c5c" },
  { id: "vert", label: "Vert", css: "#4caf50" },
  { id: "bleu", label: "Bleu", css: "#4f8cff" },
  { id: "jaune", label: "Jaune", css: "#f2c94c" },
];
const WORDS = ["ROUGE", "VERT", "BLEU", "JAUNE"];
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
  const wordIndex = Math.floor(Math.random() * WORDS.length);
  let inkIndex = wordIndex;
  if (incongruent) {
    do {
      inkIndex = Math.floor(Math.random() * COLORS.length);
    } while (inkIndex === wordIndex);
  }
  return { word: WORDS[wordIndex], ink: COLORS[inkIndex] };
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
      const isIncongruent = Math.random() < ratio;
      const trial = buildTrial(isIncongruent);
      stimulus.textContent = trial.word;
      stimulus.style.color = COLORS.find((c) => c.label.toLowerCase() === trial.ink.id).css;

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
      if (isIncongruent) incongruent += 1;
      else congruent += 1;
      total += 1;

      await wait(250);
    }

    onFinish({ correct, total, congruent, incongruent });
  } catch (err) {
    console.error("Stroop error", err);
    onFinish({ correct, total, congruent, incongruent, error: String(err) });
  }
}
```

- [ ] **Step 2: Ajouter les styles dans `css/games.css`**

```css
.stroop-instruction {
  text-align: center;
  color: var(--text-dim);
  margin: 0 0 16px;
}

.stroop-stimulus {
  min-height: 26vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: 2px;
}

.stroop-pad {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: min(80vw, 340px);
  margin: 24px auto 0;
}

.stroop-pad button {
  padding: 20px;
  font-weight: 700;
  border-radius: var(--radius);
}
```

- [ ] **Step 3: Vérifier la syntaxe**

Run: `node --check js/games/stroop.js`. Expected : OK.

Un point d'attention : `COLORS.find((c) => c.label.toLowerCase() === trial.ink.id)` est redondant — `trial.ink` est déjà l'objet couleur. Simplifier l'assignation :

```js
      stimulus.style.color = trial.ink.css;
```

- [ ] **Step 4: Commit**

```bash
git add js/games/stroop.js css/games.css
git commit -m "feat: jeu stroop"
```

---

### Task D4: Jeu Temps de réaction

**Files:**
- Create: `js/games/reaction.js`
- Modify: `css/games.css`

**Interfaces:**
- Consumes: rien.
- Produces: `reaction.prepare(level, { container, onFinish })` → `onFinish({ avgRt, correct, total, mode, anticipations })`.

- [ ] **Step 1: Écrire `js/games/reaction.js`**

```js
const TOTAL_TRIALS = 15;
const MIN_DELAY = 1000;
const MAX_DELAY = 2500;
const ANTICIPATION_MS = 150;
const CHOICE_COUNT = { 1: 1, 2: 2 };

const PALETTE = ["#4f8cff", "#4caf50", "#ff5c5c", "#f2c94c"];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function modeForLevel(level) {
  if (level <= 1) return 1;
  if (level === 2) return 2;
  return 4;
}

export async function prepare(level, { container, onFinish }) {
  container.innerHTML = "";
  const mode = modeForLevel(level);

  const instruction = document.createElement("p");
  instruction.className = "reaction-instruction";
  instruction.textContent =
    mode === 1
      ? "Tapez dès que le cercle apparaît."
      : `Tapez le cercle ${mode === 2 ? "bleu" : "de la couleur demandée"}.`;
  container.appendChild(instruction);

  const stage = document.createElement("div");
  stage.className = "reaction-stage";
  container.appendChild(stage);

  const rts = [];
  let correct = 0;
  let total = 0;
  let anticipations = 0;

  function renderTargets(count) {
    stage.innerHTML = "";
    const activeIndex = Math.floor(Math.random() * count);
    const targets = [];
    for (let i = 0; i < count; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "reaction-target";
      btn.style.background = PALETTE[i % PALETTE.length];
      btn.dataset.active = i === activeIndex ? "true" : "false";
      stage.appendChild(btn);
      targets.push(btn);
    }
    return targets;
  }

  try {
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      stage.innerHTML = "";
      await wait(MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY));

      const targets = renderTargets(mode === 1 ? 1 : mode);
      const startedAt = performance.now();
      let pressed = false;
      let early = false;

      let chosen = null;
      const handlers = targets.map((btn) => {
        const h = () => {
          if (!pressed) {
            chosen = btn;
            pressed = true;
          }
        };
        btn.addEventListener("click", h);
        return { btn, h };
      });

      // Fenêtre de réponse : on attend un clic ou un timeout large
      await Promise.race([
        new Promise((resolve) => {
          const check = setInterval(() => {
            if (pressed) {
              clearInterval(check);
              resolve();
            }
          }, 20);
        }),
        wait(3000),
      ]);

      handlers.forEach(({ btn, h }) => btn.removeEventListener("click", h));
      const rt = performance.now() - startedAt;

      if (pressed && rt < ANTICIPATION_MS) {
        early = true;
        anticipations += 1;
      }

      const isActive = chosen && chosen.dataset.active === "true";
      if (isActive && !early) {
        correct += 1;
        rts.push(rt);
      }
      total += 1;

      stage.innerHTML = "";
      await wait(400);
    }

    const avgRt = rts.length
      ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
      : 0;
    onFinish({ avgRt, correct, total, mode, anticipations });
  } catch (err) {
    console.error("Reaction error", err);
    onFinish({ avgRt: 0, correct, total, mode, anticipations, error: String(err) });
  }
}
```

- [ ] **Step 2: Ajouter les styles dans `css/games.css`**

```css
.reaction-instruction {
  text-align: center;
  color: var(--text-dim);
  margin: 0 0 16px;
}

.reaction-stage {
  min-height: 45vh;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.reaction-target {
  width: 30vw;
  max-width: 140px;
  aspect-ratio: 1;
  border-radius: 50%;
}
```

- [ ] **Step 3: Vérifier la syntaxe**

Run: `node --check js/games/reaction.js`. Expected : OK.

- [ ] **Step 4: Commit**

```bash
git add js/games/reaction.js css/games.css
git commit -m "feat: jeu temps de réaction"
```

---

### Task D5: Registre des modules, cache PWA, tests finaux

**Files:**
- Modify: `js/views/game.js`
- Modify: `sw.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: les 3 modules.
- Produces: `MODULES` complet, app shell à jour.

- [ ] **Step 1: Enregistrer les 3 modules dans `js/views/game.js`**

Remplacer :

```js
import * as span from "../games/span.js";
```

par :

```js
import * as span from "../games/span.js";
import * as nback from "../games/nback.js";
import * as stroop from "../games/stroop.js";
import * as reaction from "../games/reaction.js";
```

et :

```js
const MODULES = { span };
```

par :

```js
const MODULES = { span, nback, stroop, reaction };
```

- [ ] **Step 2: Ajouter les 3 modules à `APP_SHELL` dans `sw.js`**

Ajouter et incrémenter `CACHE_VERSION` (`v3` → `v4`) :

```
  "./js/games/nback.js",
  "./js/games/stroop.js",
  "./js/games/reaction.js",
```

- [ ] **Step 3: Vérifier les fichiers APP_SHELL**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('sw.js','utf8');const m=s.match(/const APP_SHELL = \[([\s\S]*?)\];/);const f=[...m[1].matchAll(/\"(\.\/[^\"]*)\"/g)].map(x=>x[1]);let miss=0;for(const x of f){if(x==='./')continue;if(!fs.existsSync(x.replace(/^\.\//,''))){console.log('MANQUANT',x);miss++;}}console.log('manquants',miss);process.exit(miss?1:0)"
```

Expected : `manquants 0`.

- [ ] **Step 4: Lancer les tests unitaires**

Run: `tests/run.html`. Expected : tous verts.

- [ ] **Step 5: Mettre à jour la recette README**

Ajouter :

```markdown
### Palier D — Les 3 autres jeux

- [ ] N-back : lettres + bouton « Correspond », 20 essais jugés.
- [ ] Stroop : mot coloré, 4 boutons, choisir la couleur de l'encre.
- [ ] Réaction : cercle après délai, simple puis choix.
- [ ] Chaque jeu enregistre dans l'Historique et met à jour le niveau.
- [ ] Le record de Réaction baisse (plus bas = mieux).
```

- [ ] **Step 6: Commit**

```bash
git add js/views/game.js sw.js README.md
git commit -m "feat: enregistrer les 3 jeux, cache PWA et recette palier D"
```

---

## Self-Review

**Spec coverage :**
- §2 N-back (20 essais, cibles 30 %, score correct/total) → D1, D2.
- §3 Stroop (ratios par niveau, 24 essais, encre) → D1, D3.
- §4 Réaction (15 essais, modes 1/2/4, anticipation 150 ms, avgRt) → D1, D4.
- §5 scoring/difficulté (seuils, plafond nback 5) → D1.
- §6 vues → D5.
- §7 tests → D1, D5.

**Placeholder scan :** aucun TBD/TODO ; code réel à chaque step.

**Type consistency :**
- `prepare(level, { container, onFinish })` identique aux 3 modules.
- `raw` par jeu cohérent avec `scoring`/`difficulty` (D1).
- `modeForLevel` défini et utilisé en D4.
