// routes/contact.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validate';

import { ContactController } from '../controllers/contact.controller';
import { UploadMiddleware } from '../middlewares/upload';
import { createContactSchema, updateContactStatusSchema } from '../schemas/contact.schema';
import { UserRole } from '../types/user.types';

const router = Router();

// Public routes
router.post(
    '/',
    UploadMiddleware.multiple('documents', 'attachment', 'attachment', 5), // Allow up to 5 file uploads
    validateRequest(createContactSchema),
    ContactController.createContact
);

// Protected routes - Admin/Support access
router.use(authenticate);
router.use(authorize([UserRole.ADMIN]));

router.get('/', ContactController.getAllContacts);
router.get('/:id', ContactController.getContactById);
router.patch(
    '/:id/status',
    validateRequest(updateContactStatusSchema),
    ContactController.updateContactStatus
);
router.patch('/:id/assign', ContactController.assignContact);
router.delete('/:id', ContactController.deleteContact);

export default router;