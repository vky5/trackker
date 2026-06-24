import mongoose, { Schema, Document } from 'mongoose';

export interface IElementInfo {
  tagName: string;
  id?: string | null;
  className?: string | null;
  text?: string | null;
  selector?: string | null;
}

export interface IEvent extends Document {
  trackingId: string;   // identifies which website / client this data belongs to
  session_id: string;
  event_type: 'page_view' | 'click' | 'scroll';
  page_url: string;
  timestamp: Date;
  x?: number | null;
  y?: number | null;
  element?: IElementInfo | null;
}

const eventSchema: Schema = new Schema(
  {
    trackingId: {
      type: String,
      required: true,
      index: true,
    },
    session_id: {
      type: String,
      required: true,
      index: true,
    },
    event_type: {
      type: String,
      required: true,
      enum: ['page_view', 'click', 'scroll'],
      index: true,
    },
    page_url: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    x: {
      type: Number,
      default: null,
    },
    y: {
      type: Number,
      default: null,
    },
    element: {
      tagName: { type: String, default: null },
      id: { type: String, default: null },
      className: { type: String, default: null },
      text: { type: String, default: null },
      selector: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries scoped by trackingId
eventSchema.index({ trackingId: 1, session_id: 1, timestamp: 1 });
eventSchema.index({ trackingId: 1, page_url: 1, event_type: 1 });
eventSchema.index({ trackingId: 1, session_id: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);
