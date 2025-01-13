import { Request, Response } from 'express';
import { WishlistService } from '../services/wishlist.service';
import { CartService } from '../services/cart.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class WishlistController {
  static getWishlist = asyncHandler(async (req: Request, res: Response) => {
    const wishlist = await WishlistService.getWishlist(req.user!._id);
    
    ApiResponse.success(res, {
      message: 'Wishlist retrieved successfully',
      data: wishlist
    });
  });

  static addToWishlist = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.body;
    const wishlist = await WishlistService.addToWishlist(
      req.user!._id,
      productId
    );
    
    ApiResponse.success(res, {
      message: 'Product added to wishlist successfully',
      data: wishlist
    });
  });

  static removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const wishlist = await WishlistService.removeFromWishlist(
      req.user!._id,
      productId
    );
    
    ApiResponse.success(res, {
      message: 'Product removed from wishlist successfully',
      data: wishlist
    });
  });

  static moveToCart = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    await WishlistService.moveToCart(
      req.user!._id,
      productId,
      CartService
    );
    
    ApiResponse.success(res, {
      message: 'Product moved to cart successfully'
    });
  });

  static clearWishlist = asyncHandler(async (req: Request, res: Response) => {
    await WishlistService.clearWishlist(req.user!._id);
    
    ApiResponse.success(res, {
      message: 'Wishlist cleared successfully'
    });
  });

  static checkProduct = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const isInWishlist = await WishlistService.isProductInWishlist(
      req.user!._id,
      productId
    );
    
    ApiResponse.success(res, {
      data: { isInWishlist }
    });
  });
}
