import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class CartController {
//   static getCart = asyncHandler(async (req: Request, res: Response) => {
//     const cart = await CartService.getCart(req.user!._id);
    
//     ApiResponse.success(res, {
//       message: 'Cart retrieved successfully',
//       data: cart
//     });
//   });

  static addToCart = asyncHandler(async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;
    const cart = await CartService.addToCart(productId, quantity, req.user!._id);
    
    ApiResponse.success(res, {
      message: 'Product added to cart successfully',
      data: cart
    });
  });

  static updateQuantity = asyncHandler(async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;
    const cart = await CartService.updateQuantity(
      req.user!._id,
      productId,
      quantity
    );
    
    ApiResponse.success(res, {
      message: 'Cart updated successfully',
      data: cart
    });
  });

  static removeFromCart = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const cart = await CartService.removeFromCart(req.user!._id, productId);
    
    ApiResponse.success(res, {
      message: 'Product removed from cart successfully',
      data: cart
    });
  });

  static applyCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { couponCode } = req.body;
    const cart = await CartService.applyCoupon(req.user!._id, couponCode);
    
    ApiResponse.success(res, {
      message: 'Coupon applied successfully',
      data: cart
    });
  });

  static getCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    // const sessionId = req.cookies['cart_session'];
    
    const cart = await CartService.getCart(userId);
    
    // Set session cookie for guest users
    // if (!userId && !sessionId) {
    //   res.cookie('cart_session', cart.sessionId, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    //   });
    // }

    ApiResponse.success(res, {
      message: 'Cart retrieved successfully',
      data: cart
    });
  });

  static mergeGuestCart = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.cookies['cart_session'];
    
    if (!sessionId) {
      return ApiResponse.success(res, {
        message: 'No guest cart to merge',
        data: await CartService.getCart(req.user!._id)
      });
    }

    const cart = await CartService.mergeGuestCart(
      req.user!._id
    );

    // Clear guest cart cookie
    res.clearCookie('cart_session');

    ApiResponse.success(res, {
      message: 'Carts merged successfully',
      data: cart
    });
  });

  static bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { updates } = req.body;
    const userId = req.user?._id;
    const sessionId = req.cookies['cart_session'];

    const cart = await CartService.bulkUpdateQuantities(
      updates,
      userId
    );

    ApiResponse.success(res, {
      message: 'Cart updated successfully',
      data: cart
    });
  });

  static clearCart = asyncHandler(async (req: Request, res: Response) => {
    await CartService.clearCart(req.user!._id);
    
    ApiResponse.success(res, {
      message: 'Cart cleared successfully'
    });
  });
}
