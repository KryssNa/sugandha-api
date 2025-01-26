// src/config/index.ts
export const config = {
    // Existing configurations
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
    EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@sugandha.com',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
  }