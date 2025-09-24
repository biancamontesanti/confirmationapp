import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGuest extends Document {
  event_id: Types.ObjectId;
  name: string;
  email: string;
  response?: 'yes' | 'no';
  plus_ones?: string;
  responded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const GuestSchema: Schema = new Schema({
  event_id: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  response: {
    type: String,
    enum: ['yes', 'no'],
    default: null
  },
  plus_ones: {
    type: String,
    default: '[]'
  },
  responded_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for faster queries
GuestSchema.index({ event_id: 1, email: 1 }, { unique: true });

export default mongoose.model<IGuest>('Guest', GuestSchema);
