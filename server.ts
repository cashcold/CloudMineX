import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // 1. Import cors
import path from 'path';
import { apiRouter } from './server/routes/api';
import { connectMongoDB } from './server/config/dbMongo';
import { db } from './server/config/dbStore';
import { processMiningYields } from './server/services/rewardEngine';

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

let initializationPromise: Promise<void> | undefined;

export function initializeApp() {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
  // 2. Configure CORS middleware
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Initialize MongoDB connection if MONGO_URI is set
  const connected = await connectMongoDB();
  if (connected) {
    await db.syncFromMongo();
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // URL normalizer for Vercel rewrites
  app.use((req, res, next) => {
    if (req.query && typeof req.query[0] === 'string') {
      const sub = req.query[0];
      req.url = sub.startsWith('/') ? `/api${sub}` : `/api/${sub}`;
    }
    next();
  });

  // API Routes - mounted for both /api/* and direct subpaths
  app.use('/api', apiRouter);
  app.use(apiRouter);

  // Health check endpoint
  app.get(['/api/health', '/health', '/api'], (req, res) => {
    res.json({ status: 'ok', app: 'CloudMineX Digital Mining Dashboard', mode: 'Demo / Production Ready' });
  });

  // Client SPA serving only when running standalone server (not inside Vercel serverless)
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  })();

  return initializationPromise;
}

async function startServer() {
  await initializeApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloudMineX Server running on http://0.0.0.0:${PORT}`);

    // Process any mining yields immediately on boot
    try {
      const initResult = processMiningYields();
      if (initResult.creditedTotal > 0 || initResult.contractsCompleted > 0) {
        console.log(`[RewardEngine] Initialized: Credited GHS ${initResult.creditedTotal.toFixed(2)}, ${initResult.contractsCompleted} contracts matured.`);
      }
    } catch (e) {
      console.error('[RewardEngine] Init yield processing error:', e);
    }

    // Auto-calculate and credit 24h mining yields every 60 seconds
    setInterval(() => {
      try {
        const tickResult = processMiningYields();
        if (tickResult.creditedTotal > 0 || tickResult.contractsCompleted > 0) {
          console.log(`[RewardEngine] Auto-tick: Credited GHS ${tickResult.creditedTotal.toFixed(2)} to users, ${tickResult.contractsCompleted} matured.`);
        }
      } catch (err) {
        console.error('[RewardEngine] Auto-tick error:', err);
      }
    }, 60 * 1000);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start CloudMineX server:', err);
  });
}