export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  verificationToken?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/interfaces/user.interface.ts
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPER_ADMIN = 'super_admin'
}