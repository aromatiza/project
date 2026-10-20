# Vérifications de Space Nutri V2

1. `node --check server.js` et `node --check space-nutri.js` : syntaxe JS.
2. `node server.js` : ouvrir http://localhost:3000, naviguer sur Space Nutri.
3. Code d'essai : `3017620422003` — vérifier le nom, la photo si disponible, le score et les champs manquants.
4. Recherche texte : essayer un nom de produit ; sélectionner un résultat.
5. Chercher une référence inconnue : le produit n'existe pas, le score doit rester absent.
6. Scanner caméra : doit être testé sur appareil physique, navigateur HTTPS/localhost avec permission caméra.
7. Comparer A et B ; noter qu'un score indisponible empêche la recommandation automatique.
8. Le produit, l'image et les nutriments dépendent d'Open Food Facts accessible via Internet ; test de bout en bout requis dans l'environnement cible.
