import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export class OrderController {

    static getAllOrders = asyncHandler(async (req: Request, res: Response) => {
        const orders = await OrderService.getAllOrders();
        ApiResponse.success(res, {
            message: 'Orders retrieved successfully',
            data: { orders }
        });
    }
    );

    static getUserOrders = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) {
            return ApiResponse.error(res, {
                message: 'User not authenticated'
            });
        }
        const userId = req.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const orders = await OrderService.getUserOrders(userId, page, limit);
        ApiResponse.success(res, {
            message: 'User orders retrieved successfully',
            data: { orders }
        });

    }
    );

    static getOrderDetails = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.orderId;
        const userId = req.user ? req.user._id : req.body.email;
        const order = await OrderService.getOrderDetails(orderId, userId);
        ApiResponse.success(res, {
            message: 'Order details retrieved successfully',
            data: { order }
        });
    }
    );

    static updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.orderId;
        const status = req.body.status;
        const order = await OrderService.updateOrderStatus(orderId, status);
        ApiResponse.success(res, {
            message: 'Order status updated successfully',
            data: { order }
        });
    }
    );


}