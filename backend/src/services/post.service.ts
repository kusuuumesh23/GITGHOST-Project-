import { prisma } from '../db/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { PostStatus, Prisma } from '@prisma/client';

export interface ListPostsParams {
  businessId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PostStatus;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  includeArchived?: boolean;
}

export class PostService {
  async list(params: ListPostsParams) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 12));
    const skip = (page - 1) * pageSize;

    const where: Prisma.PostWhereInput = {
      businessId: params.businessId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.includeArchived ? {} : { status: { not: PostStatus.ARCHIVED } }),
      ...(params.platform ? { platform: params.platform } : {}),
    };

    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { caption: { contains: q, mode: 'insensitive' } },
        { hashtags: { has: q.toLowerCase().replace(/^#/, '') } },
      ];
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {
        ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
        ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          assets: true,
          snapshots: {
            orderBy: { recordedAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

    const hasMore = skip + items.length < total;

    return {
      items,
      total,
      page,
      pageSize,
      hasMore,
    };
  }

  async getById(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        assets: true,
        snapshots: {
          orderBy: { recordedAt: 'desc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return post;
  }

  async update(
    postId: string,
    data: Partial<{
      title: string;
      caption: string;
      hashtags: string[];
      callToAction: string;
      imagePrompt: string;
      status: PostStatus;
      scheduledAt: Date | null;
      platform: string;
    }>
  ) {
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    return prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.caption !== undefined ? { caption: data.caption } : {}),
        ...(data.hashtags !== undefined ? { hashtags: data.hashtags } : {}),
        ...(data.callToAction !== undefined ? { callToAction: data.callToAction } : {}),
        ...(data.imagePrompt !== undefined ? { imagePrompt: data.imagePrompt } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt } : {}),
        ...(data.platform !== undefined ? { platform: data.platform } : {}),
      },
      include: { assets: true, snapshots: true },
    });
  }

  async approvePost(postId: string, confirmed: boolean = true) {
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    if (!confirmed) {
      throw new BadRequestError('User permission is required to approve the post');
    }

    return prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.APPROVED,
        publishedAt: new Date(),
      },
      include: { assets: true, snapshots: true },
    });
  }

  async archive(postId: string) {
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    return prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.ARCHIVED,
        archivedAt: new Date(),
      },
      include: { assets: true },
    });
  }

  async restore(postId: string) {
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    return prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
        archivedAt: null,
      },
      include: { assets: true },
    });
  }

  async delete(postId: string) {
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    await prisma.post.delete({ where: { id: postId } });
    return { success: true, message: 'Post permanently deleted' };
  }
}

export const postService = new PostService();
