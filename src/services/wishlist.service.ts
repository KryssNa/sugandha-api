import mongoose from 'mongoose';
import Product from '../models/product.modal';
import { WishlistDocument, WishlistModel } from '../models/wishlist.model';
import { AppError } from '../utils/AppError';

export class WishlistService {
  static async getWishlist(userId: string): Promise<WishlistDocument> {
    const wishlist = await WishlistModel.findOne({ user: userId })
      .populate('products', 'name image price inStock rating');

    if (!wishlist) {
      // Create new wishlist if doesn't exist
      return WishlistModel.create({
        user: userId,
        products: []
      });
    }

    return wishlist;
  }

  static async addToWishlist(
    userId: string,
    productId: string
  ): Promise<WishlistDocument> {
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw AppError.NotFound('Product not found');
    }

    const wishlist = await this.getWishlist(userId);

    // Check if product already in wishlist
    if (wishlist.products.includes(new mongoose.Types.ObjectId(productId))) {
      throw AppError.BadRequest('Product already in wishlist');
    }

    // Add product to wishlist
    wishlist.products.push(new mongoose.Types.ObjectId(productId));
    await wishlist.save();

    return wishlist.populate('products', 'name image price inStock rating');
  }

  static async removeFromWishlist(
    userId: string,
    productId: string
  ): Promise<WishlistDocument> {
    const wishlist = await this.getWishlist(userId);

    wishlist.products = wishlist.products.filter(
      product => product.toString() !== productId
    );

    await wishlist.save();
    return wishlist.populate('products', 'name image price inStock rating');
  }

  static async moveToCart(
    userId: string,
    productId: string,
    cartService: any
  ): Promise<void> {

    try {
      // Remove from wishlist and add to cart
      await Promise.all([
        this.removeFromWishlist(userId, productId),
        cartService.addToCart(userId, productId, 1)
      ]);

    } catch (error) {
      throw error;
    }
  }

  static async clearWishlist(userId: string): Promise<void> {
    await WishlistModel.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } }
    );
  }

  static async isProductInWishlist(
    userId: string,
    productId: string
  ): Promise<boolean> {
    const wishlist = await WishlistModel.findOne({
      user: userId,
      products: new mongoose.Types.ObjectId(productId)
    });

    return !!wishlist;
  }
}