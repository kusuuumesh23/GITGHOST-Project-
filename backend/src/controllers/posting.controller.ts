import { Request, Response, NextFunction } from 'express';
import { publishPost } from '../services/posting.service.js';
import { prisma } from '../db/prisma.js';
import { PostStatus } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

/** POST /posts/:id/approve or /posts/:postId/approve — approve a post (sets status to APPROVED) */
export async function approvePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.postId || req.params.id;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundError('Post not found');

    // Verify ownership via business membership
    const membership = await prisma.businessMembership.findFirst({
      where: { businessId: post.businessId, userId: req.user!.userId },
    });
    if (!membership) throw new ForbiddenError('Not authorised to approve this post');

    const updated = await prisma.post.update({
      where: { id },
      data: { status: PostStatus.APPROVED },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/** POST /posts/:id/reject or /posts/:postId/reject — reject a post (sets status to ARCHIVED) */
export async function rejectPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.postId || req.params.id;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundError('Post not found');

    const membership = await prisma.businessMembership.findFirst({
      where: { businessId: post.businessId, userId: req.user!.userId },
    });
    if (!membership) throw new ForbiddenError('Not authorised to reject this post');

    const updated = await prisma.post.update({
      where: { id },
      data: { status: PostStatus.ARCHIVED, archivedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/** POST /posts/:id/publish or /posts/:postId/publish — immediately publish an approved post */
export async function publishPostNow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.postId || req.params.id;
    const result = await publishPost(id, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** POST /posts/:id/retry or /posts/:postId/retry — retry a failed post */
export async function retryPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.postId || req.params.id;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundError('Post not found');
    if (post.status !== PostStatus.FAILED) throw new ForbiddenError('Only FAILED posts can be retried');

    // Re-approve before retry
    await prisma.post.update({ where: { id }, data: { status: PostStatus.APPROVED, failureReason: null } });
    const result = await publishPost(id, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** GET /posts/approval-queue?businessId=... — posts awaiting approval */
export async function getApprovalQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { businessId } = req.query as { businessId?: string };

    if (!businessId) {
      res.status(400).json({ success: false, error: { message: 'businessId is required' } });
      return;
    }

    const membership = await prisma.businessMembership.findFirst({
      where: { businessId, userId: req.user!.userId },
    });
    if (!membership) throw new ForbiddenError('Not authorised to view this business queue');

    const posts = await prisma.post.findMany({
      where: {
        businessId,
        status: { in: [PostStatus.PENDING_APPROVAL, PostStatus.FAILED] },
      },
      include: { assets: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
}
