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
- [ ] `tests/run.html` affiche 8 réussis, 0 échoués.
