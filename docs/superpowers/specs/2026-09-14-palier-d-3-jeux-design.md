# neurminator — Palier D : N-back, Stroop, Temps de réaction

## 1. Objet

Livrer les 3 jeux restants, chacun complet (partie jouable, score normalisé, ajustement
de difficulté, historique), en réutilisant le pattern du Palier C :

```js
export async function prepare(level, { container, onFinish }) { … }
```

Moteur : **JavaScript natif** (pas de jsPsych), comme décidé au Palier C.

## 2. N-back (mémoire de travail)

- Des lettres apparaissent une par une, ~2000 ms chacune (affichage 1500 ms + 500 ms
  de blanc).
- L'utilisateur tape un gros bouton **« Correspond »** si la lettre est identique à celle
  d'il y a **N** positions (`N` = niveau).
- Une partie = **20 essais jugés** (les N premières lettres servent d'amorce, non jugées).
- Score = **taux de bonnes réponses** (0–1), `higherIsBetter = true`.
- Environ 30 % des essais sont des cibles (correspondances), placées aléatoirement.

Réponse par essai :
- Cible + bouton tapé → correct.
- Cible + pas tapé → erreur.
- Non-cible + bouton tapé → erreur.
- Non-cible + pas tapé → correct.

`raw = { maxN, correct, total, targets }` → score `correct / total`.

## 3. Stroop (inhibition)

- Un **mot de couleur** s'affiche, écrit dans une **couleur d'encre** qui peut différer.
- **6 couleurs** : rouge, vert, bleu, jaune, violet, orange. 6 boutons colorés (libellés).
- L'utilisateur choisit la **couleur de l'encre** (pas le mot lu). L'encre est toujours
  l'une des 6 couleurs (donc réponse possible).
- Une partie = **24 essais**.
- Score = **taux de bonnes réponses** (0–1), `higherIsBetter = true`.
- Difficulté = proportion d'essais **incongruents** (mot ≠ encre) :
  - niveau 1 : 50 % incongruents
  - niveau 2 : 65 %
  - niveau 3 : 80 %
  - niveau 4+ : 90 %

`raw = { correct, total, congruent, incongruent }`.

## 4. Temps de réaction

- Un cercle apparaît après un délai aléatoire (1000–2500 ms).
- L'utilisateur tape le plus vite possible.
- Une partie = **15 essais**.
- Difficulté :
  - niveau 1 : réaction **simple** (taper n'importe où dès l'apparition).
  - niveau 2 : **choix 2** (taper le bon cercle parmi 2 couleurs).
  - niveau 3+ : **choix 4** (4 positions/couleurs).
- Score = **temps de réaction moyen en ms** sur les essais corrects,
  `higherIsBetter = false`. Si aucun essai correct, **aucun score n'est enregistré**
  (`avgRt = null`) : ni historique, ni record, ni changement de niveau.
- Les cibles apparaissent à des **positions aléatoires** dans une grille 3×3.
- Anticipation (< 150 ms) → essai marqué anticipé, exclu du temps moyen et compté comme
  incorrect.

`raw = { avgRt, correct, total, mode, anticipations }`.

## 5. Score, difficulté, données

### Normalisation (`core/scoring.js`)

| Jeu | score | higherIsBetter |
|---|---|---|
| nback | `correct / total` (0–1) | true |
| stroop | `correct / total` (0–1) | true |
| reaction | `avgRt` (ms) | false |

### Difficulté (`core/difficulty.js`)

`isSuccess` par jeu :
- nback : `score >= 0.85` (réussite = bon niveau).
- stroop : `score >= 0.85`.
- reaction : `score > 0 && score <= seuilRéaction(niveau)`, où le seuil décroît avec le
  niveau (niveau 1 : 500 ms, 2 : 480 ms, 3 : 460 ms, 4+ : 440 ms). Plus haut = plus exigeant.

Règles communes inchangées : fenêtre de 3, minimum 2 échantillons, `rate > 0.5` → +1,
`rate < 0.5` → −1, plancher 1, pas de saut.

Plafonds : nback 5 (nécessite 5 lettres différentes minimum ; alphabet de 8 lettres),
stroop et reaction sans plafond fixe (reaction choix 4 max en pratique).

### Données

`cog.history` : même structure ; `raw` par jeu tel que ci-dessus.
`cog.games` : `{ level, attempts, bestScore }`, record selon `higherIsBetter`.

## 6. Vues

- `game.js` : le registre `MODULES` inclut `nback`, `stroop`, `reaction`. L'écran de
  résultat est déjà générique (score + unité + record + prochain niveau).
- Le libellé d'unité (`game.unit`) et le sens du record viennent déjà de `games/index.js`.
- L'historique est déjà générique.

## 7. Tests

- `core/scoring.js` : normalisation des 3 jeux + span (régression).
- `core/difficulty.js` : `isSuccess` des 3 nouveaux jeux, seuils, garde-fous (régression).
- Ajoutés à `tests/run.html`. jsPsych inexistant → tout est en JS natif testable.

## 8. Hors périmètre

Sparklines, réglages avancés, sons (Palier E).
