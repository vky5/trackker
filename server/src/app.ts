import express, { Request, Response, NextFunction } from 'express';
import connectDB from './db';
import AppError from './utils/appError';
import { errorHandler } from './middleware/errorHandler';
import eventRouter from './routes/eventRoutes';

const app = express();

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Trackker server running' });
});

// Ensure MongoDB is connected before handling API traffic (serverless-safe)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api', eventRouter);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

export default app;