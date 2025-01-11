import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose, { Document, Model } from 'mongoose';
import { IUser, UserRole } from '../types/user.types';

interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateVerificationToken(): string;
  verifyVerificationToken(token: string): boolean;
  isPasswordReused(password: string): Promise<boolean>;
  passwordHistory: Array<{
    hash: string;
    createdAt: Date;
  }>;
  createPasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  isAccountLocked(): boolean;

}

export type UserDocument = Document & IUser & IUserMethods;
export type UserModel = Model<UserDocument> & IUserMethods;

const userSchema = new mongoose.Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
    select: false,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: String,
  contact: String,

  street: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String,
    select: false,
  },

  passwordHistory: Array<{
    hash: string;
    createdAt: Date;
  }>,
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: Date,
  verificationToken: {
    type: String,
    select: false,
  },
  verificationTokenExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lastLoginAttempt: Date,
  lockUntil: Date,
  isLocked: {
    type: Boolean,
    default: false,
  },

  activeDevices: [{
    deviceId: { type: String, required: true },
    deviceType: String,
    browser: String,
    operatingSystem: String,
    ipAddress: String,
    os: String,
    location: {
      city: String,
      country: String,
      latitude: Number,
      longitude: Number
    },
    lastActive: { type: Date, default: Date.now },
    isCurrentDevice: { type: Boolean, default: false }
  }],
  maxDevices: { type: Number, default: 3 },

  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  twoFactorMethod: {
    type: String,
    enum: ['authenticator', 'sms', 'email'],
    default: 'authenticator'
  }


}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
})

userSchema.methods.generateVerificationToken = function (this: UserDocument): string {
  const token = crypto.randomUUID();
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
}

userSchema.methods.verifyVerificationToken = function (this: UserDocument, token: string): boolean {
  return crypto.createHash('sha256').
    update(token).digest('hex') === this.verificationToken;
}

userSchema.methods.isPasswordReused = async function (candidatePassword: string): Promise<boolean> {
  const passwordHistoryLimit = 5; // Keep last 5 passwords

  for (const prevPassword of this.passwordHistory.slice(0, passwordHistoryLimit)) {
    const isReused = await bcrypt.compare(candidatePassword, prevPassword.hash);
    if (isReused) return true;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

userSchema.methods.isAccountLocked = function(): boolean {
  return this.lockUntil && this.lockUntil > new Date();
};


export const UserModel = mongoose.model<UserDocument, UserModel>('User', userSchema);
