# neurminator — Palier E : Finitions

## 1. Objet

Dernier palier : rendre l'app confortable et complète.

- Réglages fonctionnels : thème clair/sombre, son, effacer l'historique.
- Encart d'installation iOS.
- Historique enrichi : tendance par jeu + sparkline SVG maison (sans librairie).
- Logique d'agrégation testée.

Hors périmètre (YAGNI) : notification push, sons synthétisés avancés, graphiques
complexes, mode kiosque, multi-profils.

## 2. Réglages

`js/views/settings.js` lit/écrit `cog.settings` (`getSettings`, `saveSettings`).

- **Thème** : trois options — `auto` (suit le système), `light`, `dark`. Appliqué via
  l'attribut `data-theme` sur `<html>` : `light` → `data-theme="light"` ; `dark` → pas
  d'attribut (défaut sombre) ; `auto` → selon `matchMedia("(prefers-color-scheme: light)")`.
  Persisté dans `settings.theme`. Appliqué au démarrage par `app.js`.
  En mode `auto`, on écoute les changements de préférence système.
- **Son** : interrupteur `soundEnabled` persisté. Un bip court (WebAudio, oscillateur)
  est joué en fin de partie quand activé. Aucun fichier audio (donc rien à télécharger).
- **Effacer l'historique** : bouton avec confirmation (`window.confirm`), appelle
  `clearHistory()` et remet aussi `cog.games` à `{}` (cohérence : plus d'historique,
  on repart au niveau 1). Met à jour l'affichage.

## 3. Encart d'installation iOS

Dans Réglages, un encart statique (dépliable) expliquant l'installation manuelle sur iOS
(Partager → Sur l'écran d'accueil) et mentionnant la bannière automatique Android.

## 4. Historique enrichi

### Agrégation (`core/history.js`, pure et testable)

- `groupByDay(history)` → tableau `[{ day: "YYYY-MM-DD", label, entries: [...] }]`,
  trié du plus récent au plus ancien, entrées internes triées par date décroissante.
- `seriesForGame(history, gameId)` → tableau des scores du jeu, du plus ancien au plus
  récent (pour la sparkline).
- `trendForGame(history, gameId)` → `"up" | "down" | "flat" | null` : compare la moyenne
  des 3 dernières parties à celle des 3 précédentes ; `null` si moins de 6 parties.
  Le sens tient compte de `higherIsBetter` (pour Réaction, une baisse de temps = "up").

### Affichage

- En tête de l'historique, une carte par jeu joué : nom, nombre de parties, record,
  tendance (flèche ↑/↓/→) et **sparkline SVG** des ~15 derniers scores.
- Puis la liste groupée par jour (déjà en place).

Sparkline : petite fonction qui construit un `<svg>` avec une `<polyline>` normalisée
sur la largeur/hauteur. Pas de dépendance.

## 5. Application du thème

`app.js` applique le thème au démarrage (avant/après le premier rendu) et expose
`applyTheme(theme)`. `settings.js` l'appelle quand l'utilisateur change le thème.

## 6. Tests

- `core/history.js` : `groupByDay`, `seriesForGame`, `trendForGame` (montée/descente/
  neutre/`null`, sens inversé pour Réaction).
- Ajoutés à `tests/run.html`.

## 7. Hors périmètre

Sons par jeu, animations de transition, mode sombre OLED, export/import de données.
