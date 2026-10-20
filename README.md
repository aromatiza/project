# Space Daily + Gemini AI + Scanner caméra

## Installation (Windows CMD)

1. Téléchargez une clé Gemini sur https://aistudio.google.com/apikey (projet éligible au Free Tier selon modèle et pays).
2. Ouvrez **cmd** dans le dossier contenant `server.js`.
3. Tapez `set "GEMINI_API_KEY=VOTRE_CLE"` en remplaçant VOTRE_CLE par la vraie clé. N'envoyez pas cette clé à d'autres personnes.
4. Tapez `node server.js`.
5. Ouvrez http://localhost:3000 et testez Space AI : « Quelle est la capitale du Japon ? »

Ne mettez **jamais** la clé dans index.html, space-ai.js ou une capture d'écran. La variable d'environnement reste dans la session CMD. Après fermeture de CMD, recommencez l'étape 3. Vous n'avez plus besoin de la clé OpenAI pour cette édition.

### Comment ça fonctionne

Le navigateur envoie `POST /api/ai/chat` au serveur Node.js local; celui-ci appelle `gemini-2.5-flash` via l'API Google Gemini, avec `GEMINI_API_KEY`. Le système utilise la dernière conversation et les données facultatives de suivi. **Attention :** quand le chat connecté est activé, le contenu et un résumé des données personnelles peuvent être transmis à Google. Évitez de saisir des données sensibles. Le suivi de bien-être n'est pas un avis médical.

La version fonctionne en mode local sans clé mais ne répond qu'aux questions de suivi. Les erreurs Gemini s'affichent dans le chat. Les quotas gratuits et la disponibilité du modèle varient selon le compte, la région et les politiques Google; voir https://ai.google.dev/gemini-api/docs/pricing.

### Scanner

Nutrition → Scanner : caméra sur localhost ou HTTPS et autorisation du navigateur; BarcodeDetector ou ZXing. Saisie manuelle du code EAN/UPC possible. Les informations proviennent d'Open Food Facts via Internet.

### Important avant déploiement public

Ce serveur est adapté aux tests locaux. Avant de le mettre en ligne, ajoutez authentification, limitation des requêtes, protection contre les abus et politique de confidentialité.


## Nouveauté : Scanner photo IA + analyse nutritionnelle

- **Nutrition → Prendre / choisir une photo** : choisit une photo JPEG/PNG/WebP (< 4 Mo), puis appuie sur **Identifier avec Space AI**. L’image est envoyée à Gemini via le serveur local uniquement après ce clic ; ni la photo ni la réponse ne sont sauvegardées dans le suivi. Sur téléphone, la sélection peut ouvrir la caméra arrière.
- **Nutrition → Rechercher un produit → ✦ Analyser** : décrit les informations reçues d’Open Food Facts (ou d’une saisie personnelle), avec mention des valeurs manquantes. Le bouton Ajouter reste indépendant.
- Le code-barres, les menus et le chat général Gemini restent en place. L’identification visuelle est une hypothèse et **ne fournit jamais de valeurs nutritionnelles estimées**. Vérifier étiquette et base produit.
- La fonctionnalité photo dépend d’un modèle Gemini **compatible avec les images**. Si le modèle configuré est texte uniquement, garder le chat qui fonctionne et tester un modèle vision autorisé pour votre compte. Aucune clé ne doit être mise dans les fichiers.
- En usage public, le serveur nécessitera authentification, quotas, limites de requêtes, anti-abus et protection des photos personnelles. La photo transite vers Google Gemini ; ne photographiez pas des données sensibles.

### Test rapide
1. Démarrer le serveur comme d’habitude, rafraîchir la page (Ctrl+F5).
2. Vérifier que le scan code-barres / la recherche par nom fonctionne encore.
3. Chercher un aliment, cliquer sur **✦ Analyser**, vérifier une réponse Gemini.
4. Choisir une photo alimentaire de moins de 4 Mo, cliquer **Identifier**. Vérifier que les chiffres ne sont pas inventés.
5. Tester une photo sur téléphone avec HTTPS, ainsi que les autorisations caméra.


## Mise à jour — Santé simplifiée, sans suivi de l’eau
- Suivi d'eau retiré de l’interface Santé et des réglages.
- Statistiques hebdomadaires conservées dans un panneau repliable pour simplifier la page.
- Conseils rapides ajoutés à la page Santé.
- Les données historiques déjà enregistrées dans votre navigateur sont conservées (non effacées).
- Space AI n’inclut plus les données d’eau dans ses résumés ni dans le contexte envoyé à Gemini.
- Le serveur reste nécessaire pour Gemini (chat, photo), pas pour l’affichage de l’application.
- Sous Windows, ouvrez un nouveau CMD dans le dossier contenant `server.js`, configurez `GEMINI_API_KEY` dans ce CMD (ne partagez jamais la clé), puis lancez `node server.js`. Rendez-vous sur http://localhost:3000.
- Si l'ancien serveur occupe le port 3000, arrêtez-le avec Ctrl+C avant de démarrer la nouvelle version.
- Après mise à jour, actualisez la page (Ctrl+F5 si nécessaire).

## Phase 1 — Explorer (remplace l'onglet Journal)
- Nouveau panneau **Explorer** dans le thème original Space Daily (HTML / CSS / JS, sans React).
- Recherche réelle par nom et par code-barres via Open Food Facts (connexion Internet nécessaire).
- Affichage des calories, protéines, sucres et ingrédients quand ils sont disponibles ; les données absentes sont indiquées comme non renseignées.
- Historique récent et favoris enregistrés localement dans la même origine de navigateur.
- Accès rapide au scanner existant, à Santé et à Space AI.
- Comparateur, additifs et bibliothèque sont indiqués comme **prochainement**, pas comme fonctionnalités actives.
- Les notes de l'ancien Journal ne sont pas effacées ; l'ancienne interface est masquée pour compatibilité et pourra être exportée dans une étape ultérieure.
- Correction d'un problème de la version Santé précédente : une portion de code de navigation et d'événements avait disparu. Elle a été restaurée sans réactiver le suivi d'eau.

### Démarrage
1. Extraire toute l'archive dans un nouveau dossier.
2. Ouvrir CMD dans `Space_Daily_HTML_CSS_JS`.
3. Si tu utilises Gemini, activer ta clé dans **ce CMD** avec `set "GEMINI_API_KEY=..."` (ne jamais partager la valeur).
4. Exécuter `node server.js`, puis ouvrir http://localhost:3000.
5. Si une ancienne version reste affichée, actualiser avec Ctrl+F5 et attendre la mise à jour du cache PWA.

### Vérifications restantes sur ton matériel
- Tester une vraie caméra avec permission et HTTPS sur téléphone.
- Tester Gemini avec ta propre clé active.
- Vérifier les résultats Open Food Facts en ligne et le rendu sur ton téléphone.

## Explorer — modules complémentaires (octobre 2026)

Les sections du nouvel Explorer restent en HTML/CSS/JavaScript natifs, avec le thème Space Daily et le serveur Node existants :
- Comparateur de 2 ou 3 produits récemment consultés (données Open Food Facts stockées localement) ; valeurs manquantes signalées.
- Alternatives locales selon sucres, sel, graisses saturées, fibres ou protéines ; uniquement parmi les produits réellement consultés.
- Lecture de la liste d'ingrédients et repérage textuel de quelques allergènes et codes E (non exhaustif).
- Glossaire de six additifs courants (pédagogique, sans validation réglementaire).
- Bibliothèque scientifique : recherche Crossref en ligne, dépend de la disponibilité de son API.
- Recherche de cosmétiques via l'API Open Beauty Facts par code-barres.
- Profil nutritionnel local avec champs facultatifs, suppression et IMC indicatif.
- Liens ONSSA, indications sur probiotiques, statut explicite des contributions.

Ces outils ne constituent PAS un avis médical, une validation des allergènes, un résultat de laboratoire ni un contrôle officiel. Le score NUTRIX propriétaire n'est pas activé : il nécessiterait des seuils justifiés, une gestion robuste des catégories, des données complètes et des tests scientifiques. Supabase/authentification/partage communautaire, alertes automatiques, tests caméra smartphone et actualisation réglementaire restent à développer. Aucun bouton ne simule ces services.

### Installation
Décompresser l'archive. Ouvrir CMD dans le dossier qui contient server.js, configurer GEMINI_API_KEY dans ce terminal si Space AI est souhaité, puis exécuter `node server.js`. Accéder à `http://localhost:3000`. Les outils non IA fonctionnent sans clé Gemini mais les recherches en ligne nécessitent Internet.

### Vérifications
Syntaxe JavaScript et démarrage HTTP local vérifiés. API publiques, Gemini, caméra et navigateur mobile demandent une vérification réelle sur le poste de l'utilisateur.


## Space Nutri
- New dedicated section inspired by Yuka / MyFitnessPal.
- Product search, dedicated barcode scanner, score /100, additives display, favorites, and comparison of two products.

## Space Nutri V2 — recherche par code-barres et score /100

Démarrer avec **Node.js 18+** : `node server.js`, puis ouvrir `http://localhost:3000` et choisir **Space Nutri**.

- Entrer un code-barres EAN/UPC de 8 à 14 chiffres dans **Code-barres** et cliquer **OK**, ou utiliser **Ouvrir la caméra** (autorisation requise). En cas de refus caméra, la saisie manuelle fonctionne.
- La recherche par nom ou marque et la recherche par code passent par `/api/off` (serveur local). Une connexion Internet est nécessaire. Le serveur contacte **Open Food Facts**, expose les données produit et garde un cache temporaire pour limiter les appels. Les fiches non présentes sont signalées sans score inventé.
- La photo est récupérée d'Open Food Facts seulement si elle existe. La base étant communautaire, des données/photos peuvent être absentes ou inexactes.
- Le **Score Space Daily /100 est indicatif et non officiel** : il utilise en priorité la note Nutri-Score A–E fournie par Open Food Facts, puis un barème de présentation sur 100. En l'absence de Nutri-Score, une heuristique nutritionnelle simplifiée est utilisée seulement si au moins 3 paramètres principaux sont disponibles. Il ne reproduit pas le système propriétaire de Yuka. Les additifs sont affichés à titre descriptif et leur nombre n'est pas présenté comme une mesure de toxicité.
- Important : « aucun additif déclaré » n'est pas identique à « absence d'additifs ». Informations manquantes affichées explicitement.
- La comparaison des scores n'annonce pas de gagnant si une note manque.
- Attribution : données © contributeurs Open Food Facts, licence ODbL. Pour redistribuer une base dérivée, respecter les conditions de la licence et l'attribution. Documentation : https://openfoodfacts.github.io/openfoodfacts-server/api/
- Respecter les limites Open Food Facts et identifier l'application avec un User-Agent approprié avant mise en production publique. Le proxy est adapté à la démonstration locale ; ajouter authentification et protections pour une mise en ligne publique.

**Test exemple** : entrer `3017620422003` (la présence et l'exactitude des données dépendent du service Open Food Facts en temps réel).

**Note de déploiement** : les données locales existantes sont conservées. Après décompression d'une nouvelle version, faire Ctrl+F5 et fermer l'ancien serveur avant de lancer le nouveau.


## V2.4 Stable
Correction des produits null dans les réponses et le cache local, validation des codes avant affichage, nettoyage automatique des favoris/récents et correction du bloc produit. Recherche Open Food Facts nécessite internet et `node server.js`.


## Space Daily 3.0 — Company UI
- Nouvelle identité visuelle cohérente, couleurs sobres et pictogrammes SVG.
- Accueil Santé sous forme de 13 modules. Chaque module s'ouvre dans une fenêtre modale accessible (Échap ou Fermer).
- Les formulaires, identifiants HTML et scripts existants restent en place et conservent le stockage local.
- Space Nutri conserve les corrections de la base V2.4 Stable.
- Démarrer via `node server.js` puis `http://localhost:3000`. Rechargez sans cache après une mise à jour.
