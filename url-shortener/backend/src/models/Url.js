import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true
    },
    clicks: {
      type: Number,
      default: 0,
      index: true
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Url = mongoose.model('Url', urlSchema);
