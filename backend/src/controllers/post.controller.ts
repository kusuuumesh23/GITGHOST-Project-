import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { postService } from '../services/post.service.js';
import { PostStatus } from '@prisma/client';

export const listPostsQuerySchema = z.object({
  page: z.string().optional().transform(v => (v ? Number(v) : undefined)),
  pageSize: z.string().optional().transform(v => (v ? Number(v) : undefined)),
  search: z.string().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  platform: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  includeArchived: z.string().optional().transform(v => v === 'true'),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  caption: z.string().min(1).optional(),
  hashtags: z.array(z.string()).optional(),
  callToAction: z.string().min(1).optional(),
  imagePrompt: z.string().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  scheduledAt: z.string().nullable().optional().transform(v => (v ? new Date(v) : null)),
  platform: z.string().optional(),
});

export async function listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await postService.list({
      businessId: req.params.businessId,
      ...req.query,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.getById(req.params.postId);
    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await postService.update(req.params.postId, req.body);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function archivePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const archived = await postService.archive(req.params.postId);
    res.status(200).json({
      success: true,
      data: archived,
    });
  } catch (err) {
    next(err);
  }
}

export async function restorePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const restored = await postService.restore(req.params.postId);
    res.status(200).json({
      success: true,
      data: restored,
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await postService.delete(req.params.postId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export const approvePostSchema = z.object({
  permissionGranted: z.boolean().default(true),
  notes: z.string().optional(),
});

export async function approvePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const approved = await postService.approvePost(req.params.postId, req.body.permissionGranted ?? true);
    res.status(200).json({
      success: true,
      message: 'Post approved and permission granted to publish',
      data: approved,
    });
  } catch (err) {
    next(err);
  }
}

