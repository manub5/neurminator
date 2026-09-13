# neurminator — PWA d'entraînement cognitif

## 1. Objet

Application web progressive (PWA) d'entraînement cognitif dans l'esprit de Neuronation :
des mini-jeux courts de tâches cognitives validées, une progression suivie, et une
difficulté qui s'adapte à la performance récente.

- **Cible principale** : usage mobile, installable sur l'écran d'accueil Android et iOS.
- **Public** : usage personnel d'un non-développeur qui veut comprendre chaque étape.
- **Hébergement** : GitHub Pages (HTTPS, ce qui est requis pour une PWA et un service worker).
- **Hors périmètre v1** : synchronisation serveur, comptes, backend. L'app est local-only.

## 2. Décisions actées

| Sujet | Décision |
|---|---|
| Périmètre | PWA local-only, pas de sync serveur ni de backend |
| Hébergement | GitHub Pages, chemins relatifs obligatoires |
| Nom de l'app | `neurminator` |
| Logique des jeux | jsPsych (timing + séquencement des essais) |
| Interface | HTML/CSS custom par-dessus jsPsych. On n'utilise pas le rendu par défaut |
| Stockage | `localStorage` derrière une couche d'abstraction `storage/` |
| Ordre de construction | Ossature + design d'abord, puis un jeu à la fois |
| Outillage | HTML/CSS/JS statiques, **sans build**, modules ES natifs |
| jsPsych | CDN avec version figée, mis en cache par le service worker |
| Tests | Logique pure uniquement (`core/`, `storage/`) |
| Icônes | SVG simples, à remplacer par l'utilisateur |

## 3. Architecture

Application statique mono-page (SPA légère) : un seul `index.html`, un routeur maison
minimal qui échange les vues en JavaScript.

Couches, chacune avec un rôle unique :

- **Vues** (`js/views/`) — HTML/CSS de chaque écran. Ne connaît ni jsPsych ni le stockage.
- **Jeux** (`js/games/`) — un module par jeu, même interface : `start(options)`, `stop()`,
  émission d'un résultat normalisé. C'est le contrat qui permet d'ajouter/retirer un jeu
  sans toucher au reste.
- **Domaine** (`js/core/`) — logique métier pure et testable sans navigateur :
  ajustement de difficulté, normalisation des scores.
- **Stockage** (`js/storage/`) — API localStorage encapsulée (`saveScore`, `getHistory`,
  `getSettings`). Permet une migration future (IndexedDB, serveur) sans réécrire le reste.
- **PWA** (`manifest.json`, `sw.js`) — installation et cache hors-ligne.

### Flux de données d'une partie

1. L'utilisateur lance un jeu depuis l'accueil.
2. La vue appelle le module du jeu.
3. jsPsych exécute les essais en pilotant des stimuli HTML custom.
4. Le module renvoie un résultat brut.
5. `core/scoring.js` normalise le score ; `core/difficulty.js` calcule le nouveau niveau.
6. `storage/local.js` persiste score + niveau.
7. La vue historique relit l'ensemble.

## 4. Structure de fichiers

```
/
├── index.html              # page unique, point d'entrée
├── manifest.json           # métadonnées PWA (nom, icônes, couleurs)
├── sw.js                   # service worker (cache hors-ligne)
├── css/
│   ├── base.css            # reset, variables, typographie
│   ├── layout.css          # en-tête, navigation, conteneurs
│   └── games.css           # styles des stimuli/jeux
├── js/
│   ├── app.js              # démarrage, navigation
│   ├── router.js           # routeur maison minimal
│   ├── core/
│   │   ├── difficulty.js   # ajustement de difficulté (fonction pure)
│   │   └── scoring.js      # normalisation des résultats
│   ├── storage/
│   │   └── local.js        # API localStorage
│   ├── games/
│   │   ├── index.js        # registre des jeux (liste + métadonnées)
│   │   ├── nback.js
│   │   ├── span.js
│   │   ├── stroop.js
│   │   └── reaction.js
│   └── views/
│       ├── home.js
│       ├── game.js
│       ├── history.js
│       └── settings.js
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── docs/superpowers/specs/  # ce document et les suivants
├── tests/
│   └── run.html            # runner de tests (navigateur, sans dépendance)
├── .gitignore
└── README.md               # lancer, tester, déployer
```

### Conventions

- **Code en anglais** (variables, fonctions, noms de fichiers) ; **interface en français**.
- **Chemins relatifs** partout (`./css/...`), jamais absolus — contrainte GitHub Pages
  avec sous-répertoire.
- Un jeu = un fichier exposant la même interface.

## 5. Modèle de données

Trois clés localStorage.

### `cog.settings`

```json
{
  "version": 1,
  "theme": "auto",
  "soundEnabled": true,
  "createdAt": "2026-09-14T10:00:00.000Z"
}
```

### `cog.games` — progression par jeu

```json
{
  "nback":    { "level": 2, "attempts": 12, "bestScore": 0.83 },
  "span":     { "level": 5, "attempts": 8,  "bestScore": 6 },
  "stroop":   { "level": 1, "attempts": 3,  "bestScore": 0.91 },
  "reaction": { "level": 1, "attempts": 20, "bestScore": 412 }
}
```

- `level` : difficulté courante, paramètre le prochain essai.
- `bestScore` : record.
- `attempts` : nombre de parties jouées.

### `cog.history` — journal chronologique

```json
[
  {
    "id": "uuid",
    "game": "nback",
    "date": "2026-09-14T10:03:00.000Z",
    "level": 2,
    "score": 0.83,
    "raw": { "correct": 10, "total": 12, "avgRt": 640 },
    "durationMs": 45000
  }
]
```

### Principes

1. **`raw` conserve les données brutes** de la partie ; permet de recalculer un score
   différemment sans rien perdre.
2. **Score normalisé propre à chaque jeu** :
   - N-back → taux de bonnes réponses (0–1), plus haut = mieux.
   - Span → longueur maximale réussie (entier), plus haut = mieux.
   - Stroop → taux de bonnes réponses, plus haut = mieux.
   - Réaction → temps de réaction moyen en ms, plus bas = mieux.
   `core/scoring.js` applique la normalisation et expose un drapeau `higherIsBetter`.
3. **Historique append-only**. Bouton "effacer l'historique" dans les réglages, avec
   confirmation.

### Contrainte

localStorage est synchrone et limité (~5 Mo). Le volume stocké est négligeable
(quelques Ko pour des milliers de parties). La couche `storage/local.js` isole cette
dépendance.

## 6. Ajustement de la difficulté

Règle : après chaque partie, examiner les 3 dernières parties du jeu et ajuster le
`level` de ±1 au plus. Zone neutre pour éviter les oscillations.

| Jeu | Nature du `level` | Montée | Descente | Plafond |
|---|---|---|---|---|
| N-back | N (1–5) | réussite ≥ 85 % | réussite ≤ 60 % | 5 |
| Span | longueur de séquence | réussite ≥ 80 % | réussite ≤ 50 % | aucun fixe |
| Stroop | nombre d'essais / proportion incongruente | réussite ≥ 85 % | réussite ≤ 60 % | configurable |
| Réaction | complexité (simple → choix 2 → choix 4) | temps moyen < cible | temps moyen > cible | configurable |

Garde-fous :

- **Pas de saut de plus d'un niveau par partie.**
- **Les 2 premières parties d'un jeu** ne changent pas le niveau (données insuffisantes),
  elles sont seulement enregistrées.
- **Plancher à 1** pour tous les jeux.

Implémentation : `core/difficulty.js`, fonction pure
`nextLevel(game, currentLevel, recentScores) → newLevel`, testable sans navigateur.

**Hors périmètre v1 (YAGNI)** : courbes d'apprentissage avancées, mémoire longue,
périodes de repos forcées, plafonds dynamiques.

## 7. PWA

### `manifest.json`

Nom, nom court, couleurs (thème clair/sombre), `display: "standalone"`,
`orientation: "portrait"`, icônes de la section 4.

### `sw.js`

1. **App shell en cache-first** : HTML, CSS, JS, icônes et jsPsych (CDN) mis en cache
   au premier chargement → lancement hors-ligne.
2. **Mise à jour network-first pour le HTML** : récupère la nouvelle version si réseau,
   retombe sur le cache sinon. Un `CACHE_VERSION` incrémenté à chaque déploiement force
   le renouvellement (évite le blocage sur une version périmée).

### Installation

- Android/Chrome : bannière automatique détectée via manifest + service worker.
- iOS/Safari : installation manuelle via *Partager → Sur l'écran d'accueil*.
  Un encart explicatif est affiché dans les Réglages (source n°1 de confusion).

### Contraintes GitHub Pages

- HTTPS obligatoire → fourni par GitHub Pages. En local, serveur HTTP requis
  (`python -m http.server`, documenté dans le README).
- URL en sous-répertoire (`https://<user>.github.io/<repo>/`) → chemins relatifs.
- `sw.js` doit être à la racine du repo pour contrôler tout le site.

**Hors périmètre** : notifications push, background sync, écran de démarrage iOS custom.

## 8. Interface et design

Principe : **mobile d'abord, épuré, contraste fort, gros éléments tactiles.** Rien de
décoratif qui parasite la concentration pendant une tâche cognitive.

### Identité visuelle (`base.css`, variables CSS)

- Fond sombre par défaut, thème clair disponible.
- Une couleur d'accent unique pour les actions ; palette neutre sinon.
- Typographie système (pas de police téléchargée → meilleure PWA hors-ligne).
- Zones tactiles ≥ 48 px ; pas d'états de survol dépendants.

### Écrans

1. **Accueil** — 4 grandes cartes de jeu (nom, niveau actuel, dernier score) ; un tap
   lance le jeu. Accès Historique et Réglages depuis l'en-tête.
2. **Jeu** — plein écran, en-tête retiré pendant la partie. Zone de stimulus (jsPsych +
   HTML custom) et barre de progression/feedback. Fin : écran de résultat (score,
   comparaison au record, niveau suivant).
3. **Historique** — liste chronologique groupée par jour ; par jeu : score, niveau,
   tendance ; mini-sparkline SVG maison (sans librairie).
4. **Réglages** — thème, son, effacer l'historique (confirmation), encart d'installation iOS.

### Interface custom par-dessus jsPsych

jsPsych fournit le timing et le séquencement des essais, **pas** le rendu. On écrit nos
propres écrans de tâche (carré dans une grille pour N-back, mots colorés pour Stroop,
etc.) que jsPsych pilote. On garde la rigueur de jsPsych sans son apparence générique.

### Accessibilité minimale

Contrastes suffisants, boutons libellés, la couleur n'est jamais le seul indicateur
(essentiel pour Stroop, où la couleur est le stimulus — conditions équitables assurées).

**Hors périmètre** : animations lourdes, graphiques complexes, mode kiosque,
personnalisation poussée.

## 9. Tests et validation

### Périmètre testé (logique pure uniquement)

- `core/difficulty.js` : montée, descente, zone neutre, plancher à 1, pas de saut > 1,
  inaction sur les 2 premières parties.
- `core/scoring.js` : normalisation par jeu, drapeau `higherIsBetter`, `raw` incomplets.
- `storage/local.js` : écriture/lecture, format des trois clés, localStorage vide,
  migration si `version` diffère.

### Outillage

`tests/run.html` ouvert dans le navigateur : exécute tout, affiche vert/rouge.
Pas de Node, pas de `npm test` — cohérent avec "sans build" et utilisable sur téléphone.

### Hors périmètre

Rendu visuel, timing jsPsych (dépend du navigateur), service worker (vérifié
manuellement par un test hors-ligne réel).

### Paliers de validation

1. **Palier A — Ossature** : structure de fichiers, navigation entre écrans vides,
   design de base, tests `storage` en vert.
2. **Palier B — PWA installable** : manifest, service worker, déployée sur GitHub Pages,
   installable sur téléphone, écran d'accueil vide fonctionnel hors-ligne.
3. **Palier C — Premier jeu de bout en bout** : accueil → partie → score → historique →
   ajustement de difficulté, avec `difficulty` et `scoring` testés.
4. **Palier D — Les 4 jeux** : N-back, puis Span, Stroop, Réaction, un par un, chacun
   validé avant le suivant.
5. **Palier E — Finitions** : tendances de l'historique, sparklines, réglages complets,
   encart iOS, polish global.

À chaque palier, le résultat est visible sur téléphone (ou en local) avant de passer
au suivant.

## 10. Risques et vigilances

- **Chemins absolus** → cassent sur GitHub Pages en sous-répertoire. Vigilance continue.
- **Version de jsPsych** figée dans l'URL du CDN → une mise à jour du CDN ne peut pas
  casser l'app.
- **Cache périmé du service worker** → `CACHE_VERSION` à incrémenter à chaque déploiement.
- **localStorage synchrone/limité** → volume négligeable ici ; abstraction `storage/`.
- **Installation iOS non automatique** → encart explicatif dans les Réglages.
- **Timing jsPsych non testable automatiquement** → validation manuelle.
