# neurminator — État du projet

Dernière mise à jour : 2026-09-15

## Où en est le projet

PWA d'entraînement cognitif **complète et déployée**.

- **En ligne** : https://manub5.github.io/neurminator/
- **Dépôt** : https://github.com/manub5/neurminator (public, branche `master`)
- **Cache service worker** : `v6`
- **Tests logique pure** : 67 réussis, 0 échoués (`tests/run.html`)
- **Tests e2e Playwright** : 21 réussis, 0 échoués (`npm run test:e2e`)

## Paliers terminés

| Palier | Contenu | État |
|---|---|---|
| A+B | Ossature, design, navigation, PWA installable, hors-ligne | Terminé, déployé |
| C | Span de mémoire (auto-validation) | Terminé, déployé |
| D | N-back, Stroop, Temps de réaction | Terminé, déployé |
| E | Finitions : thème, son, effacer historique, encart iOS, tendance + sparkline | Terminé, déployé |
| F | Rendu Canvas 2D de tous les jeux + moteur + suites Playwright | Terminé |

## Palier F — Canvas 2D (2026-09-15)

- **Moteur** `js/engine/` : `loop.js` (pas de temps fixe, pause `visibilitychange`),
  `render.js` (DPR, helpers, texte multi-lignes), `input.js` (clavier Set + pointeur),
  `scene.js`, `canvas-game.js` (hôte + canal de test).
- **Jeux migrés** en Canvas 2D : span, n-back, stroop, réaction. `span-grid.js` (DOM)
  supprimé. `js/core/sequence.js` ajouté (logique de séquence pure et testée).
- **Contrôles** : chaque jeu est jouable au clavier (chiffres / Espace) et au
  pointeur/tactile. `Échap` met la partie en pause (overlay) et la reprend.
- **Canal de test** `window.__cog` (actif seulement avec `?test=1`, **et** uniquement
  sur `localhost`/`127.0.0.1`) : `submit`, `state`, `isPaused`. Paramètre `?speed=N`
  (≤ 20) réservé aux tests pour accélérer le temps simulé.
- **Barre de français** : bouton « Correspond », instructions multi-lignes.
- **Correction** : le temps de réaction est mesuré en temps réel ; l'anticipation est
  détectée par pré-réponse pendant le délai (et non plus par un seuil de 150 ms qui
  déclenchait un faux positif dès la première frame).
- **Robustesse** : `randomSequence` borné (plus de boucle infinie avec un RNG constant).

## Architecture (rappel)

- PWA statique **sans build** (livraison), modules ES natifs. jsPsych abandonné.
- Playwright est une dépendance **de développement** uniquement (`package.json`).
- Chemins relatifs (GitHub Pages en sous-répertoire).
- Code en anglais, interface en français.

```
index.html, manifest.json, sw.js
css/    base.css, layout.css, games.css
js/     app.js, router.js, theme.js, sound.js
js/engine/     loop.js, render.js, input.js, scene.js, canvas-game.js
js/core/       scoring.js, difficulty.js, history.js, sequence.js  (logique pure, testée)
js/storage/    local.js
js/games/      index.js, span.js, nback.js, stroop.js, reaction.js
js/views/      home.js, game.js, history.js, settings.js
tests/         run.html, harness.js, *.test.js
tests/e2e/     run.mjs, helpers.mjs, *.spec.mjs  (Playwright)
icons/         SVG + PNG (192/512/180)
docs/superpowers/  specs/ et plans/
```

## Données localStorage

- `cog.settings` — `{ version, theme, soundEnabled, createdAt }`
- `cog.games` — `{ <id>: { level, attempts, bestScore } }`
- `cog.history` — tableau d'entrées `{ id, game, date, level, score, raw, durationMs }`

## Pistes pour la suite (non engagées)

- Export / import des données (sauvegarde manuelle).
- Ajuster les plafonds de difficulté du Stroop et du Réaction.
- Revoir l'affichage du score de Réaction (ms → secondes ?).

## Points techniques à garder en tête

- **YubiKey** : le push SSH via l'agent échoue parfois (`agent refused operation`) ;
  un débranchement/rebranchement de la clé débloque.
- **Cache PWA** : incrémenter `CACHE_VERSION` dans `sw.js` à chaque déploiement.
- **Déploiement** : après `git push`, GitHub Pages propage en ~1–2 min (build + CDN).
- **Tests** : `tests/run.html` pour la logique pure ; `npm run test:e2e` pour Playwright
  (chromium headless, serveur statique interne).
- **Ne pas livrer `node_modules/`** : Playwright est un outil de dev, `.gitignore` le couvre.

## Commandes utiles

```bash
# Lancer en local
python3 -m http.server 8000     # puis http://localhost:8000

# Tests logique pure : ouvrir ./tests/run.html dans le navigateur

# Tests e2e
npm install                     # une fois
npx playwright install chromium # une fois
npm run test:e2e

# Déployer
git push                        # SSH/YubiKey
```
