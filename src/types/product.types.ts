import mongoose, { Document } from "mongoose";

// Interfacesexport
interface IImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface ISpecification {
  label: string;
  value: string;
}

export interface IReview {
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  title?: string;
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScentNote {
  type: 'top' | 'middle' | 'base';
  notes: string[];
}

export interface IVariant {
  size: number; // in ml
  sku: string;
  price: number;
  originalPrice: number;
  quantity: number;
  inStock: boolean;
}

// Product Interface
export interface IProduct extends Document {
  // Basic Information
  title: string;
  slug: string;
  sku: string;
  brand: string;
  description: string;
  shortDescription?: string;

  // Media
  images: IImage[];
  thumbnail: string;
  coverImage: string;
  video?: string;

  // Pricing & Inventory
  variants: IVariant[];
  basePrice: number;
  originalPrice: number;
  discount: number;
  discountEndDate?: Date;
  quantity: number;
  inStock: boolean;

  // Categories & Organization
  category: string[];
  subCategory?: string[];
  tags: string[];
  collections?: string[];
  gender?: 'male' | 'female' | 'unisex' | "all";

  // Perfume Specific
  concentration: 'Parfum' | 'EDP' | 'EDT' | 'EDC';
  scentNotes: IScentNote[];
  sillage?: 'Intimate' | 'Moderate' | 'Strong' | 'Enormous';
  longevity?: 'Poor' | 'Moderate' | 'Long Lasting' | 'Very Long Lasting';
  seasonality?: string[];
  timeOfDay?: string[];
  occasions?: string[];

  // Product Details
  specifications: ISpecification[];
  features: string[];
  ingredients: string[];
  madeIn: string;
  launchYear?: number;
  perfumer?: string;

  // Ratings & Reviews
  rating: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  reviews: IReview[];

  // Marketing & Sales
  isHot: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isLimited?: boolean;

  // SEO & Meta
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];

  updateStock(quantity: number): Promise<void>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}