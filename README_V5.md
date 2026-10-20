# Space Daily V5 — Scientific Edition

Run Node.js 18+ locally: `node server.js`. Gemini (optional, configured server-side):

Windows CMD:
```bat
set "GEMINI_API_KEY=YOUR_KEY"
set "GEMINI_MODEL=YOUR_WORKING_MODEL"
node server.js
```

Never place the API key in frontend files or share it. Select the model verified in your own Google AI Studio account.

## Features
- Product barcode/name search using Open Food Facts and product view.
- Gemini-powered product analysis and comparison, based on source product fields.
- Photo nutrition label reading into editable fields. **Only transfer to custom food after confirming all fields and 100g / 100ml basis.**
- Space Intelligence chat with nutrition-day context from recorded totals, sleep/activity.
- Scientific laboratory with links to Nutri-Score, NOVA, EFSA and Open Food Facts.
- Keeps health, saved foods, recipes, favorites, score, scanner and history from V4.

## Limits
- Space Daily /100 and daily score are educational estimates, not validated clinical/scientific scoring systems.
- AI can misread labels or hallucinate; users must verify the packaging.
- Count of additives alone does not prove safety/risk. Color badges are visual attention markers, not toxicology grades.
- The live Google Gemini and Open Food Facts APIs cannot be reliably tested without credentials/network and may return errors or throttling.
