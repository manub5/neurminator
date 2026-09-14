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
  3. Un appui YubiKey nécessaire pour pousser sur GitHub : dans ce cas, jouer 10 bips
     (echo successifs) puis attendre.
  4. Un blocage réel (dépendance manquante, erreur répétée, instruction ambiguë).

## Sécurité — règles non négociables
- JAMAIS de secrets, tokens, mots de passe ou clés dans le code source
- Utiliser des variables d'environnement ou fichiers `.env`
- `.gitignore` obligatoire (inclure : `.env`, `*.key`, `*.pem`, `build/`, `dist/`)

## Portabilité
- Cible : navigateurs mobiles (Android/iOS), PWA hébergée sur GitHub Pages
- Chemins relatifs uniquement (contrainte GitHub Pages en sous-répertoire)

## Projet
- PWA statique, **sans build**, modules ES natifs
- Code en anglais, interface en français
- Tests de la logique pure uniquement (`tests/run.html`)
- jsPsych : **abandonné** (décision Palier C) au profit de JavaScript natif
