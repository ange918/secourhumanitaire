# Crispa — du champ au paquet

Landing page avec une scène 3D (Three.js) pilotée par le scroll : une pomme de terre est
cueillie, roule dans une conduite, arrive en cuisine, est épluchée, tranchée, frite puis emballée.

## Lancer
```
python3 -m http.server 8000   # puis ouvrir http://localhost:8000
```
Faire défiler la page, ou cliquer sur « Lecture auto » (≈ 75 s).

## Structure
- `index.html`, `style.css` — page et textes superposés
- `main.js` — scène, personnages et chronologie (`update(p)` est une fonction pure du progrès `p` ∈ [0,1])
- `vendor/three.module.js` — Three.js r170 (copie locale, aucun CDN)
