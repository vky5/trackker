import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import Event from '../models/Event';
import { CreateEventInput } from '../schemas/event.schema';

export const createEvent = catchAsync(async (req: Request, res: Response) => {
  // Body is already validated by Zod middleware
  const data: CreateEventInput = req.body;

  const event = await Event.create({
    trackingId: data.trackingId,
    session_id: data.session_id,
    event_type: data.event_type,
    page_url: data.page_url,
    timestamp: new Date(data.timestamp),
    x: data.x ?? null,
    y: data.y ?? null,
  });

  res.status(201).json({
    status: 'success',
    data: event,
  });
});
