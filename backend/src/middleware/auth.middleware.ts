import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { prisma } from '../db/prisma.js';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      businessMembershipRole?: Role;
    }
  }
}

/**
 * Middleware requiring a valid JWT token.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token is required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}

/**
 * Middleware ensuring the authenticated user has access to the specified business.
 * Supports OWNER, ADMIN, MEMBER roles.
 */
export function requireBusinessAccess(allowedRoles: Role[] = [Role.OWNER, Role.ADMIN, Role.MEMBER]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const businessId = req.params.businessId || req.body.businessId;
    if (!businessId) {
      return next(new ForbiddenError('Business ID is required for authorization'));
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        memberships: {
          where: { userId: req.user.userId },
        },
      },
    });

    if (!business) {
      return next(new NotFoundError('Business not found'));
    }

    // Direct owner check
    if (business.ownerId === req.user.userId) {
      req.businessMembershipRole = Role.OWNER;
      return next();
    }

    // Membership check
    const membership = business.memberships[0];
    if (!membership || !allowedRoles.includes(membership.role)) {
      return next(new ForbiddenError('You do not have permission to access this business'));
    }

    req.businessMembershipRole = membership.role;
    next();
  };
}
