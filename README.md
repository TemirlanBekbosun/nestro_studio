<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/162163c3-c15f-402f-9f35-0b21b51b8a29

## Run Locally

**Prerequisites:** Node.js


1. Install dependencies:
   `npm install`
2. Set up Gemini locally with `npm run setup:ai`. Enter a new Gemini API key from Google AI Studio when prompted; input is hidden, and the key is saved to `.env.local`, which is ignored by Git. To configure manually, copy `.env.example` to `.env.local` and fill in `GEMINI_API_KEY`.
3. Run the app:
   `npm run dev`

The “Подобрать архитектуру с ИИ” action uses the server-side `/api/ai/architecture` endpoint; the API key is never sent to the browser. If a model is temporarily overloaded, the server tries stable fallback models automatically. Restart the server after changing `.env.local`.

For CMS access, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local`, then restart the server. Both values are kept locally and excluded from Git.
