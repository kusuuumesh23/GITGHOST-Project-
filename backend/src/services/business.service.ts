import { prisma } from '../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { Role } from '@prisma/client';

export class BusinessService {
  async listForUser(userId: string) {
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId } } },
        ],
      },
      include: {
        settings: true,
        memberships: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return businesses.map(b => ({
      ...b,
      role: b.ownerId === userId ? Role.OWNER : b.memberships[0]?.role || Role.MEMBER,
    }));
  }

  async getById(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        settings: true,
        profileSources: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    return business;
  }

  async create(userId: string, data: { name: string; websiteUrl?: string; industry?: string; description?: string }) {
    return prisma.business.create({
      data: {
        name: data.name.trim(),
        websiteUrl: data.websiteUrl?.trim(),
        industry: data.industry?.trim(),
        description: data.description?.trim(),
        ownerId: userId,
        settings: {
          create: {
            timezone: 'UTC',
            defaultPlatform: 'INSTAGRAM',
          },
        },
        memberships: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        settings: true,
      },
    });
  }

  async update(businessId: string, data: Partial<{
    name: string;
    websiteUrl: string;
    industry: string;
    description: string;
    location: string;
    brandTone: string;
    targetAudience: string;
    preferredLanguage: string;
  }>) {
    const existing = await prisma.business.findUnique({ where: { id: businessId } });
    if (!existing) {
      throw new NotFoundError('Business not found');
    }

    return prisma.business.update({
      where: { id: businessId },
      data,
      include: {
        settings: true,
      },
    });
  }

  async delete(businessId: string, userId: string) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenError('Only the business owner can delete this business');
    }

    await prisma.business.delete({ where: { id: businessId } });
    return { success: true, message: 'Business deleted successfully' };
  }
}

export const businessService = new BusinessService();
