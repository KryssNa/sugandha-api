// utils/email.ts
import { sendEmail } from '../config/email';
import { ContactDocument } from '../models/contact.model';

export const sendContactEmail = async (contact: ContactDocument) => {
    // Send confirmation to user
    await sendEmail({
        to: contact.email,
        subject: 'Thank you for contacting us',
        template: 'contact-confirmation',
        context: {
            name: contact.fullName,
            type: contact.type,
            reference: contact._id
        }
    });

    // Send notification to admin/support
    await sendEmail({
        to: process.env.SUPPORT_EMAIL!,
        subject: `New ${contact.type} Request`,
        template: 'contact-notification',
        context: {
            contactType: contact.type,
            customerName: contact.fullName,
            customerEmail: contact.email,
            message: contact.message
        }
    });
};