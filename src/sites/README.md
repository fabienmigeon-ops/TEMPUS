# TEMPUS V0.1 — migration Sites vers React + TypeScript

Branche isolée : `tempus_V0.1`. La branche `main` et le déploiement Cloudflare actuel ne sont pas modifiés.

## Implémenté

- Point d'entrée React utilisant `Timeline` et types TypeScript.
- Frise plein écran sombre, accent doré, quatre échelles (siècle, année, mois, jour).
- Navigation par périodes, geste de glissement, zoom tactile par pincement, saut vers une année, dates avant/après J.-C.
- Points alternés au-dessus et en dessous de la ligne, fiches historiques et favoris.
- Menu latéral, recherche dans les événements disponibles, historique local, catégories filtrables.
- Interface vide explicite tant que l'API Supabase n'est pas connectée.

## Différences par rapport à Sites V9

- **Non paritaire :** Sites V9 utilise un rail horizontal à défilement continu, une virtualisation des mois et jours, un positionnement par date réelle et un zoom ancré sous les doigts. Le composant React actuel utilise 13 périodes centrées, avec navigation par pas.
- Les catégories sont dérivées des événements reçus ; sans données elles n'apparaissent pas.
- Apparence et Paramètres sont encore des entrées non fonctionnelles, comme dans l'export Sites.
- Les événements historiques sont volontairement absents du frontend : ils seront intégrés directement à Supabase.
- Le rendu doit être comparé visuellement à Sites sur mobile.

## Validation

GitHub Actions est configuré pour exécuter `npm install && npm run build` sur cette branche. **Ne pas considérer la compilation validée tant que l'exécution GitHub Actions n'est pas confirmée réussie.**

Pour tester localement : `npm install`, `npm run build`, puis `npm run dev`.

Ne pas fusionner dans `main` et ne pas déployer sur Cloudflare avant validation fonctionnelle, visuelle et compilation.
