// src/models/Product.ts
import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../types/product.types';

// Schema Definition
const ProductSchema = new Schema<IProduct>({
  // Basic Information
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true },
  sku: { type: String, required: true, unique: true },
  brand: { type: String, required: true, index: true },
  description: { type: String, required: true },
  shortDescription: String,

  // Media
  images: [{
    id: String,
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  thumbnail: { type: String, required: true },
  coverImage: { type: String, required: true },
  video: String,

  // Pricing & Inventory
  variants: [{
    size: { type: Number, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 0 },
    inStock: { type: Boolean, default: true }
  }],
  basePrice: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountEndDate: Date,
  quantity: { type: Number, required: true, min: 0 },
  inStock: { type: Boolean, default: true },

  // Categories & Organization
  category: [{ type: String, required: true }],
  subCategory: [String],
  tags: [String],
  collections: [String],
  gender: {
    type: String,
    enum: ['male', 'female', 'unisex'],
    required: true
  },

  // Perfume Specific
  concentration: {
    type: String,
    enum: ['Parfum', 'EDP', 'EDT', 'EDC'],
    required: true
  },
  scentNotes: [{
    type: {
      type: String,
      enum: ['top', 'middle', 'base'],
      required: true
    },
    notes: [{ type: String, required: true }]
  }],
  sillage: {
    type: String,
    enum: ['Intimate', 'Moderate', 'Strong', 'Enormous']
  },
  longevity: {
    type: String,
    enum: ['Poor', 'Moderate', 'Long Lasting', 'Very Long Lasting']
  },
  seasonality: [String],
  timeOfDay: [String],
  occasions: [String],

  // Product Details
  specifications: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }],
  features: [String],
  ingredients: [String],
  madeIn: { type: String, required: true },
  launchYear: Number,
  perfumer: String,

  // Ratings & Reviews
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  reviews: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    title: String,
    verifiedPurchase: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],

  // Marketing & Sales
  isHot: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isLimited: { type: Boolean, default: false },

  // SEO & Meta
  metaTitle: String,
  metaDescription: String,
  keywords: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ProductSchema.index({ title: 'text', description: 'text', brand: 'text' });
ProductSchema.index({ brand: 1, 'variants.price': 1 });
ProductSchema.index({ category: 1, gender: 1 });
ProductSchema.index({ isHot: 1, isFeatured: 1, isNewArrival: 1 });

// Virtuals
ProductSchema.virtual('discountPercentage').get(function () {
  return Math.round(((this.originalPrice - this.basePrice) / this.originalPrice) * 100);
});

// Methods
ProductSchema.methods.updateStock = async function (quantity: number): Promise<void> {
  this.quantity += quantity;
  this.inStock = this.quantity > 0;
  await this.save();
};

// Export model
const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;