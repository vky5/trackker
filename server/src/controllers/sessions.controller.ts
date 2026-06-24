import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import Event from '../models/Event';
import { SessionParamsInput, HeatmapQueryInput } from '../schemas/event.schema';

// Get all sessions with event counts, scoped by trackingId
export const getAllSessions = catchAsync(async (req: Request, res: Response) => {
  const { trackingId } = req.query as HeatmapQueryInput;

  if (!trackingId) {
    throw new AppError('trackingId query parameter is required', 400);
  }

  const sessions = await Event.aggregate([
    {
      $match: { trackingId }
    },
    {
      $group: {
        _id: '$session_id',
        event_count: { $sum: 1 },
        first_seen: { $min: '$timestamp' },
        last_seen: { $max: '$timestamp' }
      }
    },
    {
      $project: {
        _id: 0,
        session_id: '$_id',
        event_count: 1,
        first_seen: 1,
        last_seen: 1
      }
    },
    {
      $sort: { last_seen: -1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: sessions.length,
    data: sessions
  });
});

// Get all events for a specific session (user journey), scoped by trackingId
export const getSessionEvents = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params as SessionParamsInput;
  const { trackingId } = req.query as HeatmapQueryInput;

  if (!trackingId) {
    throw new AppError('trackingId query parameter is required', 400);
  }

  const events = await Event.find({ trackingId, session_id: sessionId })
    .sort({ timestamp: 1 })
    .select('-_id -__v -createdAt -updatedAt');

  res.status(200).json({
    status: 'success',
    trackingId,
    session_id: sessionId,
    results: events.length,
    data: events
  });
});

// Delete all events for a specific session, scoped by trackingId
export const deleteSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params as SessionParamsInput;
  const { trackingId } = req.query as any;

  if (!trackingId) {
    throw new AppError('trackingId query parameter is required', 400);
  }

  const result = await Event.deleteMany({ trackingId, session_id: sessionId });

  res.status(200).json({
    status: 'success',
    message: 'Session events deleted successfully',
    deletedCount: result.deletedCount
  });
});

// Get all unique tracking IDs currently in database
export const getUniqueTrackingIds = catchAsync(async (req: Request, res: Response) => {
  const trackingIds = await Event.distinct('trackingId');
  res.status(200).json({
    status: 'success',
    data: trackingIds
  });
});

// Get all unique tracked pages (URLs) for a specific tracking ID
export const getTrackedPages = catchAsync(async (req: Request, res: Response) => {
  const { trackingId } = req.query as any;

  if (!trackingId) {
    throw new AppError('trackingId query parameter is required', 400);
  }

  const pages = await Event.distinct('page_url', { trackingId });

  res.status(200).json({
    status: 'success',
    trackingId,
    results: pages.length,
    data: pages
  });
});
