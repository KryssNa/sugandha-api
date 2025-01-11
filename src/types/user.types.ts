export interface UserDevice {
  deviceId: string;
  deviceType: string;
  browser: string;
  os?: string;
  operatingSystem: string;
  ipAddress: string;
  location?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  lastActive: Date;
  isCurrentDevice?: boolean;
}

export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  contact?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  role: UserRole;

  refreshToken?: string;

  isVerified: boolean;
  isActive: boolean;
  isGuest: boolean;
  passwordHistory?: Array<{
    hash: string;
    createdAt: Date;
  }>;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  loginAttempts?: number;
  lastLoginAttempt?: Date;
  activeDevices: UserDevice[];
  maxDevices?: number;
  lockUntil?: Date;
  isLocked?: boolean;

  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorMethod: 'authenticator' | 'sms' | 'email';

  createdAt: Date;
  updatedAt: Date;
}

// src/interfaces/user.interface.ts
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPER_ADMIN = 'super_admin'
}