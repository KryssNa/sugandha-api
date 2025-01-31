

// src/middleware/authorize.middleware.ts
import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types/user.types";
import { AppError } from "../utils/AppError";


type RoleOrRoles = UserRole | UserRole[];

// checking role based access
export const authorize = (allowedRoles: RoleOrRoles) => {
  // Convert single role to array for consistency
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Check if user exists in request
      if (!req.user) {
        throw new AppError(401, "Authentication required", [
          { message: "Please log in to access this resource" }
        ]);
      }

      // Check if user role is included in allowed roles
      if (!roles.includes(req.user.role)) {
        throw new AppError(403, "Access denied", [
          {
            message: "You don't have permission to perform this action",
            field: "role",
            code: "INSUFFICIENT_PERMISSIONS"
          }
        ]);
      }

      next();
    } catch (error) {
      // Pass error to global error handler
      next(error);
    }
  };
};

// Helper function for checking multiple roles
export const hasRole = (userRole: UserRole, allowedRoles: RoleOrRoles): boolean => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(userRole);
};

// Middleware for checking specific permissions
// export const checkPermission = (permission: string) => {
//   return (req: Request, _res: Response, next: NextFunction): void => {
//     try {
//       if (!req.user) {
//         throw new AppError(401, "Authentication required", [
//           { message: "Please log in to access this resource" }
//         ]);
//       }

//       if (!req.user.permissions?.includes(permission)) {
//         throw new AppError(403, "Access denied", [
//           { 
//             message: `Missing required permission: ${permission}`,
//             field: "permission",
//             code: "MISSING_PERMISSION"
//           }
//         ]);
//       }

//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
// };

// Combined middleware for both role and permission checks
// export const authorizeWithPermission = (roles: RoleOrRoles, permission: string) => {
//   return (req: Request, _res: Response, next: NextFunction): void => {
//     try {
//       if (!req.user) {
//         throw new AppError(401, "Authentication required", [
//           { message: "Please log in to access this resource" }
//         ]);
//       }

//       const hasValidRole = hasRole(req.user.role, roles);
//       const hasValidPermission = req.user.permissions?.includes(permission);

//       if (!hasValidRole || !hasValidPermission) {
//         throw new AppError(403, "Access denied", [
//           { 
//             message: "Insufficient role or permission",
//             field: !hasValidRole ? "role" : "permission",
//             code: !hasValidRole ? "INVALID_ROLE" : "MISSING_PERMISSION"
//           }
//         ]);
//       }

//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
// };

// Usage examples:
/*
// Simple role check
router.delete('/users/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  UserController.deleteUser
);

// Multiple roles
router.patch('/products/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.MANAGER]),
  ProductController.updateProduct
);

// Permission check
router.post('/posts',
  authenticate,
  checkPermission('create:posts'),
  PostController.createPost
);

// Combined role and permission check
router.delete('/posts/:id',
  authenticate,
  authorizeWithPermission([UserRole.ADMIN, UserRole.MANAGER], 'delete:posts'),
  PostController.deletePost
);
*/