import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { Role } from '@prisma/client';

export class AuthService {
  async register(data: { name: string; email: string; password: string; businessName?: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);

    // Create user and initial business inside a transaction
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          passwordHash,
        },
      });

      const initialBusinessName = data.businessName?.trim() || `${user.name}'s Business`;
      const business = await tx.business.create({
        data: {
          name: initialBusinessName,
          ownerId: user.id,
          settings: {
            create: {
              timezone: 'UTC',
              defaultPlatform: 'INSTAGRAM',
            },
          },
          memberships: {
            create: {
              userId: user.id,
              role: Role.OWNER,
            },
          },
        },
      });

      return { user, business };
    });

    const token = this.generateToken({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
    });

    return {
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      activeBusinessId: result.business.id,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
      include: {
        ownedBusinesses: { take: 1 },
        memberships: { take: 1, include: { business: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const activeBusinessId =
      user.ownedBusinesses[0]?.id || user.memberships[0]?.businessId || null;

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      activeBusinessId,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        ownedBusinesses: {
          select: { id: true, name: true, industry: true, websiteUrl: true },
        },
        memberships: {
          select: {
            role: true,
            business: {
              select: { id: true, name: true, industry: true, websiteUrl: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  private generateToken(payload: { userId: string; email: string; name: string }): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }
}

export const authService = new AuthService();
