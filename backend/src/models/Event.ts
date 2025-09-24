import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  host_id: Types.ObjectId;
  name: string;
  host_name: string;
  date_time: string;
  location: string;
  dress_code?: string;
  event_type: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

const EventSchema: Schema = new Schema({
  host_id: {
    type: Schema.Types.ObjectId,
    ref: 'Host',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  host_name: {
    type: String,
    required: true,
    trim: true
  },
  date_time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  dress_code: {
    type: String,
    default: '',
    trim: true
  },
  event_type: {
    type: String,
    required: true,
    trim: true
  },
  image_url: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model<IEvent>('Event', EventSchema);
