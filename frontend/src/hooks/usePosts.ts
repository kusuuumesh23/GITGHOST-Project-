import { useState, useEffect, useCallback } from 'react';
import { services } from '../services/index.js';
import { Post, ListPostsParams } from '../types/index.js';

export function usePosts(businessId: string, params: ListPostsParams = {}) {
  const [data, setData] = useState<{ items: Post[]; total: number; hasMore: boolean }>({
    items: [],
    total: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!businessId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await services.posts.list(businessId, params);
      setData(result);
    } catch (err: unknown) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, JSON.stringify(params)]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts: data.items,
    total: data.total,
    hasMore: data.hasMore,
    isLoading,
    error,
    refetch: fetchPosts,
  };
}
