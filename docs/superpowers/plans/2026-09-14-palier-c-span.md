# neurminator — Palier C : Span de mémoire — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le jeu Span de mémoire (grille 3×3) de bout en bout : partie jouable via jsPsych, score normalisé, écran de résultat, historique réel, ajustement de difficulté, avec `core/scoring.js` et `core/difficulty.js` testés.

**Architecture:** Le cœur jsPsych (CDN figé) pilote le séquencement des essais ; un plugin maison dessine la grille 3×3 en HTML/CSS. Chaque jeu expose `prepare(level, { container, onFinish })`. La vue `game.js` route le résultat brut vers `core/scoring` → `core/difficulty` → `storage`.

**Tech Stack:** HTML/CSS/JS ES modules natifs, jsPsych 8 (CDN figé), localStorage. Sans build.

**Spec:** `docs/superpowers/specs/2026-09-14-palier-c-span-design.md`

## Global Constraints

- **Code en anglais**, interface en français.
- **Chemins relatifs uniquement.** Sans build, sans dépendance npm.
- **jsPsych version figée** (ne jamais utiliser `latest` dans l'URL du CDN).
- **Clés localStorage** : `cog.settings`, `cog.games`, `cog.history`.
- **Identifiant du jeu** : `span`. Score = longueur max réussie, `higherIsBetter = true`.
- **Paramètres span** : départ = `level` ; allumage 600 ms ; intervalle 250 ms ; avant-séquence 800 ms ; longueur max 12.
- **Aucune dépendance npm dans le projet.**

---

### Task 1: JS natif pur pour `core/scoring.js` et `core/difficulty.js` (TDD)

**Files:**
- Create: `js/core/scoring.js`
- Create: `js/core/difficulty.js`
- Create: `tests/scoring.test.js`
- Create: `tests/difficulty.test.js`
- Modify: `tests/run.html`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `scoring.normalize(gameId, raw)` → `{ score, higherIsBetter }`.
  - `difficulty.nextLevel(gameId, currentLevel, recentScores)` → `number`, où `recentScores` est un tableau de nombres (scores de parties, du plus ancien au plus récent) et `gameId` détermine l'interprétation.
  - `difficulty.successRate(gameId, currentLevel, recentScores)` → `number | null` (null si < 2 entrées).

- [ ] **Step 1: Écrire les tests `tests/scoring.test.js` (failing)**

```js
import { assertEqual } from "./harness.js";
import * as scoring from "../js/core/scoring.js";

export function register({ suite, test }) {
  suite("scoring: span", () => {
    test("normalize extrait maxSpan et higherIsBetter", () => {
      const r = scoring.normalize("span", { maxSpan: 5 });
      assertEqual(r.score, 5);
      assertEqual(r.higherIsBetter, true);
    });

    test("normalize gère maxSpan 0", () => {
      const r = scoring.normalize("span", { maxSpan: 0 });
      assertEqual(r.score, 0);
    });

    test("normalize lève une erreur pour un jeu inconnu", () => {
      let threw = false;
      try { scoring.normalize("inconnu", {}); } catch { threw = true; }
      assertEqual(threw, true);
    });
  });
}
```

- [ ] **Step 2: Écrire les tests `tests/difficulty.test.js` (failing)**

```js
import { assertEqual } from "./harness.js";
import * as difficulty from "../js/core/difficulty.js";

export function register({ suite, test }) {
  suite("difficulty: garde-fous", () => {
    test("ne change pas le niveau avec moins de 2 scores", () => {
      assertEqual(difficulty.nextLevel("span", 3, []), 3);
      assertEqual(difficulty.nextLevel("span", 3, [5]), 3);
    });

    test("plancher à 1", () => {
      assertEqual(difficulty.nextLevel("span", 1, [0, 0, 0]), 1);
    });

    test("pas de saut de plus d'un niveau", () => {
      assertEqual(difficulty.nextLevel("span", 3, [9, 9, 9]), 4);
    });
  });

  suite("difficulty: seuils discrets span", () => {
    test("2 réussites sur 3 → montée", () => {
      assertEqual(difficulty.nextLevel("span", 3, [3, 3, 2]), 4);
    });

    test("3 réussites sur 3 → montée (+1 seulement)", () => {
      assertEqual(difficulty.nextLevel("span", 3, [4, 4, 4]), 4);
    });

    test("1 réussite sur 3 → descente", () => {
      assertEqual(difficulty.nextLevel("span", 3, [3, 2, 2]), 2);
    });

    test("0 réussite sur 3 → descente", () => {
      assertEqual(difficulty.nextLevel("span", 3, [2, 2, 1]), 2);
    });

    test("mixte 2 réussites et 1 échec → montée", () => {
      assertEqual(difficulty.nextLevel("span", 4, [4, 3, 4]), 5);
    });
  });
}
```

- [ ] **Step 3: Ajouter les tests au runner `tests/run.html`**

Remplacer le contenu du `<script type="module">` :

```html
  <script type="module">
    import { createRunner } from "./harness.js";
    import { register as registerStorage } from "./storage.test.js";
    import { register as registerScoring } from "./scoring.test.js";
    import { register as registerDifficulty } from "./difficulty.test.js";

    const runner = createRunner();
    registerStorage(runner);
    registerScoring(runner);
    registerDifficulty(runner);
    runner.render(document.getElementById("tests"));
  </script>
```

- [ ] **Step 4: Lancer les tests et vérifier l'échec**

Run: ouvrir `./tests/run.html` (serveur HTTP). Expected : les nouveaux tests FAIL — `core/scoring.js` et `core/difficulty.js` introuvables.

- [ ] **Step 5: Implémenter `js/core/scoring.js`**

```js
const RULES = {
  span: {
    extractScore: (raw) => raw.maxSpan,
    higherIsBetter: true,
  },
};

export function normalize(gameId, raw) {
  const rule = RULES[gameId];
  if (!rule) throw new Error(`Unknown game: ${gameId}`);
  return { score: rule.extractScore(raw), higherIsBetter: rule.higherIsBetter };
}

export function hasRule(gameId) {
  return Boolean(RULES[gameId]);
}
```

- [ ] **Step 6: Implémenter `js/core/difficulty.js`**

```js
const RULES = {
  span: {
    isSuccess: (score, level) => score >= level,
  },
};

const MIN_LEVEL = 1;
const MIN_SAMPLES = 2;
const WINDOW = 3;
const UP_THRESHOLD = 0.8;
const DOWN_THRESHOLD = 0.5;

export function successRate(gameId, currentLevel, recentScores) {
  const rule = RULES[gameId];
  if (!rule) throw new Error(`Unknown game: ${gameId}`);
  const window = recentScores.slice(-WINDOW);
  if (window.length < MIN_SAMPLES) return null;
  const successes = window.filter((s) => rule.isSuccess(s, currentLevel)).length;
  return successes / window.length;
}

export function nextLevel(gameId, currentLevel, recentScores) {
  const rate = successRate(gameId, currentLevel, recentScores);
  if (rate === null) return currentLevel;

  if (rate >= UP_THRESHOLD) return currentLevel + 1;
  if (rate <= DOWN_THRESHOLD) return Math.max(MIN_LEVEL, currentLevel - 1);
  return currentLevel;
}
```

- [ ] **Step 7: Lancer les tests et vérifier le vert**

Run: `./tests/run.html`. Expected : `16 réussis, 0 échoués` (8 storage + 3 scoring + 5 difficulty).

- [ ] **Step 8: Commit**

```bash
git add js/core/ tests/
git commit -m "feat: scoring et difficulté (span) + tests"
```

---

### Task 2: Vue Historique réelle

**Files:**
- Modify: `js/views/history.js`

**Interfaces:**
- Consumes: `storage.getHistory()`, `games/index.js` (`getGame`).
- Produces: `render(container)` affichant les parties groupées par jour.

- [ ] **Step 1: Réécrire `js/views/history.js`**

```js
import { getHistory } from "../storage/local.js";
import { getGame } from "../games/index.js";

export const meta = { title: "Historique", nav: true };

function formatDay(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function render(container) {
  const history = getHistory();

  if (history.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.textContent = "Aucune partie pour l'instant. Jouez pour voir votre progression ici.";
    container.appendChild(empty);
    return;
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  let currentDay = null;
  for (const entry of sorted) {
    const day = formatDay(entry.date);
    if (day !== currentDay) {
      currentDay = day;
      const heading = document.createElement("h2");
      heading.className = "history-day";
      heading.textContent = day;
      container.appendChild(heading);
    }

    const game = getGame(entry.game);
    const card = document.createElement("div");
    card.className = "card history-entry";
    const name = game ? game.name : entry.game;
    const unit = game ? game.unit : "";
    card.textContent = `${formatTime(entry.date)} · ${name} · Niveau ${entry.level} · ${entry.score}${unit}`;
    container.appendChild(card);
  }
}
```

- [ ] **Step 2: Ajouter les styles dans `css/games.css`**

```css
.history-day {
  font-size: 0.95rem;
  color: var(--text-dim);
  text-transform: capitalize;
  margin: 20px 0 8px;
}

.history-entry {
  padding: 12px var(--gap);
  margin-bottom: 8px;
  font-size: 0.95rem;
}
```

- [ ] **Step 3: Vérifier**

Run: serveur HTTP, ouvrir l'app, onglet Historique. Expected : « Aucune partie pour l'instant… » (aucune donnée). Pas d'erreur console.

- [ ] **Step 4: Commit**

```bash
git add js/views/history.js css/games.css
git commit -m "feat: vue historique réelle"
```

---

### Task 3: (annulée) Intégration jsPsych

**Décision d'implémentation :** jsPsych 8 sans build n'apporte pas de bénéfice pour un jeu
à rendu entièrement custom. Le span est implémenté en JavaScript natif. Cette tâche est
**annulée** ; passer directement à Task 4.

**Rationale :** voir `docs/superpowers/specs/2026-09-14-palier-c-span-design.md` §7.
Aucun fichier créé. Si jsPsych est introduit plus tard (Palier D), il le sera via un CDN
figé et des plugins officiels.

---

### Task 4: Plugin maison grille 3×3

**Files:**
- Create: `js/games/span-grid.js`
- Modify: `css/games.css`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `SpanGrid.mount(container)` → crée la grille 3×3, renvoie un handle `{ setActive(index), clear(), highlight(index), cellIndexFromEvent(evt) }`.
  - `SpanGrid.randomSequence(length, { maxLength })` → tableau d'index 0–8, sans répétition consécutive.
  - `GRID_SIZE = 9`.

- [ ] **Step 1: Écrire `js/games/span-grid.js`**

```js
export const GRID_SIZE = 9;

export function randomSequence(length, { maxLength = 12 } = {}) {
  const n = Math.min(length, maxLength);
  const seq = [];
  for (let i = 0; i < n; i++) {
    let cell;
    do {
      cell = Math.floor(Math.random() * GRID_SIZE);
    } while (seq.length > 0 && cell === seq[seq.length - 1]);
    seq.push(cell);
  }
  return seq;
}

export function mount(container) {
  const grid = document.createElement("div");
  grid.className = "span-grid";

  const cells = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "span-cell";
    cell.dataset.index = String(i);
    grid.appendChild(cell);
    cells.push(cell);
  }

  container.appendChild(grid);

  return {
    element: grid,
    cells,
    setActive(index) {
      cells[index].classList.add("is-active");
    },
    clear() {
      for (const cell of cells) cell.classList.remove("is-active", "is-highlight");
    },
    highlight(index) {
      cells[index].classList.add("is-highlight");
    },
    cellIndexFromEvent(event) {
      const target = event.target.closest(".span-cell");
      if (!target) return -1;
      return Number(target.dataset.index);
    },
  };
}
```

- [ ] **Step 2: Ajouter les styles de grille dans `css/games.css`**

```css
.span-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: min(80vw, 340px);
  margin: 0 auto;
}

.span-cell {
  aspect-ratio: 1;
  border-radius: var(--radius);
  background: var(--surface-2);
  border: 2px solid transparent;
  transition: background 120ms ease, border-color 120ms ease;
}

.span-cell.is-active {
  background: var(--accent);
}

.span-cell.is-highlight {
  border-color: var(--accent);
}

.span-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.span-actions button {
  flex: 1;
  max-width: 200px;
  background: var(--accent);
  color: var(--accent-text);
}

.span-instruction {
  text-align: center;
  color: var(--text-dim);
  margin: 0 0 16px;
}
```

- [ ] **Step 3: Vérifier (test visuel manuel)**

Run: serveur HTTP. Ajouter temporairement dans la console :

```js
import('./js/games/span-grid.js').then(m => { const g = m.mount(document.getElementById('app')); g.setActive(4); });
```

Expected : grille 3×3, case centrale allumée en couleur d'accent. Retirer le test visuel ensuite.

- [ ] **Step 4: Commit**

```bash
git add js/games/span-grid.js css/games.css
git commit -m "feat: grille 3x3 du span et styles"
```

---

### Task 5: Module de jeu Span

**Files:**
- Create: `js/games/span.js`

**Interfaces:**
- Consumes: `span-grid.js` (`mount`, `randomSequence`).
- Produces: `span.prepare(level, { container, onFinish })` qui joue la partie et appelle `onFinish(raw)` avec `raw = { startLevel, maxSpan, trials, results, correctCount, total }`.

- [ ] **Step 1: Écrire `js/games/span.js`**

```js
import { mount, randomSequence } from "./span-grid.js";

const SHOW_DURATION = 600;
const GAP_DURATION = 250;
const READY_DURATION = 800;
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
      const answer = await new Promise((resolve) => {
        const picks = [];
        validate.disabled = false;

        function onClick(event) {
          const index = grid.cellIndexFromEvent(event);
          if (index < 0) return;
          picks.push(index);
          grid.highlight(index);
          setTimeout(() => grid.clear(), 150);
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
      await wait(700);
    }

    const raw = {
      startLevel,
      maxSpan,
      trials,
      results,
      correctCount: results.filter(Boolean).length,
      total: results.length,
    };
    onFinish(raw);
  } catch (err) {
    console.error("Span game error", err);
    onFinish({
      startLevel,
      maxSpan,
      trials,
      results,
      correctCount: 0,
      total: trials.length,
      error: String(err && err.message ? err.message : err),
    });
  }

  return () => {
    grid.clear();
  };
}
```

- [ ] **Step 2: Vérifier la syntaxe**

Run: `node --check js/games/span.js`. Expected : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add js/games/span.js
git commit -m "feat: module de jeu span"
```

---

### Task 6: Brancher le jeu dans la vue `game.js` (partie → score → difficulté → stockage → résultat)

**Files:**
- Modify: `js/views/game.js`
- Modify: `js/games/index.js` (ajouter un champ `module` n'est pas nécessaire ; importer directement)

**Interfaces:**
- Consumes: `span.prepare`, `scoring.normalize`, `difficulty.nextLevel`, `storage.*`, `getGame`.
- Produces: `render(container, params)` qui joue `params.id` et affiche l'écran de résultat.

- [ ] **Step 1: Réécrire `js/views/game.js`**

```js
import { getGame } from "../games/index.js";
import * as span from "../games/span.js";
import { normalize } from "../core/scoring.js";
import { nextLevel } from "../core/difficulty.js";
import {
  getGames,
  saveGames,
  getHistory,
  addHistoryEntry,
  makeId,
} from "../storage/local.js";

export const meta = { title: "Jeu", nav: false, hideHeader: true };

const MODULES = { span };

export function render(container, params = {}) {
  const game = getGame(params.id);
  const mod = MODULES[params.id];

  if (!game || !mod) {
    container.textContent = "Jeu inconnu.";
    return;
  }

  const progress = getGames();
  const state = progress[game.id] || { level: 1, attempts: 0, bestScore: null };
  const level = state.level;
  const startedAt = Date.now();

  mod.prepare(level, {
    container,
    onFinish(raw) {
      const { score } = normalize(game.id, raw);
      const durationMs = Date.now() - startedAt;

      addHistoryEntry({
        id: makeId(),
        game: game.id,
        date: new Date().toISOString(),
        level,
        score,
        raw,
        durationMs,
      });

      const history = getHistory();
      const recent = history
        .filter((h) => h.game === game.id)
        .map((h) => h.score);
      const newLevel = nextLevel(game.id, level, recent);

      const best =
        state.bestScore == null ||
        (game.higherIsBetter ? score > state.bestScore : score < state.bestScore);
      const bestScore = best ? score : state.bestScore;

      const updated = {
        ...progress,
        [game.id]: { level: newLevel, attempts: state.attempts + 1, bestScore },
      };
      saveGames(updated);

      showResult(container, { game, score, best, bestScore, newLevel, params });
    },
  });
}

function showResult(container, { game, score, best, bestScore, newLevel, params }) {
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card result-card";

  const title = document.createElement("h2");
  title.textContent = best ? "Nouveau record !" : "Bien joué";

  const value = document.createElement("p");
  value.className = "result-value";
  value.textContent = `${score}${game.unit}`;

  const record = document.createElement("p");
  record.className = "game-card__meta";
  record.textContent = `Record : ${bestScore}${game.unit}`;

  const next = document.createElement("p");
  next.className = "game-card__meta";
  next.textContent = `Prochain niveau : ${newLevel}`;

  const actions = document.createElement("div");
  actions.className = "span-actions";

  const replay = document.createElement("button");
  replay.type = "button";
  replay.textContent = "Rejouer";
  replay.addEventListener("click", () => params.navigate("game", { id: game.id }));

  const home = document.createElement("button");
  home.type = "button";
  home.textContent = "Accueil";
  home.addEventListener("click", () => params.navigate("home"));

  actions.append(replay, home);
  card.append(title, value, record, next, actions);
  container.appendChild(card);
}
```

- [ ] **Step 2: Ajouter les styles du résultat dans `css/games.css`**

```css
.result-card {
  text-align: center;
  padding: 32px var(--gap);
}

.result-card h2 {
  margin: 0 0 8px;
  color: var(--accent);
}

.result-value {
  font-size: 3rem;
  font-weight: 700;
  margin: 8px 0 16px;
}
```

- [ ] **Step 3: Vérifier la syntaxe**

Run: `node --check js/views/game.js`. Expected : aucune erreur.

- [ ] **Step 4: Vérifier de bout en bout (manuel, navigateur)**

Run: serveur HTTP, ouvrir l'app. Cliquer sur Span de mémoire. Expected : partie jouable (séquence s'allume, rappel cliquable, validation, feedback). Après la partie : écran de résultat avec score, record, prochain niveau. Puis Historique montre la partie, et Accueil montre le niveau mis à jour.

- [ ] **Step 5: Commit**

```bash
git add js/views/game.js css/games.css
git commit -m "feat: branchement de la partie span (score, difficulté, historique)"
```

---

### Task 7: Intégration PWA, tests finaux et vérification

**Files:**
- Modify: `js/app.js` (le module span doit être dans le cache SW — déjà couvert par APP_SHELL ? vérifier)
- Modify: `sw.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: tout le palier.
- Produces: cache SW à jour, recette étendue.

- [ ] **Step 1: Ajouter les nouveaux modules à `APP_SHELL` dans `sw.js`**

Ajouter :

```
  "./js/core/scoring.js",
  "./js/core/difficulty.js",
  "./js/games/span.js",
  "./js/games/span-grid.js",
```

Incrémenter `CACHE_VERSION` (`v2` → `v3`).

- [ ] **Step 2: Vérifier que tous les fichiers APP_SHELL existent**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('sw.js','utf8');const m=s.match(/const APP_SHELL = \[([\s\S]*?)\];/);const f=[...m[1].matchAll(/\"(\.\/[^\"]*)\"/g)].map(x=>x[1]);let miss=0;for(const x of f){if(x==='./')continue;if(!fs.existsSync(x.replace(/^\.\//,''))){console.log('MANQUANT',x);miss++;}}console.log('manquants',miss);process.exit(miss?1:0)"
```

Expected : `manquants 0`.

- [ ] **Step 3: Lancer les tests unitaires (navigateur)**

Run: `./tests/run.html`. Expected : `16 réussis, 0 échoués`.

- [ ] **Step 4: Mettre à jour la recette du README**

Ajouter à la section Recette :

```markdown
### Palier C — Span de mémoire

- [ ] L'accueil ouvre le jeu Span.
- [ ] La séquence s'allume case par case, puis la grille devient cliquable.
- [ ] Valider une séquence complète donne un feedback.
- [ ] La partie s'arrête au premier échec.
- [ ] L'écran de résultat affiche score, record et prochain niveau.
- [ ] L'Historique montre la partie jouée.
- [ ] L'accueil affiche un niveau mis à jour.
- [ ] `tests/run.html` affiche 16 réussis, 0 échoués.
```

- [ ] **Step 5: Commit**

```bash
git add sw.js js/app.js README.md
git commit -m "chore: cache PWA et recette palier C"
```

---

## Self-Review

**Spec coverage :**
- §2 interface des jeux (`prepare`) → Tasks 5, 6.
- §3 déroulement (600/250/800 ms, ordre aléatoire, validateur, feedback, escalade, plafond 12) → Tasks 4, 5.
- §4 scoring + difficulté (seuils discrets) → Task 1.
- §5 données enregistrées (history + games) → Task 6.
- §6 vues Jeu + Historique → Tasks 2, 6.
- §7 jsPsych CDN figé + plugin maison → Tasks 3, 4.
- §8 tests → Tasks 1, 7.

**Placeholder scan :** aucun TBD/TODO ; chaque step contient le code réel.

**Type consistency :**
- `prepare(level, { container, onFinish })` identique Tasks 5 et 6.
- `normalize(gameId, raw)` et `nextLevel(gameId, currentLevel, recentScores)` identiques Tasks 1, 6.
- `mount`/`randomSequence`/`GRID_SIZE` cohérents Tasks 4, 5.
- `raw` a les clés `startLevel/maxSpan/trials/results/correctCount/total` Tasks 5, 6.
