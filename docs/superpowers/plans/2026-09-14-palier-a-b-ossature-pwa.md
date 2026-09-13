# neurminator — Palier A+B : Ossature, design, PWA installable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer une PWA installable "neurminator" : navigation entre écrans (accueil, jeu, historique, réglages), design mobile d'abord, stockage localStorage testé, déployable sur GitHub Pages et fonctionnelle hors-ligne (avec un jeu factice).

**Architecture:** Application statique mono-page sans build. Un `index.html` charge des modules ES natifs. Un routeur maison échange les vues. La logique pure (`core/`, `storage/`) est isolée et testée via `tests/run.html`. Le service worker met en cache l'app shell (cache-first) et le HTML (network-first) avec un `CACHE_VERSION`.

**Tech Stack:** HTML5, CSS3 (variables CSS), JavaScript ES modules natifs, localStorage, Service Worker, Web App Manifest. Aucune dépendance npm. jsPsych n'est **pas** inclus à ce palier (arrive au Palier C).

**Spec:** `docs/superpowers/specs/2026-09-14-neurminator-design.md`

## Global Constraints

- **Code en anglais** (variables, fonctions, noms de fichiers). **Interface en français.**
- **Chemins relatifs uniquement** (`./css/...`), jamais absolus — contrainte GitHub Pages en sous-répertoire.
- **Aucun build, aucune dépendance npm.** Modules ES natifs (`<script type="module">`).
- **`sw.js` à la racine du repo.**
- **Clés localStorage** : `cog.settings`, `cog.games`, `cog.history`.
- **`version` de settings = 1.**
- **Identifiants de jeu** : `nback`, `span`, `stroop`, `reaction`.
- **Score** : plus haut = mieux pour `nback`, `span`, `stroop` ; plus bas = mieux pour `reaction`.
- **Zones tactiles ≥ 48 px.**
- **Icônes** : SVG simples fournis, à remplacer par l'utilisateur.
- **Nom de l'app** : `neurminator`.

---

### Task 1: Ossature de fichiers et page d'entrée

**Files:**
- Create: `index.html`
- Create: `css/base.css`
- Create: `css/layout.css`
- Create: `css/games.css`
- Create: `README.md`

**Interfaces:**
- Consumes: rien.
- Produces: `index.html` contenant un conteneur `#app`, un en-tête `#app-header` avec un titre et une zone de navigation `#app-nav`, et `<script type="module" src="./js/app.js">`. Les trois feuilles CSS sont liées.

- [ ] **Step 1: Créer `index.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#14161a">
  <title>neurminator</title>
  <link rel="manifest" href="./manifest.json">
  <link rel="icon" href="./icons/icon-192.png">
  <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
  <link rel="stylesheet" href="./css/base.css">
  <link rel="stylesheet" href="./css/layout.css">
  <link rel="stylesheet" href="./css/games.css">
</head>
<body>
  <header id="app-header">
    <h1 id="app-title">neurminator</h1>
    <nav id="app-nav"></nav>
  </header>
  <main id="app" aria-live="polite"></main>
  <script type="module" src="./js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Créer `css/base.css`**

```css
:root {
  --bg: #14161a;
  --surface: #1e2128;
  --surface-2: #282c35;
  --text: #eceff4;
  --text-dim: #9aa3b2;
  --accent: #4f8cff;
  --accent-text: #ffffff;
  --danger: #ff5c5c;
  --radius: 14px;
  --gap: 16px;
  --tap: 48px;
}

[data-theme="light"] {
  --bg: #f5f6f8;
  --surface: #ffffff;
  --surface-2: #eceef2;
  --text: #14161a;
  --text-dim: #5b6472;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior-y: none;
}

button {
  font: inherit;
  color: inherit;
  min-height: var(--tap);
  min-width: var(--tap);
  border: none;
  border-radius: var(--radius);
  background: var(--surface-2);
  cursor: pointer;
}

a { color: var(--accent); }
```

- [ ] **Step 3: Créer `css/layout.css`**

```css
#app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap);
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 10;
}

#app-title { font-size: 1.1rem; margin: 0; }

#app-nav { display: flex; gap: 8px; }

#app-nav button {
  background: transparent;
  color: var(--text-dim);
  padding: 0 12px;
}

#app-nav button[aria-current="page"] {
  color: var(--accent);
  background: var(--surface-2);
}

#app {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--gap);
  padding-bottom: calc(var(--gap) + env(safe-area-inset-bottom));
}

body.playing #app-header { display: none; }

.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: var(--gap);
}
```

- [ ] **Step 4: Créer `css/games.css`**

```css
.game-card {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--gap);
  margin-bottom: var(--gap);
  background: var(--surface);
}

.game-card__name { font-size: 1.15rem; margin: 0 0 4px; }
.game-card__meta { color: var(--text-dim); font-size: 0.9rem; }

.stimulus {
  min-height: 45vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.spacer { height: 32vh; }
```

- [ ] **Step 5: Créer `README.md`**

```markdown
# neurminator

PWA d'entraînement cognitif — usage local, hébergée sur GitHub Pages.

## Lancer en local

Le service worker exige HTTP ou HTTPS (pas `file://`) :

```
python -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Tests

Ouvrir `./tests/run.html` dans le navigateur.

## Déployer

Pousser sur la branche `main` du dépôt GitHub, activer GitHub Pages
(Settings → Pages → Source : branche `main`, dossier `/`).
```

- [ ] **Step 6: Vérifier l'affichage**

Ouvrir `index.html` via `python -m http.server 8000`. Expected : page sombre avec l'en-tête "neurminator", aucune erreur de chargement CSS. Le `<main>` est vide (app.js n'existe pas encore → erreur 404 attendue dans la console pour `js/app.js`).

- [ ] **Step 7: Commit**

```bash
git add index.html css/ README.md
git commit -m "feat: ossature HTML et styles de base"
```

---

### Task 2: Routeur et application

**Files:**
- Create: `js/router.js`
- Create: `js/app.js`
- Create: `js/views/home.js`
- Create: `js/views/game.js`
- Create: `js/views/history.js`
- Create: `js/views/settings.js`

**Interfaces:**
- Consumes: conteneurs `#app`, `#app-nav` de Task 1.
- Produces:
  - `createRouter({ routes, container, onNavigate })` → `{ navigate(path, params), start() }`. Chaque route est un objet `{ path, render(container, params) }`.
  - Chaque vue exporte `render(container, params)` où `container` est un `HTMLElement`.
  - `views/home.js` exporte aussi `meta = { title: "Accueil", nav: true }`.
  - `views/game.js` exporte `meta = { title: "Jeu", nav: false, hideHeader: true }`.
  - `views/history.js` exporte `meta = { title: "Historique", nav: true }`.
  - `views/settings.js` exporte `meta = { title: "Réglages", nav: true }`.

- [ ] **Step 1: Créer `js/router.js`**

```js
export function createRouter({ routes, container, onNavigate }) {
  const byPath = new Map(routes.map((r) => [r.path, r]));

  function navigate(path, params = {}) {
    const route = byPath.get(path);
    if (!route) {
      console.warn(`Unknown route: ${path}`);
      return;
    }
    container.innerHTML = "";
    route.render(container, params);
    if (onNavigate) onNavigate(path, params, route);
  }

  function start() {
    navigate("home");
  }

  return { navigate, start };
}
```

- [ ] **Step 2: Créer les vues (écrans vides mais navigables)**

`js/views/home.js` :

```js
export const meta = { title: "Accueil", nav: true };

export function render(container) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = "Accueil — les jeux arrivent au palier C.";
  container.appendChild(card);
}
```

`js/views/game.js` :

```js
export const meta = { title: "Jeu", nav: false, hideHeader: true };

export function render(container, params = {}) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = `Jeu : ${params.id || "(aucun)"} — jeu factice au palier C.`;
  container.appendChild(card);
}
```

`js/views/history.js` :

```js
export const meta = { title: "Historique", nav: true };

export function render(container) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = "Historique — alimenté au palier C.";
  container.appendChild(card);
}
```

`js/views/settings.js` :

```js
export const meta = { title: "Réglages", nav: true };

export function render(container) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = "Réglages — thème et son au palier E.";
  container.appendChild(card);
}
```

- [ ] **Step 3: Créer `js/app.js`**

```js
import { createRouter } from "./router.js";
import * as home from "./views/home.js";
import * as game from "./views/game.js";
import * as history from "./views/history.js";
import * as settings from "./views/settings.js";

const routes = [
  { path: "home", ...home },
  { path: "game", ...game },
  { path: "history", ...history },
  { path: "settings", ...settings },
];

const container = document.getElementById("app");
const nav = document.getElementById("app-nav");
const title = document.getElementById("app-title");

const router = createRouter({
  routes,
  container,
  onNavigate(path, params, route) {
    document.body.classList.toggle("playing", !!route.meta.hideHeader);
    title.textContent = route.meta.title;

    nav.innerHTML = "";
    for (const r of routes) {
      if (!r.meta.nav) continue;
      const btn = document.createElement("button");
      btn.textContent = r.meta.title;
      btn.setAttribute("aria-current", r.path === path ? "page" : "false");
      btn.addEventListener("click", () => router.navigate(r.path));
      nav.appendChild(btn);
    }
  },
});

router.start();
```

- [ ] **Step 4: Vérifier la navigation**

Servir le site, ouvrir la page. Expected : l'accueil s'affiche ; les boutons Historique/Réglages dans l'en-tête changent de vue ; aucune erreur console.

- [ ] **Step 5: Commit**

```bash
git add js/
git commit -m "feat: routeur et vues navigables"
```

---

### Task 3: Couche stockage localStorage

**Files:**
- Create: `js/storage/local.js`
- Create: `tests/run.html`
- Create: `tests/harness.js`
- Create: `tests/storage.test.js`

**Interfaces:**
- Consumes: rien (indépendant de Task 1-2).
- Produces (`js/storage/local.js`) :
  - `SETTINGS_KEY = "cog.settings"`, `GAMES_KEY = "cog.games"`, `HISTORY_KEY = "cog.history"`
  - `getSettings()` → objet settings (crée les défauts si absent : `{ version: 1, theme: "auto", soundEnabled: true, createdAt: <ISO> }`)
  - `saveSettings(settings)` → void
  - `getGames()` → objet indexé par id de jeu (objet vide si absent)
  - `saveGames(games)` → void
  - `getHistory()` → tableau (vide si absent)
  - `addHistoryEntry(entry)` → void (append)
  - `clearHistory()` → void
  - `makeId()` → string unique

- [ ] **Step 1: Créer le harnais de test `tests/harness.js`**

```js
export function createRunner() {
  const results = [];
  let currentSuite = "";

  function suite(name, fn) {
    currentSuite = name;
    fn();
  }

  function test(name, fn) {
    try {
      fn();
      results.push({ suite: currentSuite, name, ok: true });
    } catch (err) {
      results.push({ suite: currentSuite, name, ok: false, error: err.message });
    }
  }

  function render(target) {
    const passed = results.filter((r) => r.ok).length;
    const failed = results.length - passed;
    const summary = document.createElement("h2");
    summary.textContent = `${passed} réussis, ${failed} échoués`;
    summary.style.color = failed ? "var(--danger)" : "#4caf50";
    target.appendChild(summary);

    for (const r of results) {
      const line = document.createElement("p");
      line.textContent = `${r.ok ? "PASS" : "FAIL"} — ${r.suite} › ${r.name}`;
      line.style.color = r.ok ? "#4caf50" : "var(--danger)";
      if (!r.ok) line.textContent += ` (${r.error})`;
      target.appendChild(line);
    }
  }

  return { suite, test, render };
}

export function assertEqual(actual, expected, message = "") {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message} attendu ${e}, obtenu ${a}`);
}

export function assertTrue(value, message = "") {
  if (!value) throw new Error(`${message} attendu vrai, obtenu ${value}`);
}
```

- [ ] **Step 2: Écrire les tests `tests/storage.test.js`**

```js
import { assertEqual, assertTrue } from "./harness.js";
import * as storage from "../js/storage/local.js";

export function register({ suite, test }) {
  suite("storage: settings", () => {
    test("getSettings crée des défauts si absent", () => {
      localStorage.clear();
      const s = storage.getSettings();
      assertEqual(s.version, 1);
      assertEqual(s.theme, "auto");
      assertEqual(s.soundEnabled, true);
      assertTrue(typeof s.createdAt === "string");
    });

    test("saveSettings puis getSettings conserve les valeurs", () => {
      localStorage.clear();
      const s = storage.getSettings();
      s.theme = "light";
      storage.saveSettings(s);
      assertEqual(storage.getSettings().theme, "light");
    });
  });

  suite("storage: games", () => {
    test("getGames renvoie un objet vide si absent", () => {
      localStorage.clear();
      assertEqual(storage.getGames(), {});
    });

    test("saveGames puis getGames conserve les niveaux", () => {
      localStorage.clear();
      storage.saveGames({ nback: { level: 2, attempts: 1, bestScore: 0.8 } });
      assertEqual(storage.getGames().nback.level, 2);
    });
  });

  suite("storage: history", () => {
    test("getHistory renvoie un tableau vide si absent", () => {
      localStorage.clear();
      assertEqual(storage.getHistory(), []);
    });

    test("addHistoryEntry ajoute en fin de tableau", () => {
      localStorage.clear();
      storage.addHistoryEntry({ id: "a", game: "nback", score: 0.5 });
      storage.addHistoryEntry({ id: "b", game: "span", score: 4 });
      const h = storage.getHistory();
      assertEqual(h.length, 2);
      assertEqual(h[1].game, "span");
    });

    test("clearHistory vide l'historique", () => {
      localStorage.clear();
      storage.addHistoryEntry({ id: "a", game: "nback" });
      storage.clearHistory();
      assertEqual(storage.getHistory(), []);
    });
  });

  suite("storage: ids", () => {
    test("makeId génère des identifiants uniques", () => {
      const a = storage.makeId();
      const b = storage.makeId();
      assertTrue(a !== b, "ids différents");
    });
  });
}
```

- [ ] **Step 3: Créer `tests/run.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Tests — neurminator</title>
  <link rel="stylesheet" href="../css/base.css">
</head>
<body>
  <main id="tests" style="max-width:720px;margin:0 auto;padding:16px"></main>
  <script type="module">
    import { createRunner } from "./harness.js";
    import { register as registerStorage } from "./storage.test.js";

    const runner = createRunner();
    registerStorage(runner);
    runner.render(document.getElementById("tests"));
  </script>
</body>
</html>
```

- [ ] **Step 4: Lancer les tests, vérifier l'échec**

Ouvrir `./tests/run.html`. Expected : tous les tests FAIL — `Failed to resolve module specifier "../js/storage/local.js"` (le fichier n'existe pas).

- [ ] **Step 5: Implémenter `js/storage/local.js`**

```js
export const SETTINGS_KEY = "cog.settings";
export const GAMES_KEY = "cog.games";
export const HISTORY_KEY = "cog.history";

const SETTINGS_VERSION = 1;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write ${key}`, err);
  }
}

export function getSettings() {
  const existing = read(SETTINGS_KEY, null);
  if (existing && typeof existing === "object") return existing;
  const defaults = {
    version: SETTINGS_VERSION,
    theme: "auto",
    soundEnabled: true,
    createdAt: new Date().toISOString(),
  };
  write(SETTINGS_KEY, defaults);
  return defaults;
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, settings);
}

export function getGames() {
  return read(GAMES_KEY, {});
}

export function saveGames(games) {
  write(GAMES_KEY, games);
}

export function getHistory() {
  return read(HISTORY_KEY, []);
}

export function addHistoryEntry(entry) {
  const history = getHistory();
  history.push(entry);
  write(HISTORY_KEY, history);
}

export function clearHistory() {
  write(HISTORY_KEY, []);
}

export function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
```

- [ ] **Step 6: Relancer les tests, vérifier le vert**

Ouvrir `./tests/run.html`. Expected : `8 réussis, 0 échoués`, toutes les lignes en vert.

- [ ] **Step 7: Commit**

```bash
git add js/storage/ tests/
git commit -m "feat: couche stockage localStorage + tests"
```

---

### Task 4: Registre des jeux et vue Accueil

**Files:**
- Create: `js/games/index.js`
- Modify: `js/views/home.js`

**Interfaces:**
- Consumes: `js/storage/local.js` (`getGames`), `js/views/home.js` de Task 2.
- Produces:
  - `js/games/index.js` exporte `GAMES` : tableau de `{ id, name, description, unit, higherIsBetter }`.
    Ids : `nback`, `span`, `stroop`, `reaction`.
  - `js/views/home.js` :

    `render(container, params)` inchangé (signature), mais remplace son contenu par une carte par jeu. Chaque carte appelle `params.navigate("game", { id })`.
  - `meta` de home inchangé.

- [ ] **Step 1: Créer `js/games/index.js`**

```js
export const GAMES = [
  {
    id: "nback",
    name: "N-back",
    description: "Mémoire de travail — repérer les répétitions",
    unit: "%",
    higherIsBetter: true,
  },
  {
    id: "span",
    name: "Span de mémoire",
    description: "Répéter des séquences de plus en plus longues",
    unit: "",
    higherIsBetter: true,
  },
  {
    id: "stroop",
    name: "Stroop",
    description: "Inhibition — nommer la couleur de l'encre",
    unit: "%",
    higherIsBetter: true,
  },
  {
    id: "reaction",
    name: "Temps de réaction",
    description: "Réagir le plus vite possible",
    unit: "ms",
    higherIsBetter: false,
  },
];

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}
```

- [ ] **Step 2: Réécrire `js/views/home.js`**

```js
import { GAMES } from "../games/index.js";
import { getGames } from "../storage/local.js";

export const meta = { title: "Accueil", nav: true };

export function render(container, params = {}) {
  const progress = getGames();

  for (const game of GAMES) {
    const state = progress[game.id] || { level: 1, attempts: 0, bestScore: null };
    const card = document.createElement("button");
    card.className = "game-card";
    card.type = "button";

    const name = document.createElement("p");
    name.className = "game-card__name";
    name.textContent = game.name;

    const meta = document.createElement("p");
    meta.className = "game-card__meta";
    const best = state.bestScore == null
      ? "aucun score"
      : `record ${state.bestScore}${game.unit}`;
    meta.textContent = `Niveau ${state.level} · ${best} · ${state.attempts} partie(s)`;

    card.append(name, meta);
    card.addEventListener("click", () => params.navigate("game", { id: game.id }));
    container.appendChild(card);
  }
}
```

- [ ] **Step 3: Modifier `js/app.js` pour transmettre `navigate`**

Dans `onNavigate`, après la construction de la nav, passer `navigate` à la vue. Le plus simple : passer `params.navigate = router.navigate` dans chaque `render`.

Modifier le routeur pour accepter un middleware, ou plus simplement passer `router.navigate` via `params` dans `navigate()` :

Dans `js/router.js`, changer `navigate` :

```js
function navigate(path, params = {}) {
  const route = byPath.get(path);
  if (!route) {
    console.warn(`Unknown route: ${path}`);
    return;
  }
  container.innerHTML = "";
  route.render(container, { ...params, navigate });
  if (onNavigate) onNavigate(path, params, route);
}
```

(La fonction `navigate` est définie dans la même portée, donc disponible.)

- [ ] **Step 4: Vérifier l'accueil**

Servir le site. Expected : 4 cartes de jeu (Niveau 1, aucun score). Cliquer sur une carte ouvre la vue Jeu avec le bon id. Retour via Historique/Réglages ne casse rien.

- [ ] **Step 5: Commit**

```bash
git add js/games/index.js js/views/home.js js/router.js
git commit -m "feat: registre des jeux et accueil"
```

---

### Task 5: Manifest et icônes SVG

**Files:**
- Create: `manifest.json`
- Create: `icons/icon.svg`
- Create: `icons/apple-touch-icon.svg`
- Modify: `index.html` (déjà lié à `manifest.json` en Task 1 — vérifier uniquement)

**Interfaces:**
- Consumes: rien.
- Produces: `manifest.json` référençant des icônes. Comme GitHub Pages n'exige pas de PNG et que l'utilisateur remplacera les icônes, on référence le SVG et on documente le remplacement.

- [ ] **Step 1: Créer `icons/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#14161a"/>
  <circle cx="180" cy="190" r="34" fill="#4f8cff"/>
  <circle cx="330" cy="170" r="30" fill="#4f8cff"/>
  <circle cx="200" cy="330" r="30" fill="#4f8cff"/>
  <circle cx="340" cy="320" r="34" fill="#4f8cff"/>
  <g stroke="#4f8cff" stroke-width="12" fill="none" opacity="0.8">
    <line x1="180" y1="190" x2="330" y2="170"/>
    <line x1="180" y1="190" x2="200" y2="330"/>
    <line x1="330" y1="170" x2="340" y2="320"/>
    <line x1="200" y1="330" x2="340" y2="320"/>
    <line x1="180" y1="190" x2="340" y2="320"/>
  </g>
</svg>
```

- [ ] **Step 2: Créer `icons/apple-touch-icon.svg`**

Copie de `icon.svg` avec fond plein (pas de transparence) :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#14161a"/>
  <circle cx="180" cy="190" r="34" fill="#4f8cff"/>
  <circle cx="330" cy="170" r="30" fill="#4f8cff"/>
  <circle cx="200" cy="330" r="30" fill="#4f8cff"/>
  <circle cx="340" cy="320" r="34" fill="#4f8cff"/>
  <g stroke="#4f8cff" stroke-width="12" fill="none" opacity="0.8">
    <line x1="180" y1="190" x2="330" y2="170"/>
    <line x1="180" y1="190" x2="200" y2="330"/>
    <line x1="330" y1="170" x2="340" y2="320"/>
    <line x1="200" y1="330" x2="340" y2="320"/>
    <line x1="180" y1="190" x2="340" y2="320"/>
  </g>
</svg>
```

- [ ] **Step 3: Créer `manifest.json`**

```json
{
  "name": "neurminator",
  "short_name": "neurminator",
  "description": "Entraînement cognitif — mémoire, attention, réaction",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#14161a",
  "theme_color": "#14161a",
  "lang": "fr",
  "icons": [
    {
      "src": "./icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "./icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "maskable"
    }
  ]
}
```

- [ ] **Step 4: Vérifier le manifest**

Servir le site, ouvrir les DevTools → Application → Manifest. Expected : le manifest est détecté, nom "neurminator", icône affichée. Note : Android accepte le SVG ; pour une installabilité 100 % conforme, remplacer par des PNG 192/512 (documenté dans le README).

- [ ] **Step 5: Documenter le remplacement des icônes dans `README.md`**

Ajouter :

```markdown

## Icônes

Les icônes fournies sont des SVG simples (`icons/`). Pour une compatibilité
maximale (notamment Android), les remplacer par des PNG :
- `icons/icon-192.png` (192×192)
- `icons/icon-512.png` (512×512)
- `icons/apple-touch-icon.png` (180×180)

Puis mettre à jour `manifest.json` et `index.html` en conséquence.
```

- [ ] **Step 6: Commit**

```bash
git add manifest.json icons/ README.md
git commit -m "feat: manifest PWA et icônes SVG"
```

---

### Task 6: Service worker hors-ligne

**Files:**
- Create: `sw.js`
- Modify: `js/app.js` (enregistrement du service worker)

**Interfaces:**
- Consumes: tous les fichiers de l'app shell (Task 1-5).
- Produces: un service worker qui met en cache l'app shell et sert le HTML en network-first. La liste `APP_SHELL` doit inclure exactement les fichiers créés.

- [ ] **Step 1: Créer `sw.js`**

```js
const CACHE_VERSION = "v1";
const CACHE_NAME = `neurminator-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/base.css",
  "./css/layout.css",
  "./css/games.css",
  "./js/app.js",
  "./js/router.js",
  "./js/games/index.js",
  "./js/storage/local.js",
  "./js/views/home.js",
  "./js/views/game.js",
  "./js/views/history.js",
  "./js/views/settings.js",
  "./icons/icon.svg",
  "./icons/apple-touch-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isHtml =
    request.mode === "navigate" || request.destination === "document";

  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
```

- [ ] **Step 2: Enregistrer le service worker dans `js/app.js`**

Ajouter à la fin de `js/app.js` :

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service worker registration failed", err);
    });
  });
}
```

- [ ] **Step 3: Vérifier l'enregistrement**

Servir le site en HTTP (localhost), ouvrir DevTools → Application → Service Workers. Expected : `sw.js` activé et en cours d'exécution. Console sans erreur.

- [ ] **Step 4: Vérifier le hors-ligne**

DevTools → Network → cocher "Offline", puis recharger la page. Expected : l'app s'affiche toujours (accueil + navigation). Décocher "Offline".

- [ ] **Step 5: Commit**

```bash
git add sw.js js/app.js
git commit -m "feat: service worker et cache hors-ligne"
```

---

### Task 7: Déploiement GitHub Pages et vérification finale

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: tout le palier A+B.
- Produces: instructions de déploiement et checklist de recette.

- [ ] **Step 1: Ajouter les instructions de déploiement au `README.md`**

```markdown

## Déployer sur GitHub Pages

1. Créer un dépôt GitHub et pousser la branche `main`.
2. Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/`.
3. Attendre ~1 min, puis ouvrir `https://<utilisateur>.github.io/<dépôt>/`.
4. Vérifier que le service worker s'enregistre (HTTPS requis, fourni par Pages).

### Après une mise à jour

Incrémenter `CACHE_VERSION` dans `sw.js` (ex. `v1` → `v2`) et pousser.
Sans cela, les visiteurs restent sur l'ancienne version en cache.

## Recette (Palier A+B)

- [ ] L'accueil affiche 4 cartes de jeu.
- [ ] La navigation Accueil / Historique / Réglages fonctionne.
- [ ] Le manifest est détecté (DevTools → Application → Manifest).
- [ ] Le site est installable sur Android (bannière « Ajouter à l'écran d'accueil »).
- [ ] Sur iOS, l'ajout manuel via Partager fonctionne.
- [ ] Hors-ligne (DevTools → Network → Offline), l'app se lance.
- [ ] `tests/run.html` affiche 8 réussis, 0 échoués.
```

- [ ] **Step 2: Vérification finale en local**

Servir en HTTP. Parcourir les 7 points de recette en local (les 3 points d'installation nécessitent le déploiement HTTPS).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: déploiement GitHub Pages et recette palier A+B"
```

---

## Self-Review

**Spec coverage :**
- §3 Architecture (couches) → Tasks 2, 3, 4.
- §4 Structure et conventions (chemins relatifs, anglais/FR) → Global Constraints + Tasks 1-6.
- §5 Modèle de données (3 clés, version) → Task 3.
- §7 PWA (manifest, sw, cache-first/network-first, CACHE_VERSION) → Tasks 5, 6, 7.
- §8 Interface (mobile d'abord, écrans, variables CSS, tactile ≥ 48 px) → Tasks 1, 2, 4.
- §9 Tests (logique pure, `tests/run.html`) → Task 3.
- §9 Palier A → Tasks 1-4. Palier B → Tasks 5-7.
- Hors périmètre v1 (score normalisé par jeu, difficulté, jeux réels) → reporté aux plans suivants (paliers C, D, E). Aucune tâche ici ne les implémente, conformément au découpage palier par palier.

**Placeholder scan :** aucun TBD/TODO ; chaque step contient le code ou la commande réelle.

**Type consistency :**
- `createRouter({ routes, container, onNavigate })` employé à l'identique en Task 2 et 4.
- `navigate(path, params)` : `params.navigate` transmis en Task 4, cohérent avec l'appel `params.navigate("game", { id })`.
- Clés et ids (`cog.settings`, `cog.games`, `cog.history`, `nback`, `span`, `stroop`, `reaction`) constants entre Tasks 3, 4, 6.
- `storage` API (`getGames`, `addHistoryEntry`, `makeId`, etc.) définie Task 3, utilisée Task 4.

**Écart au spec à trancher à l'exécution :** le spec prévoit des PNG 192/512 ; ce plan fournit des SVG et documente le remplacement (cohérent avec « icônes SVG simples, à remplacer par l'utilisateur »).
