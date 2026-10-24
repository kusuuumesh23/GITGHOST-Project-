import { Router } from 'express';
import {
  listPosts,
  getPost,
  updatePost,
  archivePost,
  restorePost,
  deletePost,
  approvePost,
  listPostsQuerySchema,
  updatePostSchema,
  approvePostSchema,
} from '../controllers/post.controller.js';
import {
  getApprovalQueue,
  publishPostNow,
  retryPost,
  rejectPost,
} from '../controllers/posting.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireBusinessAccess } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get(
  '/businesses/:businessId/posts',
  requireBusinessAccess([Role.OWNER, Role.ADMIN, Role.MEMBER]),
  validate({ query: listPostsQuerySchema }),
  listPosts
);

// Approval Queue (must be before :postId)
router.get('/posts/approval-queue', getApprovalQueue);

router.get('/posts/:postId', getPost);
router.patch('/posts/:postId', validate({ body: updatePostSchema }), updatePost);
router.post('/posts/:postId/approve', validate({ body: approvePostSchema }), approvePost);
router.post('/posts/:postId/reject', rejectPost);
router.post('/posts/:postId/publish', publishPostNow);
router.post('/posts/:postId/retry', retryPost);
router.post('/posts/:postId/archive', archivePost);
router.post('/posts/:postId/restore', restorePost);
router.delete('/posts/:postId', deletePost);

export default router;
