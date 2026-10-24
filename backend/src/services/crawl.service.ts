import { prisma } from '../db/prisma.js';
import { getTinyFishProvider, ExtractedBusinessData } from '../providers/tinyfish/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { CrawlStatus, ConfirmationStatus } from '@prisma/client';
import { validatePublicUrl } from '../utils/ssrf.js';

export class CrawlService {
  async startCrawl(businessId: string, customUrl?: string) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundError('Business not found');
    }

    const targetUrl = customUrl || business.websiteUrl;
    if (!targetUrl) {
      throw new BadRequestError('A website URL is required to start crawling');
    }

    // SSRF & protocol validation
    await validatePublicUrl(targetUrl);

    // Save targetUrl to business if not present
    if (!business.websiteUrl) {
      await prisma.business.update({
        where: { id: businessId },
        data: { websiteUrl: targetUrl },
      });
    }

    // Create or find an active profile source entry
    const sourceRecord = await prisma.businessProfileSource.create({
      data: {
        businessId,
        sourceUrl: targetUrl,
        crawlStatus: CrawlStatus.PROCESSING,
        userConfirmationStatus: ConfirmationStatus.UNREVIEWED,
      },
    });

    // Run crawl job asynchronously to not block HTTP response
    this.executeCrawlJob(sourceRecord.id, businessId, targetUrl).catch(err => {
      logger.error({ err, sourceId: sourceRecord.id }, 'Unhandled error in crawl job background execution');
    });

    return {
      jobId: sourceRecord.id,
      businessId,
      sourceUrl: targetUrl,
      status: CrawlStatus.PROCESSING,
      message: 'Website crawl started. Check status with GET /api/v1/businesses/:businessId/website-crawl',
    };
  }

  private async executeCrawlJob(sourceId: string, businessId: string, url: string): Promise<void> {
    const provider = getTinyFishProvider();

    try {
      const result = await provider.crawlAndExtract(url);

      if (!result.success || !result.data) {
        await prisma.businessProfileSource.update({
          where: { id: sourceId },
          data: {
            crawlStatus: CrawlStatus.FAILED,
            errorDetails: result.error || 'Failed to extract structured data from website',
            updatedAt: new Date(),
          },
        });
        return;
      }

      await prisma.businessProfileSource.update({
        where: { id: sourceId },
        data: {
          crawlStatus: CrawlStatus.COMPLETED,
          extractedData: result.data as any,
          extractionTimestamp: result.crawledAt,
          errorDetails: null,
          updatedAt: new Date(),
        },
      });

      logger.info({ businessId, sourceId }, 'Crawl job completed successfully');
    } catch (err: unknown) {
      logger.error({ err, sourceId }, 'Crawl execution encountered exception');
      await prisma.businessProfileSource.update({
        where: { id: sourceId },
        data: {
          crawlStatus: CrawlStatus.FAILED,
          errorDetails: (err as Error).message,
          updatedAt: new Date(),
        },
      });
    }
  }

  async getCrawlStatus(businessId: string) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundError('Business not found');
    }

    const latestSource = await prisma.businessProfileSource.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestSource) {
      return {
        hasCrawled: false,
        websiteUrl: business.websiteUrl || null,
        status: null,
        extractedData: null,
      };
    }

    return {
      hasCrawled: true,
      jobId: latestSource.id,
      websiteUrl: latestSource.sourceUrl,
      status: latestSource.crawlStatus,
      extractedData: latestSource.extractedData as ExtractedBusinessData | null,
      errorDetails: latestSource.errorDetails,
      extractionTimestamp: latestSource.extractionTimestamp,
      userConfirmationStatus: latestSource.userConfirmationStatus,
      createdAt: latestSource.createdAt,
    };
  }

  async retryCrawl(businessId: string) {
    const latestSource = await prisma.businessProfileSource.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    const urlToCrawl = latestSource?.sourceUrl;
    return this.startCrawl(businessId, urlToCrawl);
  }

  async confirmExtractedProfile(
    businessId: string,
    confirmedData: Partial<{
      name: string;
      industry: string;
      description: string;
      targetAudience: string;
      brandTone: string;
      location: string;
    }>
  ) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundError('Business not found');
    }

    // Mark the latest source record as confirmed
    const latestSource = await prisma.businessProfileSource.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestSource) {
      await prisma.businessProfileSource.update({
        where: { id: latestSource.id },
        data: { userConfirmationStatus: ConfirmationStatus.CONFIRMED },
      });
    }

    // Update business profile with approved values only
    return prisma.business.update({
      where: { id: businessId },
      data: {
        name: confirmedData.name?.trim() || business.name,
        industry: confirmedData.industry?.trim() || business.industry,
        description: confirmedData.description?.trim() || business.description,
        targetAudience: confirmedData.targetAudience?.trim() || business.targetAudience,
        brandTone: confirmedData.brandTone?.trim() || business.brandTone,
        location: confirmedData.location?.trim() || business.location,
      },
      include: {
        settings: true,
      },
    });
  }
}

export const crawlService = new CrawlService();
