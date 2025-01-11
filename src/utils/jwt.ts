// src/utils/jwt.ts
import { config } from 'dotenv';
import { SignJWT, jwtVerify } from 'jose';
import { AppError } from './AppError';

// Load environment variables
config({
  path: ".env",
});

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Convert secret to Uint8Array
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Convert time strings to seconds
const parseExpirationTime = (time: string): number => {
  const unit = time.charAt(time.length - 1);
  const value = parseInt(time.slice(0, -1));

  switch (unit) {
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    case 'm':
      return value * 60;
    case 's':
      return value;
    default:
      return parseInt(time);
  }
};

export const generateAccessToken = async (userId: string): Promise<string> => {
  try {
    const jwt = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + parseExpirationTime(JWT_EXPIRES_IN))
      .sign(secretKey);

    return jwt;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new AppError(500, 'Failed to generate access token');
  }
};

import { setCookie } from 'nookies';

interface GenerateTokensAndSetCookiesParams {
  res: any;
  userId: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const generateTokensAndSetCookies = async ({ res, userId }: {
  res: any;
  userId: string;
}): Promise<Tokens> => {
  const accessToken = await generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);

  setCookie({ res }, 'accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  });

  setCookie({ res }, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return { accessToken, refreshToken };
};

export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export const verifyAccessToken = async (token: string): Promise<JWTPayload> => {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256']
    });

    if (!payload.userId) {
      throw new AppError(401, 'Invalid token format');
    }

    return payload as unknown as JWTPayload;
  } catch (error: any) {
    console.error('Token verification error:', error);

    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new AppError(401, 'Token has expired');
    }

    if (error.code === 'ERR_JWS_INVALID') {
      throw new AppError(401, 'Invalid token signature');
    }

    if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      throw new AppError(401, 'Token validation failed');
    }

    throw new AppError(401, 'Invalid token');
  }
};

export const  verifyRefreshToken = async (token: string): Promise<JWTPayload> => {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256']
    });

    if (!payload.userId) {
      throw new AppError(401, 'Invalid token format');
    }

    return payload as unknown as JWTPayload;
  } catch (error: any) {
    console.error('Token verification error:', error);

    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new AppError(401, 'Token has expired');
    }

    if (error.code === 'ERR_JWS_INVALID') {
      throw new AppError(401, 'Invalid token signature');
    }

    if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      throw new AppError(401, 'Token validation failed');
    }

    throw new AppError(401, 'Invalid token');
  }
}

export const generateRefreshToken = async (userId: string): Promise<string> => {
  try {
    const jwt = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    return jwt;
  } catch (error) {
    console.error('Refresh token generation error:', error);
    throw new AppError(500, 'Failed to generate refresh token');
  }
};