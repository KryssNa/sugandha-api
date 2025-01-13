// utils/emailHelpers.ts
import { ContactDocument } from '../models/contact.model';
import { sendEmail } from '../config/email';

export const sendContactConfirmation = async (contact: ContactDocument) => {
  await sendEmail({
    to: contact.email,
    subject: `Your ${contact.type} Request - Confirmation`,
    template: 'contact-confirmation',
    context: {
      name: contact.fullName,
      type: contact.type,
      reference: contact._id,
      submitDate: contact.createdAt,
      logoUrl: process.env.LOGO_URL,
      recipientEmail: contact.email,
      currentYear: new Date().getFullYear()
    }
  });
};

export const sendContactNotification = async (contact: ContactDocument) => {
  await sendEmail({
    to: process.env.SUPPORT_EMAIL!,
    subject: `New ${contact.type} Request from ${contact.fullName}`,
    template: 'contact-notification',
    context: {
      contactType: contact.type,
      customerName: contact.fullName,
      customerEmail: contact.email,
      message: contact.message,
      productDetails: contact.productDetails,
      dashboardUrl: `${process.env.DASHBOARD_URL}/contacts/${contact._id}`,
      logoUrl: process.env.LOGO_URL,
      recipientEmail: process.env.SUPPORT_EMAIL,
      currentYear: new Date().getFullYear()
    }
  });
};

export const sendStatusUpdate = async (contact: ContactDocument, statusMessage?: string) => {
  await sendEmail({
    to: contact.email,
    subject: `Update on Your ${contact.type} Request`,
    template: 'contact-status-update',
    context: {
      name: contact.fullName,
      reference: contact._id,
      status: contact.status,
      statusMessage,
      nextSteps: getNextSteps(contact.status),
      logoUrl: process.env.LOGO_URL,
      recipientEmail: contact.email,
      currentYear: new Date().getFullYear()
    }
  });
};

const getNextSteps = (status: string): string[] => {
  switch (status) {
    case 'inProgress':
      return [
        'Our team is actively working on your request',
        'You will receive updates as we make progress',
        'Feel free to reply to this email with any questions'
      ];
    case 'resolved':
      return [
        'Please review the resolution provided',
        'If you are satisfied, no further action is needed',
        'If you need further assistance, please reply to this email'
      ];
    default:
      return [];
  }
};