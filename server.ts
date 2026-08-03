import express from 'express';
import cors from 'cors'; // 1. Import cors
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api';
import { connectMongoDB } from './server/config/dbMongo';
import { db } from './server/config/dbStore';
// import { db } from './server/config/dbStore';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 2. Configure CORS middleware
  const allowedOrigins = [
    'https://cloud-mine-x.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like Postman or server-to-server) or from allowed origins
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy'));
        }
      },
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

  // API Routes
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'CloudMineX Digital Mining Dashboard', mode: 'Demo / Production Ready' });
  });

  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloudMineX Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CloudMineX server:', err);
});