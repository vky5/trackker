import express, { Request, Response, NextFunction } from 'express';
import connectDB from './db';
import AppError from './utils/appError';
import { errorHandler } from './middleware/errorHandler';
import eventRouter from './routes/eventRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Enable CORS
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

// Connect to MongoDB
connectDB();

// Basic health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Trackker server running' });
});

// Mount all event-related routes under /api
app.use('/api', eventRouter);

// 404 handler for undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler - must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
