// src/services/2fa.service.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { UserDocument } from '../models/user.model';

export class TwoFactorService {
  // Generate 2FA secret
  static generateSecret(user: UserDocument) {
    const secret = speakeasy.generateSecret({ name: `Sugandha:${user.email}` });
    user.twoFactorSecret = secret.base32;
    return secret;
  }

  // Generate QR Code for Authenticator App
  static async generateQRCode(secret: string): Promise<string> {
    return QRCode.toDataURL(secret);
  }

  // Verify 2FA token
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token
    });
  }
}