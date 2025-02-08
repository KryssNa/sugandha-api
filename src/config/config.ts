// src/config/index.ts
export const config = {
    // Existing configurations
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
    EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@sugandha.com',
    CLIENT_URL: process.env.CLIENT_URL || 'https://sugandha.shankar1.com.np',
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || ['http://localhost:3000', 'https://localhost:3000','https://sugandha.shankar1.com.np'],

    // Node environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // New configurations mongoDB
    MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://kryss:kryss123krishna@kryssna.5azh3wp.mongodb.net/?retryWrites=true&w=majority&appName=kryssna',
  }
