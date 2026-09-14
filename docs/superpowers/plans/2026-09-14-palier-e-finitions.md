# neurminator — Palier E : Finitions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réglages fonctionnels (thème, son, effacer historique), encart iOS, historique avec tendance et sparkline SVG, logique d'agrégation testée.

**Architecture:** `core/history.js` contient l'agrégation pure (testée). `views/settings.js` et `views/history.js` consomment. `app.js` applique le thème. Son via WebAudio.

**Tech Stack:** JS natif, modules ES, localStorage, WebAudio, SVG inline. Sans build.

**Spec:** `docs/superpowers/specs/2026-09-14-palier-e-finitions-design.md`

## Global Constraints

- **Code en anglais**, interface en français. Chemins relatifs. Sans build.
- Thème via `data-theme` sur `<html>` ; sombre = défaut (pas d'attribut).
- `higherIsBetter` vient de `games/index.js`.
- Clés localStorage inchangées.

---

### Task E1: Agrégation historique + tests (TDD)

**Files:**
- Create: `js/core/history.js`
- Create: `tests/history.test.js`
- Modify: `tests/run.html`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `groupByDay(history)` → `[{ day, label, entries }]`.
  - `seriesForGame(history, gameId)` → `number[]` (ancien → récent).
  - `trendForGame(history, gameId, higherIsBetter)` → `"up" | "down" | "flat" | null`.

- [ ] **Step 1: Écrire `tests/history.test.js` (failing)**

```js
import { assertEqual } from "./harness.js";
import * as history from "../js/core/history.js";

const mk = (game, score, date) => ({ game, score, date });

export function register({ suite, test }) {
  suite("history: groupByDay", () => {
    test("groupe par jour, plus récent d'abord", () => {
      const h = [
        mk("span", 3, "2026-09-13T10:00:00Z"),
        mk("span", 4, "2026-09-14T09:00:00Z"),
        mk("span", 5, "2026-09-14T11:00:00Z"),
      ];
      const g = history.groupByDay(h);
      assertEqual(g.length, 2);
      assertEqual(g[0].day, "2026-09-14");
      assertEqual(g[0].entries.length, 2);
      assertEqual(g[0].entries[0].score, 5);
      assertEqual(g[1].day, "2026-09-13");
    });

    test("historique vide", () => {
      assertEqual(history.groupByDay([]), []);
    });
  });

  suite("history: seriesForGame", () => {
    test("scores du jeu, ancien → récent", () => {
      const h = [
        mk("span", 3, "2026-09-14T08:00:00Z"),
        mk("nback", 0.5, "2026-09-14T09:00:00Z"),
        mk("span", 4, "2026-09-14T10:00:00Z"),
      ];
      assertEqual(history.seriesForGame(h, "span"), [3, 4]);
      assertEqual(history.seriesForGame(h, "nback"), [0.5]);
    });
  });

  suite("history: trendForGame", () => {
    const make6 = (scores) =>
      scores.map((s, i) => mk("span", s, `2026-09-14T0${i}:00:00Z`));

    test("moins de 6 parties → null", () => {
      assertEqual(history.trendForGame(make6([3, 3, 3]), "span", true), null);
    });

    test("progression → up", () => {
      const h = make6([1, 1, 1, 5, 5, 5]);
      assertEqual(history.trendForGame(h, "span", true), "up");
    });

    test("régression → down", () => {
      const h = make6([5, 5, 5, 1, 1, 1]);
      assertEqual(history.trendForGame(h, "span", true), "down");
    });

    test("stable → flat", () => {
      const h = make6([3, 3, 3, 3, 3, 3]);
      assertEqual(history.trendForGame(h, "span", true), "flat");
    });

    test("reaction (plus bas mieux) : temps qui baissent → up", () => {
      const h = make6([500, 500, 500, 300, 300, 300]);
      assertEqual(history.trendForGame(h, "reaction", false), "up");
    });
  });
}
```

- [ ] **Step 2: Ajouter au runner `tests/run.html`**

```html
    import { register as registerHistory } from "./history.test.js";
```

et après `registerDifficulty(runner);` :

```js
    registerHistory(runner);
```

- [ ] **Step 3: Lancer les tests, vérifier l'échec**

Run: `tests/run.html`. Expected : FAIL (`core/history.js` introuvable).

- [ ] **Step 4: Implémenter `js/core/history.js`**

```js
export function groupByDay(history) {
  if (!history.length) return [];
  const sorted = [...history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const groups = new Map();
  for (const entry of sorted) {
    const day = entry.date.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(entry);
  }
  return [...groups.entries()].map(([day, entries]) => ({
    day,
    label: new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    entries,
  }));
}

export function seriesForGame(history, gameId) {
  return history
    .filter((h) => h.game === gameId)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((h) => h.score);
}

function average(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function trendForGame(history, gameId, higherIsBetter) {
  const series = seriesForGame(history, gameId);
  if (series.length < 6) return null;

  const recent = series.slice(-3);
  const previous = series.slice(-6, -3);
  const delta = average(recent) - average(previous);
  const tolerance = Math.abs(average(previous)) * 0.05 || 0.001;

  if (Math.abs(delta) <= tolerance) return "flat";
  const improving = higherIsBetter ? delta > 0 : delta < 0;
  return improving ? "up" : "down";
}
```

- [ ] **Step 5: Lancer les tests, vérifier le vert**

Run: `tests/run.html`. Expected : tous verts.

- [ ] **Step 6: Commit**

```bash
git add js/core/history.js tests/
git commit -m "feat: agrégation de l'historique + tests"
```

---

### Task E2: Application du thème dans `app.js`

**Files:**
- Modify: `js/app.js`
- Create: `js/theme.js`

**Interfaces:**
- Consumes: `storage.getSettings`, `storage.saveSettings`.
- Produces: `theme.applyTheme(theme)`, `theme.resolveTheme(theme)` → `"light" | "dark"`, `theme.init()`.

- [ ] **Step 1: Créer `js/theme.js`**

```js
import { getSettings, saveSettings } from "./storage/local.js";

export function resolveTheme(theme) {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  if (resolved === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function init() {
  const settings = getSettings();
  applyTheme(settings.theme);
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    const current = getSettings();
    if (current.theme === "auto") applyTheme("auto");
  });
}

export function setTheme(theme) {
  const settings = getSettings();
  settings.theme = theme;
  saveSettings(settings);
  applyTheme(theme);
}
```

- [ ] **Step 2: Appeler `theme.init()` dans `app.js`**

Ajouter l'import et l'appel :

```js
import * as theme from "./theme.js";
// … après router.start();
theme.init();
```

- [ ] **Step 3: Vérifier**

Run: serveur HTTP. Console : `import('./js/theme.js').then(m=>console.log(m.resolveTheme('auto'), m.resolveTheme('light')))`. Expected : deux valeurs cohérentes, aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add js/theme.js js/app.js
git commit -m "feat: application du thème (auto/clair/sombre)"
```

---

### Task E3: Réglages — thème, son, effacer, encart iOS

**Files:**
- Create: `js/sound.js`
- Modify: `js/views/settings.js`
- Modify: `css/layout.css`

**Interfaces:**
- Consumes: `storage.getSettings`, `saveSettings`, `clearHistory`, `saveGames`, `theme.setTheme`.
- Produces:
  - `sound.playBeep(enabled)` — bip court si `enabled`.
  - `render(container)` des Réglages.

- [ ] **Step 1: Créer `js/sound.js`**

```js
let context = null;

export function playBeep(enabled) {
  if (!enabled) return;
  try {
    context = context || new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.12);
  } catch (err) {
    console.warn("Sound failed", err);
  }
}
```

- [ ] **Step 2: Réécrire `js/views/settings.js`**

```js
import {
  getSettings,
  saveSettings,
  clearHistory,
  saveGames,
} from "../storage/local.js";
import { setTheme } from "../theme.js";

export const meta = { title: "Réglages", nav: true };

function card() {
  const el = document.createElement("div");
  el.className = "card settings-card";
  return el;
}

export function render(container) {
  const settings = getSettings();

  const themeCard = card();
  const themeTitle = document.createElement("p");
  themeTitle.className = "settings-title";
  themeTitle.textContent = "Thème";
  themeCard.appendChild(themeTitle);

  const themeOptions = document.createElement("div");
  themeOptions.className = "settings-options";
  for (const value of ["auto", "light", "dark"]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = value === "auto" ? "Auto" : value === "light" ? "Clair" : "Sombre";
    btn.setAttribute("aria-pressed", settings.theme === value ? "true" : "false");
    btn.addEventListener("click", () => {
      setTheme(value);
      render(container);
    });
    themeOptions.appendChild(btn);
  }
  themeCard.appendChild(themeOptions);
  container.appendChild(themeCard);

  const soundCard = card();
  const soundLabel = document.createElement("label");
  soundLabel.className = "settings-row";
  const soundText = document.createElement("span");
  soundText.textContent = "Son en fin de partie";
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = settings.soundEnabled;
  toggle.addEventListener("change", () => {
    const s = getSettings();
    s.soundEnabled = toggle.checked;
    saveSettings(s);
  });
  soundLabel.append(soundText, toggle);
  soundCard.appendChild(soundLabel);
  container.appendChild(soundCard);

  const clearCard = card();
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "danger";
  clearBtn.textContent = "Effacer l'historique";
  clearBtn.addEventListener("click", () => {
    if (!confirm("Effacer tout l'historique et remettre les niveaux à 1 ?")) return;
    clearHistory();
    saveGames({});
    render(container);
  });
  clearCard.appendChild(clearBtn);
  container.appendChild(clearCard);

  const iosCard = card();
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Installer sur l'écran d'accueil (iOS)";
  const steps = document.createElement("p");
  steps.className = "settings-help";
  steps.textContent =
    "Sur iPhone/iPad : ouvrez cette page dans Safari, touchez le bouton Partager, puis « Sur l'écran d'accueil ». Sur Android, une bannière d'installation apparaît automatiquement.";
  details.append(summary, steps);
  iosCard.appendChild(details);
  container.appendChild(iosCard);
}
```

- [ ] **Step 3: Ajouter les styles dans `css/layout.css`**

```css
.settings-card { margin-bottom: var(--gap); }
.settings-title { margin: 0 0 12px; color: var(--text-dim); font-size: 0.9rem; }
.settings-options { display: flex; gap: 8px; }
.settings-options button[aria-pressed="true"] {
  background: var(--accent);
  color: var(--accent-text);
}
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.settings-help { color: var(--text-dim); font-size: 0.9rem; margin: 8px 0 0; }
button.danger { background: var(--danger); color: #fff; }
```

- [ ] **Step 4: Vérifier**

Run: serveur HTTP, ouvrir Réglages. Expected : sélecteur de thème (le clic change l'apparence et persiste), interrupteur son, bouton effacer (confirmation), encart iOS dépliable.

- [ ] **Step 5: Commit**

```bash
git add js/sound.js js/views/settings.js css/layout.css
git commit -m "feat: réglages fonctionnels et encart iOS"
```

---

### Task E4: Son en fin de partie

**Files:**
- Modify: `js/views/game.js`

**Interfaces:**
- Consumes: `sound.playBeep`, `storage.getSettings`.

- [ ] **Step 1: Jouer le bip à la fin d'une partie**

Dans `js/views/game.js`, ajouter les imports :

```js
import { playBeep } from "../sound.js";
import { getSettings } from "../storage/local.js";
```

et dans `onFinish`, après `showResult(...)` :

```js
      playBeep(getSettings().soundEnabled);
```

- [ ] **Step 2: Vérifier la syntaxe**

Run: `node --check js/views/game.js`. Expected : OK.

- [ ] **Step 3: Commit**

```bash
git add js/views/game.js
git commit -m "feat: bip de fin de partie (si son activé)"
```

---

### Task E5: Historique enrichi (tendance + sparkline)

**Files:**
- Modify: `js/views/history.js`
- Modify: `css/games.css`

**Interfaces:**
- Consumes: `core/history.js`, `games/index.js`, `storage.getHistory`.
- Produces: rendu enrichi.

- [ ] **Step 1: Écrire le générateur de sparkline et enrichir `js/views/history.js`**

```js
import { getHistory } from "../storage/local.js";
import { GAMES, getGame } from "../games/index.js";
import { groupByDay, seriesForGame, trendForGame } from "../core/history.js";

export const meta = { title: "Historique", nav: true };

const TREND_ARROW = { up: "↑", down: "↓", flat: "→" };
const TREND_LABEL = { up: "progression", down: "baisse", flat: "stable" };

function sparkline(scores, higherIsBetter) {
  const width = 120;
  const height = 32;
  const values = scores.slice(-15);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const norm = (v - min) / range;
      const y = higherIsBetter ? height - norm * height : norm * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "sparkline");
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.setAttribute("points", points);
  poly.setAttribute("fill", "none");
  poly.setAttribute("stroke", "var(--accent)");
  poly.setAttribute("stroke-width", "2");
  svg.appendChild(poly);
  return svg;
}

function gameSummary(history, game) {
  const series = seriesForGame(history, game.id);
  if (!series.length) return null;

  const card = document.createElement("div");
  card.className = "card summary-card";

  const header = document.createElement("div");
  header.className = "summary-header";
  const name = document.createElement("span");
  name.className = "summary-name";
  name.textContent = game.name;
  const count = document.createElement("span");
  count.className = "game-card__meta";
  count.textContent = `${series.length} partie(s)`;
  header.append(name, count);

  const trend = trendForGame(history, game.id, game.higherIsBetter);
  const values = document.createElement("p");
  values.className = "game-card__meta";
  if (trend) {
    values.textContent = `${TREND_ARROW[trend]} ${TREND_LABEL[trend]}`;
  } else {
    values.textContent = "tendance : assez de données bientôt";
  }

  card.append(header, values);
  const line = sparkline(series, game.higherIsBetter);
  if (line) card.appendChild(line);
  return card;
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

  for (const game of GAMES) {
    const summary = gameSummary(history, game);
    if (summary) container.appendChild(summary);
  }

  for (const group of groupByDay(history)) {
    const heading = document.createElement("h2");
    heading.className = "history-day";
    heading.textContent = group.label;
    container.appendChild(heading);

    for (const entry of group.entries) {
      const game = getGame(entry.game);
      const card = document.createElement("div");
      card.className = "card history-entry";
      const name = game ? game.name : entry.game;
      const unit = game ? game.unit : "";
      const time = new Date(entry.date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      card.textContent = `${time} · ${name} · Niveau ${entry.level} · ${entry.score}${unit}`;
      container.appendChild(card);
    }
  }
}
```

- [ ] **Step 2: Ajouter les styles dans `css/games.css`**

```css
.summary-card { margin-bottom: 12px; }
.summary-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.summary-name { font-weight: 700; }
.sparkline { display: block; width: 100%; height: 40px; margin-top: 8px; }
```

- [ ] **Step 3: Vérifier**

Run: serveur HTTP. Après quelques parties, l'Historique montre une carte par jeu avec tendance et sparkline. Expected : pas d'erreur console.

- [ ] **Step 4: Commit**

```bash
git add js/views/history.js css/games.css
git commit -m "feat: historique enrichi (tendance + sparkline)"
```

---

### Task E6: Cache PWA, tests finaux, recette

**Files:**
- Modify: `sw.js`
- Modify: `README.md`

- [ ] **Step 1: Ajouter les nouveaux fichiers à `APP_SHELL`**

Ajouter `"./js/core/history.js"`, `"./js/theme.js"`, `"./js/sound.js"` et incrémenter
`CACHE_VERSION` (`v4` → `v5`).

- [ ] **Step 2: Vérifier les fichiers APP_SHELL**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('sw.js','utf8');const m=s.match(/const APP_SHELL = \[([\s\S]*?)\];/);const f=[...m[1].matchAll(/\"(\.\/[^\"]*)\"/g)].map(x=>x[1]);let miss=0;for(const x of f){if(x==='./')continue;if(!fs.existsSync(x.replace(/^\.\//,''))){console.log('MANQUANT',x);miss++;}}console.log('manquants',miss);process.exit(miss?1:0)"
```

Expected : `manquants 0`.

- [ ] **Step 3: Lancer les tests unitaires**

Run: `tests/run.html`. Expected : tous verts.

- [ ] **Step 4: Recette README**

```markdown
### Palier E — Finitions

- [ ] Réglages : le thème auto/clair/sombre s'applique et persiste.
- [ ] L'interrupteur de son persiste.
- [ ] « Effacer l'historique » demande confirmation et remet les niveaux à 1.
- [ ] L'encart iOS est présent.
- [ ] L'Historique montre la tendance par jeu et une sparkline.
- [ ] `tests/run.html` affiche tous les tests verts.
```

- [ ] **Step 5: Commit**

```bash
git add sw.js README.md
git commit -m "chore: cache PWA et recette palier E"
```

---

## Self-Review

**Spec coverage :**
- §2 réglages (thème, son, effacer) → E2, E3, E4.
- §3 encart iOS → E3.
- §4 historique (groupByDay, seriesForGame, trendForGame, sparkline) → E1, E5.
- §5 application thème → E2.
- §6 tests → E1.

**Placeholder scan :** aucun TBD/TODO ; code réel.

**Type consistency :**
- `trendForGame(history, gameId, higherIsBetter)` identique E1 et E5.
- `groupByDay`, `seriesForGame` identiques E1 et E5.
- `setTheme`, `applyTheme`, `init`, `resolveTheme` cohérents E2 et E3.
