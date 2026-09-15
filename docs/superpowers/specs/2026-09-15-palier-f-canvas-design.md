# Palier F — Rendu Canvas 2D et tests Playwright — design

Date : 2026-09-15
Statut : validé (exécution autonome, AGENTS.md projet)

## Contexte

L'AGENTS.md du projet impose désormais :

- tous les jeux rendus en **Canvas 2D** (`getContext("2d")`), JS vanilla, zéro dépendance ;
- le code non-Canvas existant **est à migrer** ;
- boucle à **pas de temps fixe**, vitesses en **pixels/seconde** ;
- gestion du **devicePixelRatio**, contrôles **clavier ET tactile**, **pause** sur onglet caché ;
- **chaque jeu a une suite Playwright**, relancée après toute modification ;
- toute correction de bug commence par un test Playwright qui reproduit le bug.

Or aujourd'hui les 4 jeux (`span`, `span-grid`, `nback`, `stroop`, `reaction`) sont
rendus en **DOM/CSS** (`document.createElement`, classes CSS, `addEventListener`).
Il n'existe **aucune** suite Playwright (seulement `tests/run.html` pour la logique pure).

Le présent palier F couvre la mise en conformité : moteur Canvas 2D partagé,
migration des 4 jeux, et infrastructure de tests Playwright.

## Objectifs

1. Un **moteur Canvas 2D minimal** réutilisable (boucle, rendu, entrées, scène).
2. Les 4 jeux (span, n-back, stroop, réaction) rendus **exclusivement** dans un canvas.
3. Contrôles clavier **et** tactile/pointeur pour chaque jeu.
4. Tests Playwright par jeu, exécutables en local et en CI.
5. Zéro régression sur la logique pure et le stockage.

## Non-objectifs

- Refonte visuelle / artistique des jeux (on conserve les mêmes règles et le même
  découpage de difficulté).
- Migration des vues hors-jeu (accueil, historique, réglages) : ce ne sont pas des
  jeux ; elles restent en DOM.
- Physics, sprites, atlas, audio avancé : hors besoin.

## Architecture cible

```
js/engine/
  loop.js         boucle à pas fixe (STEP, MAX_FRAME, pause visibilitychange)
  render.js       resize + DPR, helpers de dessin partagés
  input.js        clavier (Set) + pointeur (pointerdown/up), mapping vers scène
  scene.js        contrat de scène: enter/exit/update/render, gestion du cycle de vie
  canvas-game.js  hôte: monte un canvas, câble loop+render+input, expose runScene()
js/games/
  span.js         règles + scène Canvas
  nback.js        idem
  stroop.js       idem
  reaction.js     idem
  (span-grid.js supprimé — remplacé par le rendu canvas de span)
```

### Moteur

- `loop.js` : `createLoop({ update, render })` — `requestAnimationFrame`, accumulateur,
  `STEP = 1/60`, `MAX_FRAME = 0.25`, pause sur `visibilitychange`, reprise avec
  `last = performance.now()`.
- `render.js` : `fitCanvas(canvas, ctx)` calcule `width/height` en tenant compte du DPR
  (plafonné à 2), applique `setTransform`, et expose une fonction de conversion
  écran → logique. Écoute `resize` et `orientationchange` (débounce).
- `input.js` : `createInput(canvas)` maintient un `Set` de codes clavier, expose
  `isDown(code)`, `onKeyDown(handler)`, `onPointer(handler)` ; `preventDefault` sur
  flèches/espace ; purge sur `blur`; `touch-action: none` posé en CSS.
- `scene.js` : `createScene({ enter, exit, update, render })` — garantit que
  `enter`/`exit` sont appelés une seule fois, libère les ressources.
- `canvas-game.js` : `mountGame(container, { scene, commands })` crée le `<canvas>`,
  l'insère, câble le moteur, renvoie un handle `{ destroy() }`. Fournit une **API de
  commandes** commune que Playwright peut piloter (voir ci-dessous).

### API de commandes (contrat testable)

Chaque jeu expose, sur l'objet renvoyé par `prepare()`, une fonction `destroy()` et un
canal de test `window.__cog` (uniquement en mode test, activé par `?test=1`) :

- `window.__cog.activeGame` — id du jeu courant ;
- `window.__cog.submit(payload)` — simule une entrée de jeu (ex. clic sur une case,
  réponse « Correspond », choix de couleur, clic de cible). Le payload reprend la
  structure attendue par la logique du jeu.
- `window.__cog.state()` — snapshot du rendu/état courant (ex. stimulus affiché,
  phase, cases actives) pour assertions.

Le canal de test est **inactif** sans `?test=1` : aucune API de triche en production.

## Migration des jeux

Règles communes :

- La **logique** (génération de séquence, calcul de score) est extraite et reste pure
  et testable telle quelle ; seule la présentation passe au canvas.
- Le découpage temporel actuel (`SHOW_DURATION`, `GAP_DURATION`, etc.) est conservé
  via un mini-planificateur temporel intégré à `update(dt)` (pas de `setTimeout`
  pilotant le rendu). Les temporisations deviennent des compteurs en secondes.
- Un jeu signale sa fin en appelant `onFinish(raw)` — interface inchangée, donc
  `views/game.js` change peu.

### Span

- Grille 3×3 dessinée dans le canvas (cases arrondies), surbrillance à l'affichage
  de la séquence, cases cliquables/touchables à la réponse.
- Entrées : clavier `1..9` (mapping pavé) **ou** pointeur.
- La validation reste automatique après `length` picks.
- Suppression de `span-grid.js` (DOM).

### N-back

- Lettre dessinée en grand dans le canvas ; bouton « Correspond » dessiné comme zone
  tactile (≥ 44 px) ; raccourci clavier `Espace`.
- Barre de progression des essais dessinée.

### Stroop

- Mot coloré dessiné en grand ; 6 zones de couleur cliquables (≥ 44 px) dessinées
  dans le canvas, avec libellés ; raccourcis clavier `1..6`.
- Mêmes règles : encre ∈ couleurs des boutons, incongruent ⇒ mot ≠ encre.

### Réaction

- Cibles circulaires dessinées dans une grille 3×3 ; cible active entourée.
- Entrées : clic/toucher direct sur la cible **ou** clavier `1..9` ; en mode 1 cible,
  `Espace` suffit.
- Temps mesuré en ms via `performance.now()`, comme aujourd'hui ; `avgRt = null` si
  aucun essai correct (comportement conservé).

## Accessibilité et thème

- Le canvas reçoit `role="application"` et un `aria-label` décrivant la consigne.
- Les couleurs du canvas sont lues depuis les variables CSS du thème
  (`getComputedStyle`) au moment du montage, pour respecter auto/clair/sombre.
- Le focus clavier est piégé dans le canvas pendant la partie ; `Échap` met en pause.

## Tests

### Tests de logique pure (`tests/run.html`)

- Ajouter les tests du **moteur** : pas fixe (accumulateur), conversion écran→logique,
  mapping clavier→index de case, mapping pointeur→index. Modules découpés pour être
  testables hors navigateur autant que possible.

### Tests Playwright (nouveaux, `tests/e2e/`)

Un fichier par jeu plus un socle :

- `helpers.mjs` : lance un serveur statique (ou réutilise `python3 -m http.server`),
  ouvre `game.html?id=<jeu>&test=1`, attend le montage du canvas.
- `span.spec.mjs`, `nback.spec.mjs`, `stroop.spec.mjs`, `reaction.spec.mjs`.
- Chaque suite vérifie au minimum : le canvas est présent et dimensionné, la partie
  démarre, une entrée via le canal de test produit un score cohérent, la fin de partie
  affiche le résultat et enregistre l'historique.

Exécution : script `tests/e2e/run.mjs` lançant Playwright (chromium headless) via le
runner de la skill Playwright, plus un `package.json` de test minimal **sans dépendance
runtime du jeu** (Playwright reste une dépendance de dev).

> Décision : Playwright est ajouté en `devDependencies` (outil de test, non embarqué
> dans la PWA). La règle « zéro dépendance » de l'AGENTS.md concerne le jeu livré.

## Incréments de livraison

- **F1** Moteur canvas + tests logique pure du moteur.
- **F2** Migration span (jeu pilote, valide l'API de commandes).
- **F3** Migration nback.
- **F4** Migration stroop.
- **F5** Migration reaction.
- **F6** Suite Playwright complète + `cache v6` + docs (README, ETAT.md).

## Risques et parades

| Risque | Parade |
|---|---|
| Comportement différent selon le taux de rafraîchissement | boucle à pas fixe + tests à STEP inchangé |
| Timing des jeux cassé par la migration | compteurs en secondes dans `update(dt)`, tests e2e de durée |
| Canvas flou sur mobile | DPR plafonné à 2 + `fitCanvas` |
| Tests e2e fragiles (attentes temporelles) | canal `__cog` déterministe plutôt que sleeps |
| Régression logique | tests de logique pure conservés, scoring inchangé |

## Critères d'acceptation

- [ ] Aucun jeu ne crée plus d'éléments DOM pour son rendu (seul le `<canvas>`).
- [ ] Boucle à pas fixe, absence de logique par frame ; pause sur onglet caché.
- [ ] Chaque jeu jouable au clavier **et** au tactile.
- [ ] `tests/run.html` : 0 échec, tests moteur inclus.
- [ ] Une suite Playwright par jeu, 0 échec.
- [ ] `sw.js` en `v6`, shell mis à jour, hors-ligne fonctionnel.
- [ ] README et ETAT.md reflètent le palier F.
