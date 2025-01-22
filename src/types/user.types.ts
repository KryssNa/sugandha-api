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

  isVerified: boolean;
  isActive: boolean;
  isGuest: boolean;
  verificationToken?: string;
  refreshToken?: string;
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