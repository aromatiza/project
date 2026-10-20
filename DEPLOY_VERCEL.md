# Space Daily V5 — Vercel / GitHub

Le dossier **public/** contient tous les fichiers visibles dans le navigateur.
`server.ts` est le point d’entrée Node.js que Vercel détecte ; `server.js` traite les routes `/api/...` et sert aussi les fichiers de `public/`.

## Publication
1. Décompresser le ZIP sur l’ordinateur.
2. Sur GitHub, ouvrir le dépôt existant > Add file > Upload files. Déposer **le contenu** du dossier Space_Daily_Pro_V5_Scientific à la racine du dépôt et confirmer Commit changes. Important: `public/` doit contenir `index.html`, `style.css`, `script.js`, et les autres fichiers front-end.
3. Si le dépôt contient déjà un ancien `index.html`, ancien `style.css`, etc. à la racine, les supprimer après confirmation du bon fonctionnement (ou les garder temporairement sans les utiliser). Vérifier qu'aucun ancien `vercel.json` ne redirige les chemins.
4. Vercel > Project > Settings > Environment Variables : `GEMINI_API_KEY` (secret), `GEMINI_MODEL` (identifiant vérifié dans Google AI Studio). Ne jamais publier une clé dans GitHub.
5. Vercel > Deployments : attendre Ready puis tester `/`, `/style.css`, `/script.js` et `/api/off/search?q=lait`. Tester chat et image avec précaution.

La page utilise le stockage local du navigateur : chaque appareil garde ses propres données. L’app nécessite Internet pour Gemini et Open Food Facts. Les fonctionnalités caméra exigent HTTPS et autorisation caméra.
