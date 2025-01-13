// models/category.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  meta: {
    title: string;
    description: string;
    keywords: string;
  };
  image?: {
    url: string;
    alt: string;
    key?: string; // For storage reference
  };
  order: number;
  level: number;
  path: string; // Store full path for easier tree traversal
  isLeaf: boolean;
  productCount: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    meta: {
      title: String,
      description: String,
      keywords: String
    },
    image: {
      url: String,
      alt: String,
      key: String
    },
    order: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 0
    },
    path: {
      type: String,
      default: ''
    },
    isLeaf: {
      type: Boolean,
      default: true
    },
    productCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
categorySchema.index({ parentId: 1, slug: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ level: 1, order: 1 });

// Pre save middleware
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true });
  }
  
  if (this.isModified('parentId')) {
    // Update path and level
    if (this.parentId) {
      const parent = await this.model('Category').findById(this.parentId);
      if (parent) {
        this.path = `${(parent as unknown as CategoryDocument).path}/${this._id}`;
        this.level = (parent as unknown as CategoryDocument).level + 1;
      }
    } else {
      this.path = `/${this._id}`;
      this.level = 0;
    }
  }

  next();
});

// Virtual populate
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

categorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

// Instance methods
categorySchema.methods.updateProductCount = async function() {
  const productCount = await mongoose.model('Product').countDocuments({ 
    category: this._id,
    status: 'active' 
  });
  this.productCount = productCount;
  await this.save();
};

export const CategoryModel = mongoose.model<CategoryDocument>('Category', categorySchema);