# neurminator — État du projet

Dernière mise à jour : 2026-09-27

## Où en est le projet

PWA d'entraînement cognitif **complète et déployée**.

- **En ligne** : https://manub5.github.io/neurminator/
- **Dépôt** : https://github.com/manub5/neurminator (public, branche `master`)
- **Cache service worker** : `v8`
- **Tests logique pure** : 114 réussis, 0 échoués (`tests/run.html`)
- **Tests e2e Playwright** : 35 réussis, 0 échoués (`npm run test:e2e`)

## Paliers terminés

| Palier | Contenu | État |
|---|---|---|
| A+B | Ossature, design, navigation, PWA installable, hors-ligne | Terminé, déployé |
| C | Span de mémoire (auto-validation) | Terminé, déployé |
| D | N-back, Stroop, Temps de réaction | Terminé, déployé |
| E | Finitions : thème, son, effacer historique, encart iOS, tendance + sparkline | Terminé, déployé |
| F | Rendu Canvas 2D de tous les jeux + moteur + suites Playwright | Terminé, déployé |
| G | Corrections + engagement (sons, encarts, règles Stroop, 2 nouveaux jeux) | Terminé |

## Palier G — Corrections et engagement (2026-09-27)

- **Bug réglages** : le menu thème se dédoublait à chaque clic (`container.innerHTML`
  jamais vidé avant un nouveau rendu) ; corrigé.
- **N-back** : commence désormais au palier 2 (au lieu de 1) et ne redescend plus
  en dessous (plancher par jeu dans `core/difficulty.js`, `minLevelFor`).
- **Réaction** : fenêtre de réponse qui se resserre avec le niveau (au-delà du
  plafond de nombre de balles), série de réussites affichée, messages
  d'encouragement, retour sonore à chaque bonne réponse, halo pour un essai raté.
- **Span** : note douce (pentatonique) à chaque case touchée.
- **Stroop** : la règle alterne « couleur de l'encre » / « couleur du mot lu »
  toutes les 6 réponses, avec un bandeau annonçant clairement le changement ; à
  partir du niveau 2, les stimuli s'enchaînent par séries et se répondent de
  mémoire d'affilée (comme le span).
- **Sons doux** partout : sélection de menu, choix d'un jeu, passage de palier,
  nouveau record (`js/sound.js` : `playClick`, `playTouch`, `playLevelUp`,
  `playVictory`, `playNotice`).
- **Encarts de victoire/palier** : message plein écran à la fin d'une partie en
  cas de record ou de passage de niveau, qui se ferme au toucher (`js/ui/overlay.js`).
- **Emojis légers** : un emoji par jeu (accueil, historique, écran de résultat),
  icônes dans les réglages — glyphes Unicode natifs, zéro asset externe.
- **2 nouveaux jeux** inspirés de la littérature/de jeux connus :
  - **Paires** (`js/games/pairs.js`) — jeu de concentration/mémoire visuelle,
    paires d'emojis à retrouver, difficulté = nombre de paires (4 à 12).
  - **Go/No-Go** (`js/games/gonogo.js`) — tâche classique d'attention/inhibition
    (utilisée en neuropsychologie), difficulté = fréquence des signaux « stop »
    et vitesse de présentation.

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
js/games/      index.js, span.js, nback.js, stroop.js, reaction.js, pairs.js, gonogo.js
js/ui/         overlay.js  (encart de victoire/palier)
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
