// types/category.types.ts
import { z } from 'zod';
import { Types } from 'mongoose';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface CategoryMeta {
  title: string;
  description: string;
  keywords: string;
}

export interface CategoryImage {
  url: string;
  alt: string;
  key?: string;
}

export interface Category {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parentId?: Types.ObjectId | null;
  status: CategoryStatus;
  meta: CategoryMeta;
  image?: CategoryImage;
  order: number;
  level: number;
  path: string;
  isLeaf: boolean;
  productCount: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  children?: Category[];
  parent?: Category;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  meta?: CategoryMeta;
  image?: CategoryImage;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string;
  status?: CategoryStatus;
  meta?: Partial<CategoryMeta>;
  image?: CategoryImage;
  order?: number;
}

export interface ReorderCategoriesInput {
  parentId: string | null;
  orderedIds: string[];
}