// models/wishlist.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface WishlistDocument extends Document {
  user: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  updatedAt: Date;
}

const wishlistSchema = new Schema<WishlistDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Index for performance
wishlistSchema.index({ user: 1 });

export const WishlistModel = mongoose.model<WishlistDocument>('Wishlist', wishlistSchema);
