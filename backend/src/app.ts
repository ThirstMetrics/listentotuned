import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import podcastsRouter from './routes/podcasts';
import episodesRouter from './routes/episodes';
import feedsRouter from './routes/feeds';
import usersRouter from './routes/users';
import healthRouter from './routes/health';
import analyticsRouter from './routes/analytics';

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  _res.on('finish', () => {
    const duration = Date.now() - start;
    const status = _res.statusCode;
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} ${status} ${duration}ms`);
  });

  next();
});

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Tuned API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      podcasts: '/api/podcasts',
      episodes: '/api/episodes',
      feeds: '/api/feeds',
      users: '/api/users',
      analytics: '/api/analytics',
    },
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/health', healthRouter);
app.use('/api/podcasts', podcastsRouter);
app.use('/api/episodes', episodesRouter);
app.use('/api/feeds', feedsRouter);
app.use('/api/users', usersRouter);
app.use('/api/analytics', analyticsRouter);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
interface ApiError extends Error {
  statusCode?: number;
}

app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export default app;
