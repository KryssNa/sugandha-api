// controllers/session.controller.ts
import { Request, Response } from 'express';
import { DeviceService } from '../services/device.service';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export class SessionController {
    static getActiveSessions = asyncHandler(async (req: Request, res: Response) => {
        const user = await UserService.findById(req.user!._id);

        ApiResponse.success(res, {
            message: 'Active sessions retrieved successfully',
            data: {
                sessions: user.activeDevices.map(device => ({
                    id: device.deviceId,
                    deviceName: device.deviceType,
                    browser: device.browser,
                    operatingSystem: device.operatingSystem,
                    ipAddress: device.ipAddress,
                    location: device.location,
                    lastActive: device.lastActive,
                    current: device.isCurrentDevice
                }))
            }
        });
    });

    static terminateSession = asyncHandler(async (req: Request, res: Response) => {
        const { deviceId } = req.params;
        const user = await UserService.findById(req.user!._id);

        const device = user.activeDevices.find(d => d.deviceId === deviceId);
        if (!device) {
            throw AppError.NotFound('Session not found');
        }

        if (device.isCurrentDevice) {
            throw AppError.BadRequest('Cannot terminate current session');
        }

        await DeviceService.invalidateDevice(user, deviceId);

        ApiResponse.success(res, {
            message: 'Session terminated successfully'
        });
    });

    static terminateAllSessions = asyncHandler(async (req: Request, res: Response) => {
        const user = await UserService.findById(req.user!._id);

        // Keep only current session
        const currentDevice = user.activeDevices.find(d => d.isCurrentDevice);
        user.activeDevices = currentDevice ? [currentDevice] : [];
        await user.save();

        ApiResponse.success(res, {
            message: 'All other sessions terminated successfully'
        });
    });

    static updateSessionActivity = asyncHandler(async (req: Request, res: Response) => {
        const { deviceId } = req.params;
        const user = await UserService.findById(req.user!._id);

        const device = user.activeDevices.find(d => d.deviceId === deviceId);
        if (!device) {
            throw AppError.NotFound('Session not found');
        }

        device.lastActive = new Date();
        await user.save();

        ApiResponse.success(res, {
            message: 'Session activity updated successfully'
        });
    });
}