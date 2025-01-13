import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { sendContactConfirmation, sendContactNotification } from '../utils/emailHelper';
import { sendContactEmail } from '../utils/email';
import { ContactService } from '../services/contact.service';

export class ContactController {
  static createContact = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    
    const attachments = files?.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    }));

    const contact = await ContactService.create({
      ...req.body,
      attachments
    });

    // Send emails
//   await Promise.all([
//     sendContactConfirmation(contact),
//     sendContactNotification(contact)
//   ]);

    ApiResponse.success(res, {
      statusCode: 201,
      message: 'Contact request submitted successfully',
      data: contact
    });
  });

  static getAllContacts = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, status, type, priority } = req.query;
    
    const contacts = await ContactService.findAll({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      type: type as string,
      priority: priority as string
    });

    ApiResponse.success(res, {
      message: 'Contacts retrieved successfully',
      data: contacts
    });
  });

  static getContactById = asyncHandler(async (req: Request, res: Response) => {
    const contact = await ContactService.findById(req.params.id);
    
    ApiResponse.success(res, {
      message: 'Contact retrieved successfully',
      data: contact
    });
  });

  static updateContactStatus = asyncHandler(async (req: Request, res: Response) => {
    const contact = await ContactService.updateStatus(req.params.id, req.body);
    
    ApiResponse.success(res, {
      message: 'Contact status updated successfully',
      data: contact
    });
  });

  static assignContact = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;
    const contact = await ContactService.assign(req.params.id, userId);
    
    ApiResponse.success(res, {
      message: 'Contact assigned successfully',
      data: contact
    });
  });

  static deleteContact = asyncHandler(async (req: Request, res: Response) => {
    await ContactService.delete(req.params.id);
    
    ApiResponse.success(res, {
      message: 'Contact deleted successfully'
    });
  });
}
