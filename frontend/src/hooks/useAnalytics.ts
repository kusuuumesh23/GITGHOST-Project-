import { useState, useEffect, useCallback } from 'react';
import { services } from '../services/index.js';
import { AnalyticsSummary } from '../types/index.js';

export function useAnalytics(businessId: string, range?: { dateFrom?: string; dateTo?: string }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!businessId) return;
    setIsLoading(true);
    setError(null);
    try {
      const summary = await services.analytics.summary(businessId, range);
      setData(summary);
    } catch (err: unknown) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, range?.dateFrom, range?.dateTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics: data,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}
