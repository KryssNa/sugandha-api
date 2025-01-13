import { FilterQuery, Types, UpdateQuery } from 'mongoose';
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

  // create guest user
  static async createGuestUser(userData: Partial<UserDocument>): Promise<UserDocument> {
    if (!userData.email) {
      throw AppError.ValidationError([
        { field: 'email', message: 'Email is required' }
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

  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.findById(id, { selectPassword: true });
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw AppError.BadRequest('Invalid current password', [
        { field: 'currentPassword', message: 'Current password is incorrect' }
      ]);
    }

    user.password = newPassword;
    await user.save();
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

  static async generateVerificationToken(email: string): Promise<UserDocument> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw AppError.NotFound('User not found', [
        { field: 'email', message: 'No user exists with this email' }
      ]);
    }

    user.verificationToken = UserModel.generateVerificationToken();
    await user.save();

    return user;
  }

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
}