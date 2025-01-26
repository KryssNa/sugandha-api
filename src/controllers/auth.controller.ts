// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { TwoFactorService } from '../services/2fa.service';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import crypto from 'crypto';
// import { EmailService } from '../services/email.service';

export class AuthController {
    // Email Verification
    static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
        const { token } = req.body;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await UserModel.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            throw AppError.BadRequest('Invalid or expired verification token');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationTokenExpires = undefined;
        await user.save();

        ApiResponse.success(res, {
            message: 'Email verified successfully'
        });
    });

    // Two-Factor Authentication
    static setupTwoFactor = asyncHandler(async (req: Request, res: Response) => {
        const user = await UserService.findById(req.user!._id);
        const { method } = req.body;

        // Generate 2FA secret
        const secret = TwoFactorService.generateSecret(user);

        // Generate QR Code for Authenticator App
        if (!secret.otpauth_url) {
            throw AppError.BadRequest('Failed to generate QR code: otpauth_url is undefined');
        }
        const qrCode = await TwoFactorService.generateQRCode(secret.otpauth_url);

        user.twoFactorMethod = method;
        await user.save();

        ApiResponse.success(res, {
            message: '2FA setup initiated',
            data: {
                qrCode,
                secret: secret.base32
            }
        });
    });

    static enableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
        const user = await UserService.findById(req.user!._id);
        const { token } = req.body;

        // Verify token
        if (!user.twoFactorSecret) {
            throw AppError.BadRequest('2FA secret is missing');
        }
        const isValid = user.twoFactorSecret ? TwoFactorService.verifyToken(user.twoFactorSecret, token) : false;

        if (!isValid) {
            throw AppError.BadRequest('Invalid 2FA token');
        }

        user.twoFactorEnabled = true;
        await user.save();

        ApiResponse.success(res, {
            message: '2FA enabled successfully'
        });
    });

    static disableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
        const user = await UserService.findById(req.user!._id);
        const { token } = req.body;

        // Verify current 2FA token
        const isValid = user.twoFactorSecret ? TwoFactorService.verifyToken(user.twoFactorSecret, token) : false;

        if (!isValid) {
            throw AppError.BadRequest('Invalid 2FA token');
        }

        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();

        ApiResponse.success(res, {
            message: '2FA disabled successfully'
        });
    });

    // Login with 2FA
    static loginWithTwoFactor = asyncHandler(async (req: Request, res: Response) => {
        const { email, password, twoFactorToken } = req.body;

        const user = await UserService.findOne({ email }, { selectPassword: true });

        // Validate password
        if (!user || !(await user.comparePassword(password))) {
            throw AppError.Unauthorized('Invalid credentials');
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            // Verify 2FA token
            const isValid = user.twoFactorSecret ? TwoFactorService.verifyToken(user.twoFactorSecret, twoFactorToken) : false;

            if (!isValid) {
                throw AppError.Unauthorized('Invalid 2FA token');
            }
        }

        // Generate tokens
        const [accessToken, refreshToken] = await Promise.all([
            generateAccessToken(user._id),
            generateRefreshToken(user._id)
        ]);

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
                tokens: { accessToken, refreshToken }
            }
        });
    });

    // In auth.controller.ts
static initiateEmailVerification = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.findById(req.user!._id);
    
    await UserService.sendVerificationEmail(user);
  
    ApiResponse.success(res, {
      message: 'Verification email sent',
      data: { tokenExpires: user.emailVerificationTokenExpires }
    });
  });
  
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await UserService.findByEmail(email);
  
    if (!user) {
      throw AppError.NotFound('User not found');
    }
  
    await UserService.sendPasswordResetEmail(user);
  
    ApiResponse.success(res, {
      message: 'Password reset email sent'
    });
  });
  static verifyResetToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
  
    // Verify token
    const user = await UserService.verifyPasswordResetToken(token);
  
    ApiResponse.success(res, {
      message: 'Reset token is valid',
      data: { 
        tokenValid: true,
        email: user.email 
      }
    });
  });
  // In auth.controller.ts
static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
  
    await UserService.resetPassword(token, newPassword);
  
    ApiResponse.success(res, {
      message: 'Password reset successfully'
    });
  });
}