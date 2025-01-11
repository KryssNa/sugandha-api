import mongoose from 'mongoose';
import { CartDocument, CartModel } from '../models/cart.model';
import Product from '../models/product.modal';
import { AppError } from '../utils/AppError';

export class CartService {

  private static readonly GUEST_CART_EXPIRY_DAYS = 7;
  private static readonly MAX_ITEMS_PER_CART = 20;

  //   static async getCart(userId: string): Promise<CartDocument> {
  //     const cart = await CartModel.findOne({ user: userId })
  //       .populate('items.product', 'name image price inStock');

  //     if (!cart) {
  //       // Create new cart if doesn't exist
  //       return CartModel.create({
  //         user: userId,
  //         items: [],
  //         totals: {
  //           subtotal: 0,
  //           shipping: 0,
  //           tax: 0,
  //           total: 0
  //         }
  //       });
  //     }

  //     return cart;
  //   }
  static async getCart(userId?: string,): Promise<CartDocument> {
    let cart: CartDocument | null = null;

    if (userId) {
      cart = await CartModel.findOne({ user: userId })
        .populate('items.product', 'title thumbnail basePrice inStock');
    }
    //  else if (sessionId) {
    //     cart = await CartModel.findOne({
    //         sessionId,
    //         expiresAt: { $gt: new Date() }
    //     }).populate('items.product', 'title thumbnail basePrice inStock');

    // }

    if (!cart) {
      // Create new cart
      const expiresAt = userId ? undefined :
        new Date(Date.now() + this.GUEST_CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      cart = await CartModel.create({
        user: userId,
        items: [],
        expiresAt,
        totals: { subtotal: 0, shipping: 0, tax: 0, total: 0 }
      });
    }

    return cart;
  }
  static async validateStock(productId: string, quantity: number): Promise<void> {
    const product = await Product.findById(productId);

    if (!product) {
      throw AppError.NotFound('Product not found');
    }

    if (!product.inStock) {
      throw AppError.BadRequest('Product is out of stock');
    }

    if (product.quantity < quantity) {
      throw AppError.BadRequest(
        `Only ${product.quantity} units available`
      );
    }
  }
  static async addToCart(
    productId: string,
    quantity: number,
    userId?: string,

  ): Promise<CartDocument> {
    // Start transaction
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      // Validate stock
      await this.validateStock(productId, quantity);

      const cart = await this.getCart(userId);

      // Check maximum items limit
      if (cart.items.length >= this.MAX_ITEMS_PER_CART) {
        throw AppError.BadRequest('Cart has reached maximum items limit');
      }


      // Get product price
      const product = await Product.findById({ _id: productId });
      if (!product) {
        throw AppError.NotFound('Product not found');
      }

      // Add or update item
      const existingItem = cart.items.find(
        item => item.product._id.toString() === productId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        await this.validateStock(productId, newQuantity);
        existingItem.quantity = newQuantity;
      } else {
        cart.items.push({
          product: new mongoose.Types.ObjectId(productId),
          quantity,
          price: product.basePrice
        });
      }

      await cart.save();
      // await session.commitTransaction();

      return cart.populate('items.product');
    } catch (error) {
      // await session.abortTransaction();
      throw error;
    }
  }

  static async mergeGuestCart(
    userId: string,
  ): Promise<CartDocument> {
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      const [userCart, guestCart] = await Promise.all([
        this.getCart(userId),
        this.getCart(undefined)
      ]);

      // Nothing to merge
      if (guestCart.items.length === 0) {
        // await session.commitTransaction();
        return userCart;
      }

      // Merge items with stock validation
      for (const item of guestCart.items) {
        await this.validateStock(
          item.product._id.toString(),
          item.quantity
        );

        const existingItem = userCart.items.find(
          userItem => userItem.product._id.toString() === item.product._id.toString()
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;
          await this.validateStock(
            item.product._id.toString(),
            newQuantity
          );
          existingItem.quantity = newQuantity;
        } else {
          userCart.items.push(item);
        }
      }

      // Save merged cart and delete guest cart
      await Promise.all([
        userCart.save(),
        // CartModel.deleteOne({ sessionId }, { session })
      ]);

      // await session.commitTransaction();
      return userCart.populate('items.product');
    } catch (error) {
      // await session.abortTransaction();
      throw error;
    }
  }

  static async bulkUpdateQuantities(
    updates: Array<{ productId: string; quantity: number }>,
    userId?: string,

  ): Promise<CartDocument> {
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      // Validate all updates first
      await Promise.all(
        updates.map(update =>
          this.validateStock(update.productId, update.quantity)
        )
      );

      const cart = await this.getCart(userId);

      // Apply all updates
      updates.forEach(update => {
        const item = cart.items.find(
          item => item.product._id.toString() === update.productId
        );

        if (item) {
          item.quantity = update.quantity;
        }
      });

      // Remove items with quantity 0
      cart.items = cart.items.filter(item => item.quantity > 0);

      await cart.save();
      // await session.commitTransaction();

      return cart.populate('items.product');
    } catch (error) {
      // await session.abortTransaction();
      throw error;
    }
  }

  // Add cleanup method for expired carts
  static async cleanupExpiredCarts(): Promise<void> {
    await CartModel.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }


  static async updateQuantity(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<CartDocument> {
    const cart = await this.getCart(userId);
    const item = cart.items.find(
      item => item.product._id.toString() === productId
    );
    if (!item) {
      throw AppError.NotFound('Product not found in cart');
    }
    if (quantity === 0) {
      cart.items = cart.items.filter(
        item => item.product._id.toString() !== productId
      );
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    return cart.populate('items.product', 'title thumbnail basePrice inStock');
  }

  static async removeFromCart(
    userId: string,
    productId: string
  ): Promise<CartDocument> {
    const cart = await this.getCart(userId);

    cart.items = cart.items.filter(
      item => item.product._id.toString() !== productId
    );

    await cart.save();
    return cart.populate('items.product', 'title thumbnail basePrice inStock');
  }

  static async applyCoupon(
    userId: string,
    couponCode: string
  ): Promise<CartDocument> {
    const cart = await this.getCart(userId);
    cart.couponCode = couponCode;
    // Add coupon validation and discount logic here
    await cart.save();
    return cart.populate('items.product', 'title thumbnail basePrice inStock');
  }

  static async clearCart(userId: string): Promise<void> {
    await CartModel.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          items: [],
          couponCode: null,
          totals: {
            subtotal: 0,
            shipping: 0,
            tax: 0,
            total: 0
          }
        }
      }
    );
  }
}
