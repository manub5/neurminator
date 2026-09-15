# Plan d'implémentation — Palier F (Canvas 2D + Playwright)

Réf. spec : `docs/superpowers/specs/2026-09-15-palier-f-canvas-design.md`

## Principe

Chaque incrément suit : test (logique pure ou e2e) → implémentation → vérification →
commit. Les jeux gardent leur logique scoring/difficulté actuelle et l'interface
`prepare(level, { container, onFinish })`.

## F1 — Moteur Canvas

1. Écrire `tests/engine.test.js` (logique pure : accumulateur de pas fixe, clamp
   `MAX_FRAME`, mapping index) et l'enregistrer dans `tests/run.html`.
2. Créer `js/engine/loop.js` — `createLoop` à pas fixe, pause `visibilitychange`.
3. Créer `js/engine/render.js` — `fitCanvas`, `screenToLogical`, `roundRect`.
4. Créer `js/engine/input.js` — clavier `Set`, pointeur, purge `blur`.
5. Créer `js/engine/scene.js` — cycle `enter/exit/update/render`.
6. Créer `js/engine/canvas-game.js` — `mountGame()` + canal `window.__cog` si `?test=1`.
7. Vérifier `tests/run.html`.

## F2 — Span

1. Extraire la logique pure existante (`randomSequence`) dans un module testable ;
   ajouter tests.
2. Réécrire `js/games/span.js` en scène Canvas (grille 3×3, phases observe/reproduce/
   feedback via compteurs dt).
3. Entrées : clavier `1..9` + pointeur.
4. Supprimer `js/games/span-grid.js` ; retirer ses styles.
5. Test e2e `span.spec.mjs`.
6. Vérifier run.html + e2e.

## F3 — N-back

1. Réécrire `js/games/nback.js` en scène Canvas (lettre, bouton Correspond, clavier Espace).
2. Conserver `buildSequence` exporté et testé.
3. Test e2e `nback.spec.mjs`.

## F4 — Stroop

1. Réécrire `js/games/stroop.js` en scène Canvas (mot coloré, 6 zones, clavier `1..6`).
2. Conserver `buildTrial`, `incongruentRatioForLevel`, `colorCount` testés.
3. Test e2e `stroop.spec.mjs`.

## F5 — Reaction

1. Réécrire `js/games/reaction.js` en scène Canvas (grille 3×3, cibles, clavier/pointeur).
2. Conserver `modeForLevel` testé ; `avgRt = null` si aucun essai correct.
3. Test e2e `reaction.spec.mjs`.

## F6 — Intégration, tests, docs

1. `js/views/game.js` : monter/démonter proprement le canvas (`destroy()`), garder
   l'écran de résultat DOM.
2. `css/games.css` : canvas responsive, `touch-action: none`, retirer styles inutiles
   des jeux migrés.
3. `sw.js` : `CACHE_VERSION = "v6"`, shell = fichiers engine + jeux à jour.
4. `tests/e2e/run.mjs` + `tests/e2e/helpers.mjs` + `package.json` (devDep Playwright).
5. `README.md` et `ETAT.md` : palier F.
6. Revue bugs + sécurité, commits par incrément.

## Vérifications finales

- `tests/run.html` : 0 échec.
- `node tests/e2e/run.mjs` : 0 échec (chromium headless).
- Navigation manuelle : chaque jeu jouable clavier + souris, pause sur onglet caché.
- Pas de `setInterval`, pas de logique par frame, chemins relatifs.
