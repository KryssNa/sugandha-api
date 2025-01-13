import mongoose from 'mongoose';
import { ContactDocument, ContactModel } from '../models/contact.model';
import { AppError } from '../utils/AppError';

interface FindAllOptions {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  priority?: string;
}

export class ContactService {
  static async create(
    contactData: Partial<ContactDocument>
  ): Promise<ContactDocument> {
    try {
      const contact = await ContactModel.create(contactData);
      return contact;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        throw AppError.ValidationError(errors);
      }
      throw AppError.DatabaseError('Error creating contact request');
    }
  }

  static async findAll(options: FindAllOptions = {}) {
    const { page = 1, limit = 10, status, type, priority } = options;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const [contacts, total] = await Promise.all([
      ContactModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'firstName lastName email'),
      ContactModel.countDocuments(query)
    ]);

    return {
      contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async findById(id: string): Promise<ContactDocument> {
    const contact = await ContactModel.findById(id)
      .populate('assignedTo', 'firstName lastName email');

    if (!contact) {
      throw AppError.NotFound('Contact request not found');
    }

    return contact;
  }

  static async updateStatus(
    id: string,
    updateData: {
      status: string;
      resolvedAt?: Date;
      priority?: string;
    }
  ): Promise<ContactDocument> {
    const contact = await ContactModel.findByIdAndUpdate(
      id,
      {
        ...updateData,
        ...(updateData.status === 'resolved' && { resolvedAt: new Date() })
      },
      { new: true }
    );

    if (!contact) {
      throw AppError.NotFound('Contact request not found');
    }

    return contact;
  }

  static async assign(
    id: string,
    userId: string
  ): Promise<ContactDocument> {
    const contact = await ContactModel.findByIdAndUpdate(
      id,
      { assignedTo: userId },
      { new: true }
    );

    if (!contact) {
      throw AppError.NotFound('Contact request not found');
    }

    return contact;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await ContactModel.findByIdAndDelete(id);

    if (!result) {
      throw AppError.NotFound('Contact request not found');
    }

    return true;
  }
}