// models/variant.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface VariantDocument extends Document {
  productId: mongoose.Types.ObjectId;
  size: number;
  sku: string;
  price: number;
  originalPrice: number;
  quantity: number;
  inStock: boolean;
  order: number;
}

const variantSchema = new Schema<VariantDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    size: {
      type: Number,
      required: [true, 'Variant size is required'],
      min: [1, 'Size must be greater than 0']
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0']
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0.01, 'Original price must be greater than 0']
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative']
    },
    inStock: {
      type: Boolean,
      default: function() {
        return (this as VariantDocument).quantity > 0;
      }
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
variantSchema.index({ productId: 1, sku: 1 });
variantSchema.index({ productId: 1, order: 1 });

// Pre-save hook to update inStock status
variantSchema.pre('save', function(next) {
  this.inStock = this.quantity > 0;
  next();
});

export const VariantModel = mongoose.model<VariantDocument>('Variant', variantSchema);