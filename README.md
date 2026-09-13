# neurminator

PWA d'entraînement cognitif — usage local, hébergée sur GitHub Pages.

## Lancer en local

Le service worker exige HTTP ou HTTPS (pas `file://`) :

```
python -m http.server 8000
```

Puis ouvrir http://localhost:8000

## Tests

Ouvrir `./tests/run.html` dans le navigateur.

## Déployer

Pousser sur la branche `main` du dépôt GitHub, activer GitHub Pages
(Settings → Pages → Source : branche `main`, dossier `/`).
