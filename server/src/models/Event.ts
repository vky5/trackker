import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: Date;
  x?: number | null;
  y?: number | null;
}

const eventSchema: Schema = new Schema(
  {
    session_id: {
      type: String,
      required: true,
      index: true,
    },
    event_type: {
      type: String,
      required: true,
      enum: ['page_view', 'click'],
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes
eventSchema.index({ session_id: 1, timestamp: 1 });
eventSchema.index({ page_url: 1, event_type: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);
