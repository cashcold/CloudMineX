import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api';
import { connectMongoDB, isMongoConnected } from './config/dbMongo';
import { db } from './config/dbStore';
import { processMiningYields } from './services/rewardEngine';

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

// Handle Vercel query rewrites & URL normalizations
app.use((req, res, next) => {
  // If Vercel rewrites /api/(.*) -> /api/index.js?0=$1 or /api/index?0=$1
  if (req.query && typeof req.query[0] === 'string') {
    const subpath = req.query[0];
    req.url = subpath.startsWith('/') ? `/api${subpath}` : `/api/${subpath}`;
  }

  // If Vercel passes dynamic catch-all route params
  if (req.query && req.query.slug) {
    const slug = Array.isArray(req.query.slug) ? req.query.slug.join('/') : req.query.slug;
    if (slug && typeof slug === 'string' && !req.url.includes(slug)) {
      req.url = `/api/${slug}`;
    }
  }
  if (req.query && req.query.path) {
    const p = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    if (p && typeof p === 'string' && !req.url.includes(p)) {
      req.url = `/api/${p}`;
    }
  }

  // If Vercel rewrite preserves function name in URL
  if (req.url.startsWith('/api/index.js')) {
    const cleaned = req.url.replace(/^\/api\/index\.js/, '');
    req.url = cleaned.startsWith('/') ? `/api${cleaned}` : (cleaned ? `/api/${cleaned}` : '/api');
  } else if (req.url.startsWith('/api/index')) {
    const cleaned = req.url.replace(/^\/api\/index/, '');
    req.url = cleaned.startsWith('/') ? `/api${cleaned}` : (cleaned ? `/api/${cleaned}` : '/api');
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

// Mount API routes for both prefixed (/api/...) and direct route matching
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
