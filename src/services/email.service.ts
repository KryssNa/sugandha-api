// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { config } from '../config/config';
// import { config } from '../config';

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT,
        secure: config.EMAIL_SECURE,
        auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS
        }
    });

    static async sendEmail(options: EmailOptions) {
        try {
            await this.transporter.sendMail({
                from: config.EMAIL_FROM,
                ...options
            });
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error('Failed to send email');
        }
    }

    static async sendVerificationEmail(email: string, token: string) {
        const verificationLink = `${config.CLIENT_URL}/verify-email?token=${token}`;

        await this.sendEmail({
            to: email,
            subject: 'Verify Your Email',
            html: `
        <h1>Email Verification</h1>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
        });
    }

    static async sendPasswordResetEmail(email: string, token: string) {
        const resetLink = `${config.CLIENT_URL}/reset-password?token=${token}`;

        await this.sendEmail({
            to: email,
            subject: 'Password Reset Request',
            html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
        });
    }

    // Additional email methods as needed
}