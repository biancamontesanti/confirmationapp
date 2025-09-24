import mongoose, { Schema, Document } from 'mongoose';

export interface IHost extends Document {
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

const HostSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model<IHost>('Host', HostSchema);
