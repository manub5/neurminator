# neurminator

PWA d'entraînement cognitif — usage local, hébergée sur GitHub Pages.

## Lancer en local

Le service worker exige HTTP ou HTTPS (pas `file://`) :

```
python -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Tests

### Logique pure

Ouvrir `./tests/run.html` dans le navigateur (67 réussis, 0 échoués).

### End-to-end (Playwright)

Prérequis : Node 20+, puis une fois :

```
npm install
npx playwright install chromium
```

Lancer les suites (un serveur statique est démarré automatiquement) :

```
npm run test:e2e
```

Une suite par jeu : `tests/e2e/span.spec.mjs`, `nback.spec.mjs`, `stroop.spec.mjs`,
`reaction.spec.mjs`, plus le socle `tests/e2e/helpers.mjs`.
Les tests pilotent les jeux via le canal `window.__cog`, actif uniquement avec `?test=1`.

## Jeux — rendu Canvas 2D

Les 4 jeux sont rendus dans un `<canvas>` (Canvas 2D, JS vanilla, zéro dépendance
runtime). Le moteur est dans `js/engine/` : boucle à pas de temps fixe, gestion du
devicePixelRatio, entrées clavier ET pointeur, pause sur onglet caché, scènes.

## Déployer

Pousser sur la branche `main` du dépôt GitHub, activer GitHub Pages
(Settings → Pages → Source : branche `main`, dossier `/`).

## Icônes

Les icônes fournies sont des SVG simples (`icons/`), exportés en PNG :
- `icons/icon-192.png` (192×192)
- `icons/icon-512.png` (512×512)
- `icons/apple-touch-icon.png` (180×180)

Pour les personnaliser, remplacer ces PNG (mêmes dimensions), ou
modifier les SVG puis les ré-exporter.

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
- [ ] `tests/run.html` affiche 19 réussis, 0 échoués.

### Palier C — Span de mémoire

- [ ] L'accueil ouvre le jeu Span.
- [ ] La séquence s'allume case par case, puis la grille devient cliquable.
- [ ] La réponse se valide automatiquement après le bon nombre de clics (aucun bouton « Valider »).
- [ ] La partie s'arrête au premier échec.
- [ ] L'écran de résultat affiche score, record et prochain niveau.
- [ ] L'Historique montre la partie jouée.
- [ ] L'accueil affiche un niveau mis à jour.

### Palier D — Les 3 autres jeux

- [ ] N-back : lettres + bouton « Correspond », 20 essais jugés.
- [ ] Stroop : mot coloré, 4 boutons, choisir la couleur de l'encre.
- [ ] Réaction : cercle après délai, simple puis choix.
- [ ] Chaque jeu enregistre dans l'Historique et met à jour le niveau.
- [ ] Le record de Réaction baisse (plus bas = mieux).
- [ ] `tests/run.html` affiche 30 réussis, 0 échoués.

### Palier E — Finitions

- [ ] Réglages : le thème auto/clair/sombre s'applique et persiste.
- [ ] L'interrupteur de son persiste.
- [ ] « Effacer l'historique » demande confirmation et remet les niveaux à 1.
- [ ] L'encart iOS est présent.
- [ ] L'Historique montre la tendance par jeu et une sparkline.
- [ ] `tests/run.html` affiche 38 réussis, 0 échoués.

### Palier F — Canvas 2D et Playwright

- [ ] Chaque jeu est rendu dans un `<canvas>` (aucun élément DOM de jeu).
- [ ] Le jeu reste fluide et identique en 60 et 144 Hz (boucle à pas fixe).
- [ ] Chaque jeu est jouable au clavier ET au tactile/à la souris.
- [ ] L'onglet caché met la partie en pause.
- [ ] `tests/run.html` affiche 67 réussis, 0 échoués.
- [ ] `npm run test:e2e` affiche 21 réussis, 0 échoués.
