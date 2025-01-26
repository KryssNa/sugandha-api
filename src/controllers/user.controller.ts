import { Request, Response } from 'express';
import { DeviceService } from '../services/device.service';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../utils/jwt';

export class UserController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.create(req.body);
    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(user._id),
      generateRefreshToken(user._id)
    ]);

    await UserService.update(user._id, { refreshToken });

    ApiResponse.success(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: { accessToken, refreshToken }
      }
    });
  });

  // static login = asyncHandler(async (req: Request, res: Response) => {
  //   const { email, password } = req.body;

  //   const user = await UserService.findOne({ email }, { selectPassword: true });
  //   if (!user || !(await user.comparePassword(password))) {
  //     throw AppError.Unauthorized('Invalid credentials');
  //   }

  //   const [accessToken, refreshToken] = await Promise.all([
  //     generateAccessToken(user._id),
  //     generateRefreshToken(user._id)
  //   ]);

  //   await UserService.update(user._id, { refreshToken });

  //   ApiResponse.success(res, {
  //     message: 'Login successful',
  //     data: {
  //       user: {
  //         id: user._id,
  //         email: user.email,
  //         firstName: user.firstName,
  //         lastName: user.lastName,

  //         role: user.role
  //       },
  //       tokens: { accessToken, refreshToken }
  //     }
  //   });
  // });

  // src/controllers/user.controller.ts
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || '';

    const user = await UserService.findOne({ email }, { selectPassword: true });
    if (!user || !(await user.comparePassword(password))) {
      throw AppError.Unauthorized('Invalid credentials');
    }

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(user._id),
      generateRefreshToken(user._id)
    ]);

    // Track device login
    const deviceId = await DeviceService.trackDeviceLogin(
      user,
      userAgent,
      ipAddress
    );

    await UserService.update(user._id, { refreshToken });

    ApiResponse.success(res, {
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken
        },
        deviceId
      }
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { deviceId } = req.body;

    if (deviceId && req.user) {
      await DeviceService.invalidateDevice(req.user, deviceId);
    }

    await UserService.update(req.user!._id, { refreshToken: '' });

    ApiResponse.success(res, {
      message: 'Logout successful'
    });
  });

  static getActiveDevices = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.findById(req.user!._id);

    ApiResponse.success(res, {
      data: user.activeDevices.map(device => ({
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        browser: device.browser,
        operatingSystem: device.operatingSystem,
        lastActive: device.lastActive,
        isCurrentDevice: device.isCurrentDevice,
        location: device.location
      })),
      message: 'Active devices retrieved successfully'
    });
  });

  static getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.findById(req.user!._id);
    ApiResponse.success(res, {
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        contact: user.contact,
        street: user.street,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'Profile retrieved successfully'
    });
  });

  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { sort, search, role } = req.query;

    const { users, total, filteredTotal } = await UserService.findAll({
      page,
      limit,
      sort: sort as string,
      search: search as string,
      role: role as string
    });

    ApiResponse.success(res, {
      data: users.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        contact: user.contact,
        createdAt: user.createdAt
      })),
      message: 'Users retrieved successfully',
      metadata: {
        page,
        limit,
        total,
        filteredTotal,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < filteredTotal,
        hasPrevPage: page > 1
      }
    });
  });

  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await UserService.changePassword(req.user!._id, currentPassword, newPassword);

    ApiResponse.success(res, {
      data: {},
      message: 'Password changed successfully'
    });
  });

  static getUserProfile = asyncHandler(async (req: Request, res: Response) => {

    const user = await UserService.getUserProfile(req.params.id);
    ApiResponse.success(res, {
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'User profile retrieved successfully'
    });

  });

  static updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.updateProfile(req.user!._id, req.body);
    ApiResponse.success(res, {
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        contact: user.contact,
        street: user.street,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'User profile updated successfully'
    });
  }
  );

  static verifyAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
      throw AppError.BadRequest('Token is required');
    }
    const accessToken = token.split(" ")[1]
    const payload = await verifyAccessToken(accessToken);
    ApiResponse.success(res, {
      data: payload,
      message: 'Token verified successfully'
    });
  }
  )


}