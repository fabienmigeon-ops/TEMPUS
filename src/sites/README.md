# TEMPUS V0.1 — Migration React + TypeScript

Branche : `tempus_V0.1`. Aucune modification de `main` ou du site Cloudflare de production.

## Moteur chronologique

`VirtualRail.tsx` est le moteur React de la frise. Il remplace la navigation à 13 périodes fixes.

- Fenêtre de **69 périodes** rendues en permanence, avec recyclage/recentrage de la fenêtre pendant le défilement horizontal.
- Quatre échelles : siècle, année, mois, jour.
- Navigation par défilement tactile natif, molette et boutons précédent/suivant.
- Pincement pour changer d'échelle en conservant une date proche du point focal.
- Numérotation interne astronomique, sans année zéro affichée (passage de 1 av. J.-C. à 1 apr. J.-C.).
- Positionnement des points à l'intérieur de la période selon la date, alternance des points sur plusieurs hauteurs.
- Les données historiques ne sont **pas** embarquées : elles seront chargées depuis Supabase.

## Interface React

Menu latéral, recherche dans les événements fournis, favoris et historique locaux, filtres de catégories, fiche d'événement, saut vers une année, habillage sombre et doré.

## Contrôles avant préversion

- Le workflow GitHub Actions compile sur chaque push de `tempus_V0.1` avec `npm run build`.
- **La dernière compilation du nouveau moteur doit être confirmée sur GitHub Actions**.
- Vérifier sur téléphone : défilement long, pincement à deux doigts, limites -3100/année courante, passage av./apr. J.-C., zoom, menu, orientation et lisibilité.
- L'absence d'événements est normale avant la connexion Supabase.
- La comparaison pixel par pixel avec Sites n'a pas encore été effectuée.

Ne pas fusionner vers `main` ni déployer avant les contrôles.


## Consolidation API (12 novembre 2026)

Le point d'entrée `src/main.tsx` de la branche `integration/v01-consolidated` utilise désormais `Timeline` et `VirtualRail` avec les données de l'Edge Function `tempus-timeline-v1` (variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`). Les événements sont normalisés (ID chaîne, dates optionnelles, catégories, couleurs, médias distants). Les fiches conservent les crédits et les liens source. Le chargement est annulé lorsque la période change.

**À valider avant fusion** : build GitHub Actions (non confirmé), tests réels de défilement/pincement sur téléphone, vérification des réponses API selon les quatre zooms, galerie et menu. Les composants V0.1 sont désormais montés dans l'application ; les anciens fichiers `dist/` et `package.json` de V0.1 ne doivent pas remplacer ceux de `main`.
