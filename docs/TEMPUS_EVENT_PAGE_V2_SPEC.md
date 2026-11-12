# TEMPUS — Fiche événement V2.0 — Spécification approuvée

Statut : **spécification validée ; implémentation non commencée**. Branche de préparation : `feature/event-page-v2`. **Ne pas fusionner ni déployer sans accord explicite.**

## Parcours et navigation
1. Depuis un point de la frise, ouvrir un aperçu inférieur de 40–50 % de la hauteur : vignette du média hero, date, catégorie, titre, résumé, action « Découvrir l'événement ».
2. L'action ouvre une page événement plein écran, sans changer la période, le zoom ni la position de la frise en arrière-plan.
3. La page unifiée affiche : image hero avec crédits et lien source, date, catégorie, titre, introduction, informations essentielles, compteurs calculés depuis les données ; ensuite cinq onglets sur **la même page**.
4. Onglets : **Contenu**, **Acteurs**, **Lieux**, **Archives**, **Sources**. La barre d'onglets devient collante pendant le défilement. Les compteurs naviguent vers leur onglet.
5. Retour à l'aperçu puis à la frise avec état préservé. Le changement d'onglet n'entraîne aucun rechargement complet.

## Contrats de contenu
- Contenu : contexte, causes, déroulement, conséquences, importance historique. Sections absentes masquées, sans texte inventé.
- Acteurs : personnes liées, rôle dans l'événement, biographie si disponible.
- Lieux : lieux liés, rôle, localisation si connue.
- Archives : média hero en tête de page ; autres médias en galerie, agrandissement, titre, légende, attribution, licence, lien documentaire.
- Sources : références, institutions et liens externes vérifiables.
- Les compteurs proviennent des relations effectives, pas de constantes.

## Intégration technique
- React/TypeScript : isoler `EventPreview`, `EventPage`, `EventTabs`, `MediaGallery`, `HistoricalSection` ; préserver le moteur de frise existant.
- API Supabase : `tempus-timeline-v1` renvoie déjà `events[].media[]` ; étudier un endpoint de détail par ID pour contenus longs, personnes, lieux et sources. Ne pas présumer des colonnes avant inspection du schéma.
- PostgreSQL `tempus` : conserver `Media.image_url` (URL fichier distant) distinct de `Media.source_url` (notice documentaire) ; aucun stockage R2 requis.
- Sécurité : valider les URL HTTPS ; liens externes `rel=noopener noreferrer` ; ne jamais injecter du HTML historique non assaini.
- Performance : charger le détail à l'ouverture, images lazy sauf hero, placeholder si chargement impossible, annuler les requêtes obsolètes.
- Accessibilité : boutons nommés, focus, onglets accessibles au clavier, contrastes et zones de sécurité mobiles.

## Direction visuelle
Fond #10131B, accent #C5A46D, illustration dominante, cartes sobres, typographie lisible, transitions 250–300 ms, respect des préférences de mouvement réduit.

## Critères d'acceptation
- Aperçu puis page unifiée opérationnels sur mobile et desktop.
- Les cinq onglets affichent exclusivement les données réellement disponibles.
- Les trois médias associés à la prise de la Bastille apparaissent si leurs URL sont accessibles ; sinon fallback visible sans rupture de la page.
- Crédits, licences et liens sources accessibles.
- Aucun changement de comportement de la frise, des quatre zooms ou du menu.
- Retour préservant exactement la navigation.
- Compilation TypeScript/Vite et vérification visuelle avant proposition de fusion.
- **Aucune fusion vers main, aucun déploiement Cloudflare, aucune modification de production sans approbation.**
