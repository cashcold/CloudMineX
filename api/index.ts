import type { Request, Response } from 'express';
import { app, initializeApp } from '../server';

export default async function handler(req: Request, res: Response) {
  try {
    await initializeApp();
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Function Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Serverless function failed to initialize',
      details: err?.message || String(err),
    });
  }
}

