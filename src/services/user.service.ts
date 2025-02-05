import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { sendEmail } from '../config/email';
import { UserDocument, UserModel } from '../models/user.model';
import { AppError } from '../utils/AppError';

interface FindAllOptions {
  filter?: FilterQuery<UserDocument>;
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  role?: string;
  select?: string;
}

interface UpdateOptions {
  validateBeforeUpdate?: boolean;
  select?: string;
}

export class UserService {
  static async create(userData: Partial<UserDocument>): Promise<UserDocument> {
    if (!userData.email || !userData.password) {
      throw AppError.ValidationError([
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]);
    }

    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      throw AppError.Conflict('Email already exists', [
        { field: 'email', message: 'This email is already registered' }
      ]);
    }

    try {
      return await UserModel.create(userData);
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        const errors = Object.values((error as any).errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        throw AppError.ValidationError(errors);
      }
      throw AppError.DatabaseError('Error creating user');
    }
  }

  static async authenticateUser(email: string, password: string) {
    const user = await this.findOne({ email }, { selectPassword: true });

    if (!user) {
      throw AppError.Unauthorized('Invalid credentials');
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      const remainingLockTime = Math.ceil(
        ((user.lockUntil?.getTime() || 0) - Date.now()) / (1000 * 60)
      );
      throw AppError.Forbidden(`Your account has been locked due to multiple failed attempt. Please Try again in ${remainingLockTime} minutes`);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
        user.isLocked = true;
      }

      // Check if password is expired
      const passwordAge = Date.now() - (user.passwordChangedAt?.getTime() || 0);
      const maxPasswordAge = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

      if (passwordAge > maxPasswordAge) {
        throw AppError.Forbidden('Your password has expired. Please reset your password.');
      }
    
      await user.save();
      throw AppError.Unauthorized('Invalid credentials');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.isLocked = false;
    await user.save();

    return user;
  }

  static async unlockAccount(email: string): Promise<void> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw AppError.NotFound('User not found');
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.isLocked = false;
    await user.save();
  }

  static async findById(
    id: string,
    options: { selectPassword?: boolean; select?: string } = {}
  ): Promise<UserDocument> {

    if (!Types.ObjectId.isValid(id)) {
      throw AppError.BadRequest('Invalid ID format', [
        { field: 'id', message: 'The provided ID is not valid' }
      ]);
    }

    const query = UserModel.findById(id);
    if (options.selectPassword) query.select('+password');
    if (options.select) query.select(options.select);

    const user = await query.exec();
    if (!user) {
      throw AppError.NotFound('User not found', [
        { field: 'id', message: 'No user exists with this ID' }
      ]);
    }

    return user;
  }

  static async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).exec();
  }

  static async generateRandomPassword(): Promise<string> {
    return Math.random().toString(36).slice(-8);
  }

  // create guest user
  static async createGuestUser(userData: Partial<UserDocument>, password: string): Promise<UserDocument> {
    if (!userData.email) {
      throw AppError.ValidationError([
        { field: 'email', message: 'Email is required' }
      ]);
    }

    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      console.log("Guest User already exists")
      return existingUser;
      // throw AppError.Conflict('Email already exists', [
      //   { field: 'email', message: 'This email is already registered' }
      // ]);
    }

    try {
      return await UserModel.create({ ...userData, password, role: "guest", isGuest: true });
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        const errors = Object.values((error as any).errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        throw AppError.ValidationError(errors);
      }
      throw AppError.DatabaseError('Error creating user');
    }
  }

  static async findOne(
    filter: FilterQuery<UserDocument>,
    options: { selectPassword?: boolean; select?: string } = {}
  ): Promise<UserDocument | null> {
    const query = UserModel.findOne(filter);
    if (options.selectPassword) query.select('+password');
    if (options.select) query.select(options.select);
    return query.exec();
  }

  static async findAll(options: FindAllOptions = {}): Promise<{
    users: UserDocument[];
    total: number;
    filteredTotal: number;
  }> {
    const {
      filter = {},
      page = 1,
      limit = 10,
      sort = '-createdAt',
      search,
      role,
      select
    } = options;

    const query: FilterQuery<UserDocument> = { ...filter };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;

    try {
      const [total, filteredTotal, users] = await Promise.all([
        UserModel.countDocuments({}),
        UserModel.countDocuments(query),
        UserModel.find(query)
          .select(select || '')
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .exec()
      ]);

      return { users, total, filteredTotal };
    } catch (error) {
      throw AppError.DatabaseError('Error fetching users');
    }
  }

  static async update(
    id: string,
    updateData: UpdateQuery<UserDocument>,
    options: UpdateOptions = {}
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.BadRequest('Invalid ID format');
    }

    const sanitizedData = this.sanitizeUpdateData(updateData);

    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        sanitizedData,
        {
          new: true,
          runValidators: options.validateBeforeUpdate ?? true,
          ...(options.select && { select: options.select })
        }
      );

      if (!user) {
        throw AppError.NotFound('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;

      if (error instanceof Error && error.name === 'ValidationError') {
        const errors = Object.values((error as any).errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        throw AppError.ValidationError(errors);
      }

      throw AppError.DatabaseError('Error updating user');
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.BadRequest('Invalid ID format');
    }

    const result = await UserModel.findByIdAndDelete(id);
    if (!result) {
      throw AppError.NotFound('User not found');
    }

    return true;
  }

  // static async changePassword(
  //   id: string,
  //   currentPassword: string,
  //   newPassword: string
  // ): Promise<void> {
  //   const user = await this.findById(id, { selectPassword: true });
  //   const isPasswordValid = await user.comparePassword(currentPassword);

  //   if (!isPasswordValid) {
  //     throw AppError.BadRequest('Invalid current password', [
  //       { field: 'currentPassword', message: 'Current password is incorrect' }
  //     ]);
  //   }

  //   user.password = newPassword;
  //   await user.save();
  // }

  // src/services/user.service.ts
  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.findById(id, { selectPassword: true });

    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw AppError.BadRequest('Invalid current password');
    }

    // Check password reuse
    const isPasswordReused = await user.isPasswordReused(newPassword);
    if (isPasswordReused) {
      throw AppError.BadRequest('Cannot reuse recent passwords');
    }

    // Update password history
    user.passwordHistory.unshift({
      hash: await bcrypt.hash(newPassword, 12),
      createdAt: new Date()
    });

    // Limit password history
    user.passwordHistory = user.passwordHistory.slice(0, 5);

    user.password = newPassword;
    await user.save();
  }

  static async initiatePasswordReset(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw AppError.NotFound('User not found');
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    return resetToken; // To be used in email sending
  }

  static async verifyEmail(verificationToken: string): Promise<UserDocument> {
    const user = await UserModel.findOne({ verificationToken });
    if (!user) {
      throw AppError.NotFound('User not found', [
        { field: 'verificationToken', message: 'Invalid verification token' }
      ]);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return user;

  }

  // static async generateVerificationToken(email: string): Promise<UserDocument> {
  //   const user = await UserModel.findOne({ email });
  //   if (!user) {
  //     throw AppError.NotFound('User not found', [
  //       { field: 'email', message: 'No user exists with this email' }
  //     ]);
  //   }

  //   user.verificationToken = UserModel.generateVerificationToken();
  //   await user.save();

  //   return user;
  // }

  static async verifyVerificationToken(token: string): Promise<UserDocument> {
    const user = await UserModel.findOne({ verificationToken: token });
    if (!user) {
      throw AppError.NotFound('User not found', [
        { field: 'verificationToken', message: 'Invalid verification token' }
      ]);
    }

    return user;
  }



  static async getUserProfile(id: string): Promise<UserDocument> {
    const user = await this.findById(id, { select: '-password -refreshToken' });
    return user;
  }

  static async updateProfile(id: string, data: UpdateQuery<UserDocument>): Promise<UserDocument> {
    const user = await this.update(id, data, { select: '-password -refreshToken' });
    return user;
  }

  private static sanitizeUpdateData(data: UpdateQuery<UserDocument>): UpdateQuery<UserDocument> {
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'refreshToken', 'role'];

    sensitiveFields.forEach(field => {
      delete sanitized[field];
      if (sanitized.$set) delete sanitized.$set[field];
    });

    return sanitized;
  }

  static async generateVerificationToken(user: UserDocument): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    user.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    return token;
  }

  static async sendVerificationEmail(user: UserDocument): Promise<void> {
    const token = await this.generateVerificationToken(user);
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      template: 'verification',
      context: {
        firstName: user.firstName,
        verificationLink
      }
    });
  }

  static async sendPasswordResetEmail(user: UserDocument): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        firstName: user.firstName,
        resetLink
      }
    });

    return token;
  }

  // In user.service.ts
  static async verifyPasswordResetToken(token: string): Promise<UserDocument> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      throw AppError.BadRequest('Invalid or expired reset token');
    }

    return user;
  }
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.verifyPasswordResetToken(token);

    // Prevent password reuse
    const isPasswordReused = await user.isPasswordReused(newPassword);
    if (isPasswordReused) {
      throw AppError.BadRequest('Cannot reuse recent passwords');
    }

    // Update password
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.password = newPassword;

    // Update password history
    user.passwordHistory.unshift({
      hash: await bcrypt.hash(newPassword, 12),
      createdAt: new Date()
    });
    user.passwordHistory = user.passwordHistory.slice(0, 5);

    await user.save();
  }

}
