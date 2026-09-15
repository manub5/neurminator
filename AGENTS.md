# AGENTS.md — neurminator

## Langue
- Réponds toujours en français
- Commentaires dans le code : anglais
- Noms de variables/fonctions : anglais

## Autonomie
- **Enchaîne directement les étapes et les paliers sans demander de confirmation.**
- Ne demande pas de validation de design, de spec ou de plan : exécute le processus complet
  (brainstorming interne → spec → plan → implémentation) d'une traite.
- Continue jusqu'à ce que le travail demandé soit terminé et vérifié.
- Seules exceptions nécessitant de s'arrêter :
  1. Une action destructive ou irréversible non demandée explicitement (suppression de
     données, réécriture d'historique git, force-push, suppression de branche).
  2. Un secret, token ou clé à manipuler.
  3. Un appui YubiKey nécessaire pour pousser sur GitHub, alors attendre.

## Portabilité
- Cible : navigateurs mobiles (Android/iOS), navigateurs ordinateur (compatibilité avec navigateur mobile requise), PWA hébergée sur GitHub Pages
- Chemins relatifs uniquement (contrainte GitHub Pages en sous-répertoire)

## Projet
- PWA
- Code en anglais, interface en français
- Tests de la logique pure uniquement (`tests/run.html`)

## Rendu
- Tous les jeux sont rendus en Canvas 2D (`getContext("2d")`), JS vanilla, zéro dépendance.
- Le code existant non-Canvas est à migrer ; ne pas ajouter de nouveau code hors Canvas 2D.
- Boucle de jeu à pas de temps fixe, vitesses en pixels/seconde (jamais par frame).
- Gestion du devicePixelRatio, contrôles clavier ET tactile, pause sur onglet caché.

## Tests
- Chaque jeu a une suite Playwright. Après toute modification de code de jeu :
  lancer playwright et corriger les échecs avant de rendre la main.
- Toute correction de bug commence par un test Playwright qui reproduit le bug.

## Sécurité et bugs — règles non négociables
- JAMAIS de secrets, tokens, mots de passe ou clés dans le code source
- Utiliser des variables d'environnement ou fichiers `.env`
- `.gitignore` obligatoire (inclure : `.env`, `*.key`, `*.pem`, `build/`, `dist/`)
- Avant chaque commit : revue de bugs et revue de sécurité via superpowers.
- Ne pas déclarer une tâche terminée sans ces revues.
