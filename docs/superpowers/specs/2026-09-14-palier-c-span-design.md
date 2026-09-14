# neurminator — Palier C : Premier jeu complet (Span de mémoire)

## 1. Objet

Livrer le jeu **Span de mémoire** (grille 3×3) de bout en bout : lancement depuis
l'accueil, partie complète, score normalisé, écran de résultat, enregistrement dans
l'historique, ajustement de difficulté, et vue Historique réelle.

Ce palier établit le **pattern de jeu** réutilisé par les 3 jeux suivants (Palier D).

Hors périmètre : N-back, Stroop, temps de réaction (Palier D) ; sparklines, réglages
avancés (Palier E).

## 2. Interface des modules de jeu

Chaque jeu (`js/games/<id>.js`) expose :

```js
export function prepare(level, { container, onFinish }) → void
```

- `level` : longueur de départ.
- `container` : élément DOM hôte.
- `onFinish(rawResult)` : appelé en fin de partie avec le résultat brut.

Le module est responsable de la timeline jsPsych et du rendu custom. La vue `game.js`
route ensuite le résultat vers `scoring` → `difficulty` → `storage`.

## 3. Déroulement d'une partie de Span

- Départ à la longueur `level`.
- **Un essai** :
  1. Message « Observez la séquence… » (~800 ms).
  2. Cases allumées une par une : 600 ms allumée, 250 ms d'intervalle. Ordre aléatoire,
     pas de répétition consécutive de la même case.
  3. Phase de rappel : grille neutre et cliquable ; chaque clic surligne brièvement la
     case ; bouton « Valider » (actif dès le premier clic, valider une séquence
     incomplète compte comme échec).
  4. Feedback : séquence correcte affichée brièvement + indicateur réussite/échec.
- Essai réussi → longueur +1 → nouvel essai.
- **Premier essai échoué → fin de partie.**
- Plafond de sécurité : longueur max 12.

## 4. Score et difficulté

### Normalisation (`core/scoring.js`)

`normalize(gameId, raw)` → `{ score, higherIsBetter }`.

- `span` : `score = raw.maxSpan`, `higherIsBetter = true`.

### Ajustement (`core/difficulty.js`)

Fonction pure `nextLevel(gameId, currentLevel, recentScores)` → `newLevel`.

- Montée si performance récente ≥ 80 %, descente si ≤ 50 %, sinon neutre.
- Pas de saut > 1 niveau ; plancher à 1 ; les 2 premières parties ne changent pas le niveau.

**Seuils discrets pour le span** : pour chacune des 3 dernières parties,
`success = maxSpan >= level_courant ? 1 : 0`. Montée si la majorité est réussie
(2+ sur 3, ou 1/2 → non, on monte à 2/2), descente si minorité (≤1 sur 3). Concrètement :
`rate > 0.5` → montée ; `rate < 0.5` → descente ; `rate == 0.5` → neutre. Adapte fidèlement
la règle du spec au cas discret.

## 5. Données enregistrées

`cog.history` — entrée span :

```json
{
  "id": "uuid",
  "game": "span",
  "date": "…",
  "level": 3,
  "score": 5,
  "raw": { "maxSpan": 5, "trials": [3,4,5,6], "results": [true,true,true,false], "startLevel": 3 },
  "durationMs": 42000
}
```

`cog.games.span` — `{ level, attempts, bestScore }`. Record mis à jour seulement si le
score bat le précédent (`higherIsBetter`).

## 6. Vues

### Vue Jeu

En-tête masqué pendant la partie (`body.playing`, déjà en place). Fin de partie :
écran de résultat dans `#app` (score, comparaison au record, prochaine difficulté,
boutons « Rejouer » et « Accueil »). « Accueil » est indispensable pour sortir de
`body.playing`.

### Vue Historique

Remplace le placeholder : parties groupées par jour (heure, jeu, niveau, score),
état vide explicite si aucune partie. Pas de sparkline (Palier E).

## 7. jsPsych

- Cœur jsPsych via CDN, **version figée**.
- Pas d'usage de `serial-reaction-time-mouse` (rendu non custom).
- Plugin maison pour la grille 3×3 dessinant notre HTML/CSS, structure inspirée des
  plugins officiels.

## 8. Tests

- `core/scoring.js` : normalisation span, `higherIsBetter`.
- `core/difficulty.js` : montée, descente, neutre, plancher, pas de saut, inaction sur
  2 premières parties, seuils discrets span.
- Ajoutés à `tests/run.html`.
- jsPsych non testé automatiquement (timing navigateur) → validation manuelle.
