// config/email.ts
import dotenv from 'dotenv';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import path from 'path';
dotenv.config();


interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

// Create reusable transporter
const createTransporter = () => {
  // For production
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'Gmail', 'SendGrid'
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // For development (using Ethereal - fake SMTP service)
  return nodemailer.createTransport({
    // host: 'smtp.ethereal.email',
    // port: 587,
    // secure: false,
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASS,
    // },
    service: process.env.EMAIL_SERVICE, // e.g., 'Gmail', 'SendGrid'
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Cache for compiled templates
const templateCache: Record<string, handlebars.TemplateDelegate> = {};

// Helper function to load and compile template
const getTemplate = async (templateName: string): Promise<handlebars.TemplateDelegate> => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const templatePath = path.join(__dirname, '../templates/email/layouts', `${templateName}.hbs`);
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = handlebars.compile(templateContent);
  templateCache[templateName] = template;
  return template;
};

// Register handlebars helpers
handlebars.registerHelper('formatDate', (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

handlebars.registerHelper('uppercase', (text: string) => text.toUpperCase());

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    const template = await getTemplate(options.template);
    const html = template(options.context);

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      html,
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};