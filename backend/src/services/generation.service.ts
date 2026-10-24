import { prisma } from '../db/prisma.js';
import { getDeepSeekProvider, GeneratePostInput } from '../providers/nvidia-nim/index.js';
import { imageProvider } from '../providers/image/index.js';
import { getBusinessDateString } from '../utils/timezone.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { JobStatus, JobType, PostStatus, AssetType } from '@prisma/client';

export interface CreateGenerationRequest {
  contentGoal: string;
  offerOrPromotion?: string;
  platform?: string;
  language?: string;
  additionalInstructions?: string;
  idempotencyKey?: string;
  allowMultipleDailyPosts?: boolean;
}

export class GenerationService {
  async startGenerationJob(businessId: string, req: CreateGenerationRequest) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { settings: true },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    const timezone = business.settings?.timezone || 'UTC';
    const targetDate = getBusinessDateString(timezone);

    // Check for daily post constraint
    if (!req.allowMultipleDailyPosts) {
      const existingTodayPost = await prisma.post.findFirst({
        where: {
          businessId,
          targetDate,
          status: { not: PostStatus.ARCHIVED },
        },
        include: { assets: true },
      });

      if (existingTodayPost) {
        return {
          alreadyExists: true,
          message: "A post for today has already been generated. You can review and edit today's post or create an additional post.",
          post: existingTodayPost,
        };
      }
    }

    // Idempotency key deduplication
    if (req.idempotencyKey) {
      const existingJob = await prisma.generationJob.findUnique({
        where: { idempotencyKey: req.idempotencyKey },
      });

      if (existingJob) {
        if (existingJob.status === JobStatus.PROCESSING || existingJob.status === JobStatus.PENDING) {
          return {
            jobId: existingJob.id,
            status: existingJob.status,
            progress: existingJob.progress,
            message: 'Generation job is currently processing',
          };
        }
        if (existingJob.status === JobStatus.COMPLETED && existingJob.postId) {
          const post = await prisma.post.findUnique({
            where: { id: existingJob.postId },
            include: { assets: true },
          });
          return {
            jobId: existingJob.id,
            status: existingJob.status,
            progress: 100,
            post,
          };
        }
      }
    }

    // Create job record
    const job = await prisma.generationJob.create({
      data: {
        businessId,
        jobType: JobType.GENERATE_DAILY_POST,
        status: JobStatus.PROCESSING,
        progress: 10,
        stage: 'INITIALIZING',
        idempotencyKey: req.idempotencyKey,
        inputPayload: req as any,
        startedAt: new Date(),
      },
    });

    // Run generation workflow asynchronously
    this.executeGeneration(job.id, businessId, req, targetDate).catch(err => {
      logger.error({ err, jobId: job.id }, 'Unhandled error in background generation');
    });

    return {
      jobId: job.id,
      status: JobStatus.PROCESSING,
      progress: 10,
      stage: 'GENERATING_COPY',
      targetDate,
      message: 'Post generation started',
    };
  }

  private async executeGeneration(
    jobId: string,
    businessId: string,
    req: CreateGenerationRequest,
    targetDate: string
  ): Promise<void> {
    const deepSeek = getDeepSeekProvider();

    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { settings: true },
      });

      if (!business) {
        throw new NotFoundError('Business not found');
      }

      // Stage 1: Generate Text via DeepSeek
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { progress: 30, stage: 'GENERATING_COPY' },
      });

      const input: GeneratePostInput = {
        businessName: business.name,
        industry: business.industry || 'Local Small Business',
        description: business.description || '',
        productsAndServices: [],
        targetAudience: business.targetAudience || '',
        brandTone: business.brandTone || 'Warm and professional',
        contentGoal: req.contentGoal || 'INCREASE_LOCAL_AWARENESS',
        offerOrPromotion: req.offerOrPromotion,
        platform: req.platform || business.settings?.defaultPlatform || 'INSTAGRAM',
        language: req.language || business.settings?.defaultLanguage || 'en',
        additionalInstructions: req.additionalInstructions,
        maxHashtags: 6,
      };

      const copyOutput = await deepSeek.generatePost(input);

      // Create draft Post record first so copy is never lost
      const post = await prisma.post.create({
        data: {
          businessId,
          title: copyOutput.title,
          caption: copyOutput.caption,
          hashtags: copyOutput.hashtags,
          callToAction: copyOutput.callToAction,
          imagePrompt: copyOutput.imagePrompt,
          platform: copyOutput.suggestedPlatform,
          language: copyOutput.contentLanguage,
          contentGoal: req.contentGoal,
          status: PostStatus.PENDING_APPROVAL,
          targetDate,
          generationJobId: jobId,
        },
      });

      // Stage 2: Generate or Configure Image
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { progress: 70, stage: 'GENERATING_IMAGE', postId: post.id },
      });

      try {
        const imageResult = await imageProvider.generateImage(copyOutput.imagePrompt);

        if (imageResult.status === 'GENERATED' && imageResult.storagePath) {
          await prisma.postAsset.create({
            data: {
              postId: post.id,
              assetType: AssetType.IMAGE,
              storagePath: imageResult.storagePath,
              mimeType: imageResult.mimeType || 'image/png',
              metadata: (imageResult.metadata || {}) as any,
            },
          });
        }
      } catch (imgErr) {
        // Partial failure: Text succeeded, image generation failed or unconfigured
        logger.warn({ err: imgErr, postId: post.id }, 'Image asset generation encountered error, draft copy preserved');
      }

      // Stage 3: Complete Job
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          progress: 100,
          stage: 'COMPLETED',
          completedAt: new Date(),
          outputPayload: copyOutput as any,
        },
      });

      logger.info({ businessId, postId: post.id }, 'Post generation job completed successfully');
    } catch (err: unknown) {
      logger.error({ err, jobId }, 'Generation job failed');
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          stage: 'FAILED',
          errorCode: 'GENERATION_ERROR',
          errorMessage: (err as Error).message,
          updatedAt: new Date(),
        },
      });
    }
  }

  async getJobStatus(jobId: string) {
    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Generation job not found');
    }

    let post = null;
    if (job.postId) {
      post = await prisma.post.findUnique({
        where: { id: job.postId },
        include: { assets: true },
      });
    }

    return {
      id: job.id,
      businessId: job.businessId,
      status: job.status,
      progress: job.progress,
      stage: job.stage,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
      retryCount: job.retryCount,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      post,
    };
  }

  async retryJob(jobId: string) {
    const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError('Generation job not found');
    }

    if (job.status === JobStatus.PROCESSING) {
      throw new ConflictError('Job is currently processing');
    }

    if (job.retryCount >= job.maxRetries) {
      throw new BadRequestError(`Maximum retry attempts (${job.maxRetries}) reached`);
    }

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.PROCESSING,
        progress: 10,
        stage: 'RETRYING',
        retryCount: { increment: 1 },
        errorCode: null,
        errorMessage: null,
        startedAt: new Date(),
      },
    });

    const business = await prisma.business.findUnique({
      where: { id: job.businessId },
      include: { settings: true },
    });
    const timezone = business?.settings?.timezone || 'UTC';
    const targetDate = getBusinessDateString(timezone);

    const inputPayload = (job.inputPayload as CreateGenerationRequest) || {
      contentGoal: 'INCREASE_LOCAL_AWARENESS',
    };

    this.executeGeneration(job.id, job.businessId, inputPayload, targetDate).catch(err => {
      logger.error({ err, jobId: job.id }, 'Unhandled error in retry execution');
    });

    return {
      jobId: job.id,
      status: JobStatus.PROCESSING,
      progress: 10,
      retryCount: job.retryCount + 1,
      message: 'Job retry initiated',
    };
  }

  async regenerateCaption(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { business: { include: { settings: true } } },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const deepSeek = getDeepSeekProvider();
    const input: GeneratePostInput = {
      businessName: post.business.name,
      industry: post.business.industry || 'Small Business',
      description: post.business.description || '',
      productsAndServices: [],
      targetAudience: post.business.targetAudience || '',
      brandTone: post.business.brandTone || 'Warm and professional',
      contentGoal: post.contentGoal,
      platform: post.platform,
      language: post.language,
      maxHashtags: post.hashtags.length || 6,
    };

    const newCopy = await deepSeek.regenerateCaption(input, post.title);

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        caption: newCopy.caption,
        hashtags: newCopy.hashtags,
        callToAction: newCopy.callToAction,
      },
      include: { assets: true },
    });

    return updated;
  }

  async regenerateImage(postId: string, customVisualPrompt?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { business: { include: { settings: true } } },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    let promptToUse = customVisualPrompt;
    if (!promptToUse) {
      const deepSeek = getDeepSeekProvider();
      const input: GeneratePostInput = {
        businessName: post.business.name,
        industry: post.business.industry || 'Small Business',
        description: post.business.description || '',
        productsAndServices: [],
        targetAudience: post.business.targetAudience || '',
        brandTone: post.business.brandTone || 'Warm and professional',
        contentGoal: post.contentGoal,
        platform: post.platform,
        language: post.language,
        maxHashtags: 6,
      };
      promptToUse = await deepSeek.regenerateImagePrompt(input, post.caption);
    }

    const imageResult = await imageProvider.generateImage(promptToUse);

    if (imageResult.status === 'GENERATED' && imageResult.storagePath) {
      // Remove previous asset records if any
      await prisma.postAsset.deleteMany({ where: { postId } });

      await prisma.postAsset.create({
        data: {
          postId,
          assetType: AssetType.IMAGE,
          storagePath: imageResult.storagePath,
          mimeType: imageResult.mimeType || 'image/png',
          metadata: (imageResult.metadata || {}) as any,
        },
      });
    }

    return prisma.post.update({
      where: { id: postId },
      data: { imagePrompt: promptToUse },
      include: { assets: true },
    });
  }
}

export const generationService = new GenerationService();
