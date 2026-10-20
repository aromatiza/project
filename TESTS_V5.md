# Tests V5 effectués (environnement local)
- `node --check` sur tous les fichiers JavaScript : OK.
- HTTP GET `/`, `/space-v5.js` : 200.
- GET `/api/off/product/notbarcode` : 400 attendu.
- GET `/api/ai/chat` : 405 attendu.
- POST `/api/ai/chat` sans GEMINI_API_KEY : 503 attendu.
- Contrôle présence des composants V5 dans index.html : OK.

Non testés ici : connexion réelle Gemini et Open Food Facts, webcam / mobile, vision-model, capture de photos et tests visuels multi-navigateurs. Nécessitent une connexion réseau, un modèle autorisé et un appareil.
