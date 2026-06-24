import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import Event from '../models/Event';
import { HeatmapQueryInput } from '../schemas/event.schema';

// Get click positions for a specific page (for heatmap), scoped by trackingId
export const getClickData = catchAsync(async (req: Request, res: Response) => {
  const { page_url, trackingId } = req.query as HeatmapQueryInput;

  if (!trackingId) {
    throw new AppError('trackingId query parameter is required', 400);
  }

  if (!page_url) {
    throw new AppError('page_url query parameter is required', 400);
  }

  const clicks = await Event.find({
    trackingId,
    page_url,
    event_type: 'click'
  })
    .sort({ timestamp: 1 })
    .select('x y timestamp -_id');

  res.status(200).json({
    status: 'success',
    trackingId,
    page_url,
    results: clicks.length,
    data: clicks
  });
});
