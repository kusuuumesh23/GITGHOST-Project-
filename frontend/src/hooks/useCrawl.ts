import { useState, useEffect, useCallback } from 'react';
import { services } from '../services/index.js';
import { CrawlJobResult, BusinessProfile } from '../types/index.js';

export function useCrawl(businessId: string) {
  const [crawlData, setCrawlData] = useState<CrawlJobResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!businessId) return;
    try {
      const status = await services.crawl.status(businessId);
      setCrawlData(status);
    } catch (err: unknown) {
      setError(err as Error);
    }
  }, [businessId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const startCrawl = async (websiteUrl?: string) => {
    if (!businessId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await services.crawl.start(businessId, websiteUrl);
      // Poll a few times if processing
      let attempts = 0;
      while (attempts < 20) {
        await new Promise(r => setTimeout(r, 2000));
        attempts += 1;
        const current = await services.crawl.status(businessId);
        setCrawlData(current);
        if (current.status === 'COMPLETED' || current.status === 'FAILED') {
          break;
        }
      }
      return result;
    } catch (err: unknown) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const retryCrawl = async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      await services.crawl.retry(businessId);
      return fetchStatus();
    } catch (err: unknown) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirm = async (confirmedData: Partial<BusinessProfile>) => {
    if (!businessId) return;
    const updated = await services.crawl.confirm(businessId, confirmedData);
    await fetchStatus();
    return updated;
  };

  return {
    crawlData,
    isLoading,
    error,
    startCrawl,
    retryCrawl,
    confirm,
    refetch: fetchStatus,
  };
}
