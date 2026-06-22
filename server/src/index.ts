import express, { Request, Response, NextFunction } from 'express';
import connectDB from './db';
import Event from './models/Event';
import AppError from './utils/appError';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Basic health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Trackker server running' });
});

// Test endpoint (for development)
app.post('/api/test-event', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = new Event({
      session_id: req.body.session_id || `test-session-${Date.now()}`,
      event_type: req.body.event_type || 'page_view',
      page_url: req.body.page_url || 'http://localhost/demo',
      timestamp: new Date(),
      x: req.body.x ?? null,
      y: req.body.y ?? null,
    });

    const savedEvent = await event.save();
    res.status(201).json({ success: true, data: savedEvent });
  } catch (err) {
    next(err);
  }
});

// 404 handler for undefined routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler - must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
