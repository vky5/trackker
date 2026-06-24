import { z } from 'zod';

export const createEventSchema = z.object({
  trackingId: z.string().min(3).max(100),
  session_id: z.string().min(10).max(100),
  event_type: z.enum(['page_view', 'click']),
  page_url: z.string().min(1),
  timestamp: z.string().or(z.date()).or(z.number()),
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
}).strict().refine((data) => {
  if (data.event_type === 'click') {
    return typeof data.x === 'number' && typeof data.y === 'number';
  }
  return true;
}, {
  message: 'x and y coordinates are required for click events',
  path: ['x', 'y'],
}).refine((data) => {
  if (data.event_type === 'page_view') {
    return (data.x === undefined || data.x === null) && (data.y === undefined || data.y === null);
  }
  return true;
}, {
  message: 'x and y should not be provided for page_view events',
  path: ['x', 'y'],
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export type SessionParamsInput = z.infer<typeof sessionParamsSchema>;

export const heatmapQuerySchema = z.object({
  page_url: z.string().min(1),
  trackingId: z.string().min(3).max(100).optional(), // optional for now, but good to support
});

export type HeatmapQueryInput = z.infer<typeof heatmapQuerySchema>;
