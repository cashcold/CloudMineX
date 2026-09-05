import type { Request, Response } from 'express';
import { app, initializeApp } from '../server';

export default async function handler(req: Request, res: Response) {
  await initializeApp();
  return app(req, res);
}
