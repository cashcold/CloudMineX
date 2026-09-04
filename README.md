# CloudMineX - Digital Cloud Mining Platform

Next-generation enterprise digital cloud mining protocol with live telemetry, mobile money & crypto recharge, contract simulation, referral affiliate milestones, and admin management.

---

## 🚀 Deploying to Vercel (Serverless API + Frontend)

This application is configured for Vercel deployment with serverless functions and static frontend hosting.

### 1. Quick Deploy via Vercel CLI or GitHub
- **Import Git Repository**: Push this project to GitHub/GitLab and click **Import Project** in the [Vercel Dashboard](https://vercel.com).
- **Or Deploy via Vercel CLI**:
  ```bash
  npm i -g vercel
  vercel
  ```

### 2. Build & Output Configuration
The repository includes `vercel.json` pre-configured with:
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Serverless API Function**: `/api` (powered by `api/index.ts`)
- **SPA Rewrites**: Automatically routes all non-API paths to `/index.html`
- **Vercel Cron**: Automatically schedules `/api/cron/process-yields` to calculate mining returns

### 3. Recommended Vercel Environment Variables
Add these in **Vercel Dashboard > Project Settings > Environment Variables**:

| Variable | Description |
|---|---|
| `MONGODB_URI` | *(Recommended)* MongoDB Atlas connection URI for persistent cloud database across serverless invocations |
| `MONGODB_DB_NAME` | Database name (e.g. `CloudMineX`) |
| `JWT_SECRET` | Secure string for signing authentication tokens |
| `ADMIN_DEFAULT_KEY` | Secret access key for the `/admin` console |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | *(Optional)* SMTP credentials for password reset emails |
| `HUBTEL_CLIENT_ID` / `HUBTEL_CLIENT_SECRET` | *(Optional)* Live Mobile Money payment gateway |
| `NOWPAYMENTS_API_KEY` | *(Optional)* Live Crypto deposit gateway |
