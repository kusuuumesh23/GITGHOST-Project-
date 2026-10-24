import { useState, useEffect, useCallback } from 'react';
import { services } from '../services/index.js';
import { Post, PostPatch } from '../types/index.js';

export function usePost(postId: string | undefined) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await services.posts.get(postId);
      setPost(data);
    } catch (err: unknown) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const update = async (patch: PostPatch) => {
    if (!postId) return;
    const updated = await services.posts.update(postId, patch);
    setPost(updated);
    return updated;
  };

  const approve = async (confirmed: boolean = true) => {
    if (!postId) return;
    const approved = await services.posts.approve(postId, confirmed);
    setPost(approved);
    return approved;
  };

  const archive = async () => {
    if (!postId) return;
    const archived = await services.posts.archive(postId);
    setPost(archived);
    return archived;
  };

  const restore = async () => {
    if (!postId) return;
    const restored = await services.posts.restore(postId);
    setPost(restored);
    return restored;
  };

  return {
    post,
    isLoading,
    error,
    refetch: fetchPost,
    update,
    approve,
    archive,
    restore,
  };
}
