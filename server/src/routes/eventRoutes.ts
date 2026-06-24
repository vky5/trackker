import express from 'express';
import { createEvent } from '../controllers/events.controller';
import { getAllSessions, getSessionEvents, deleteSession, getUniqueTrackingIds, getTrackedPages } from '../controllers/sessions.controller';
import { getClickData } from '../controllers/clicks.controller';
import { validate } from '../middleware/validate';
import { 
  createEventSchema, 
  sessionParamsSchema, 
  heatmapQuerySchema 
} from '../schemas/event.schema';

const router = express.Router();

// Event ingestion
router.post('/events', validate(createEventSchema), createEvent);

// Unique tracking IDs list
router.get('/tracking-ids', getUniqueTrackingIds);

// Tracked pages list for a scope
router.get('/tracked-pages', getTrackedPages);

// Sessions list
// (trackingId optional in query for scoping - validation can be added later if strict)
router.get('/sessions', getAllSessions);

router.get('/sessions/:sessionId', validate(sessionParamsSchema, 'params'), getSessionEvents);

// Delete session events
router.delete('/sessions/:sessionId', validate(sessionParamsSchema, 'params'), deleteSession);

// Click data for heatmap
router.get('/clicks', validate(heatmapQuerySchema, 'query'), getClickData);

export default router;
