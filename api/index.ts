import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { apiRouter } from '../server/routes/api';
import { connectMongoDB, isMongoConnected } from '../server/config/dbMongo';
import { db } from '../server/config/dbStore';
import { processMiningYields } from '../server/services/rewardEngine';

const app = express();

// Configure CORS middleware for Vercel
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle Vercel query rewrites (e.g. when Vercel rewrites /api/(.*) -> /api?0=$1)
app.use((req, res, next) => {
  if (req.url.startsWith('/api?') && req.query && typeof req.query[0] === 'string') {
    const subpath = req.query[0];
    req.url = subpath.startsWith('/') ? `/api${subpath}` : `/api/${subpath}`;
  }
  next();
});

// Throttled background processor for serverless environments
let isInitialized = false;
let lastYieldProcessingTime = 0;
const YIELD_PROCESSING_COOLDOWN = 60 * 1000; // 60 seconds

async function ensureServerlessInit() {
  if (!isInitialized) {
    const connected = await connectMongoDB();
    if (connected) {
      await db.syncFromMongo();
    }
    isInitialized = true;
  }

  const now = Date.now();
  if (now - lastYieldProcessingTime > YIELD_PROCESSING_COOLDOWN) {
    lastYieldProcessingTime = now;
    try {
      processMiningYields();
    } catch (err) {
      console.error('[Vercel Serverless] Mining yield calculation error:', err);
    }
  }
}

// Middleware to ensure DB and yields are initialized per invocation
app.use(async (req, res, next) => {
  try {
    await ensureServerlessInit();
  } catch (e) {
    console.error('[Vercel Serverless] Init error:', e);
  }
  next();
});

// Vercel Cron Job endpoint: /api/cron/process-yields
app.get(['/api/cron/process-yields', '/cron/process-yields'], async (req: Request, res: Response) => {
  try {
    await ensureServerlessInit();
    const result = processMiningYields();
    res.json({
      success: true,
      message: 'Vercel cron processed mining yields successfully',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error processing yields' });
  }
});

// Health check endpoint
app.get(['/api/health', '/health', '/api', '/'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'CloudMineX Digital Mining Dashboard',
    mode: 'Vercel Serverless API Ready',
    mongoConnected: isMongoConnected(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes for both prefixed and stripped routes
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
