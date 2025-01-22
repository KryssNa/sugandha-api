import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose, { Document, Model } from 'mongoose';
import { IUser, UserRole } from '../types/user.types';

interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateVerificationToken(): string;
  verifyVerificationToken(token: string): boolean;

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
  verificationToken: String,
  refreshToken: String,
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


export const UserModel = mongoose.model<UserDocument, UserModel>('User', userSchema);
