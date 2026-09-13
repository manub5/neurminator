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

## Icônes

Les icônes fournies sont des SVG simples (`icons/`), exportés en PNG :
- `icons/icon-192.png` (192×192)
- `icons/icon-512.png` (512×512)
- `icons/apple-touch-icon.png` (180×180)

Pour les personnaliser, remplacer ces PNG (mêmes dimensions), ou
modifier les SVG puis les ré-exporter.
