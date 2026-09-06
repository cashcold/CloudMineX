# CloudMineX Project Memory & Guidelines

## Vercel Serverless Architecture & Deployment Rules
- **Serverless API Bundling**:
  - The Vercel serverless entrypoint is `api/index.js`.
  - It is bundled from `server/serverless.ts` using:
    `esbuild server/serverless.ts --bundle --platform=node --format=esm --packages=external --outfile=api/index.js`
  - **CRITICAL**: Do NOT replace `api/index.js` with an unbundled `api/index.ts` importing `../server`. In Node.js ES Modules (`"type": "module"`), importing `../server` attempts to resolve the `/server` directory and crashes with `ERR_UNSUPPORTED_DIR_IMPORT` (Vercel error `FUNCTION_INVOCATION_FAILED`).
- **`vercel.json` Build Command**:
  - Always keep `"buildCommand": "npm run build"` in `vercel.json` so that both Vite (client) and esbuild (serverless API bundle) are compiled on every deployment.
  - Rewrites must map `/api/(.*)` to `/api` and fallback non-API routes to `/index.html`.

## Client & Activity Stream Resilience
- **LiveActivityStream**:
  - Always pre-seed initial transactions on component mount (`createInitialActivities()`) so the UI ticker is populated instantly before network resolution.
  - `activityService.getActivityStream()` must catch network errors safely and return `{ success: false, activities: [] }` rather than rejecting with `Network Error`.
  - Never log unhandled network errors to `console.error` during routine background polling.

## Local Server & Container Runtime
- `server.ts` runs the full-stack server on port 3000.
- Vite middleware is dynamically imported only in development when `process.env.VERCEL` is not set.
- All rewards and mining yields are processed via `rewardEngine.ts`.
