import mongoose from 'mongoose';
import { OrderModel } from '../models/order.model';
import { CartModel } from '../models/cart.model';
import { AppError } from '../utils/AppError';
import Product from '../models/poduct.model';

export class OrderService {
  static async createOrder(
    orderData: any,
    userId?: string
  ) {

    try {
      // Validate product availability
      for (const item of orderData.items) {
        const product = await Product.findById(item.product);
        
        if (!product) {
          throw AppError.NotFound(`Product ${item.product} not found`);
        }

        if (product.quantity < item.quantity) {
          throw AppError.BadRequest(`Insufficient stock for product ${product.title}`);
        }
      }

      // Create order
      const order = await OrderModel.create([{
        ...orderData,
        
        user: userId ? userId : undefined,
        paymentMethod: orderData.paymentMethod,
        guestEmail: orderData.isGuest ? orderData.guestEmail : undefined,
        isGuest: !!orderData.isGuest,
        guestId: orderData.isGuest ? orderData.guestId : undefined,
      }], );


      // Update product quantities
      for (const item of orderData.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: -item.quantity } },
          
        );
      }

      // Clear cart if user is logged in
      if (userId) {
        await CartModel.findOneAndUpdate(
          { user: userId },
          { items: [], totalAmount: 0 },
          
        );
      }
      return order[0];
    } catch (error) {
      throw error;
    } 
  }

  static async getOrderDetails(orderId: string, userId?: string) {
    const order = await OrderModel.findOne({
      _id: orderId,
      $or: [
        { user: userId },
        { guestEmail: userId }
      ]
    }).populate('items.product');

    if (!order) {
      throw AppError.NotFound('Order not found');
    }

    return order;
  }

  static async getUserOrders(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OrderModel.find({ 
        $or: [
          { user: userId },
          { guestEmail: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product'),
      OrderModel.countDocuments({ 
        $or: [
          { user: userId },
          { guestEmail: userId }
        ]
      })
    ]);

    return {
      orders,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async updateOrderStatus(
    orderId: string, 
    status: string,
    userId?: string
  ) {
    const order = await OrderModel.findOneAndUpdate(
      {
        _id: orderId,
        $or: [
          { user: userId },
          { guestEmail: userId }
        ]
      },
      { status },
      { new: true }
    );

    if (!order) {
      throw AppError.NotFound('Order not found');
    }

    return order;
  }
}