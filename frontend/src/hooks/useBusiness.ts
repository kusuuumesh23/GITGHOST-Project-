import { useState, useEffect, useCallback } from 'react';
import { services } from '../services/index.js';
import { BusinessProfile } from '../types/index.js';

export function useBusiness() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await services.business.list();
      setBusinesses(list);

      const savedId = localStorage.getItem('postdaily.activeBusinessId');
      const found = list.find(b => b.id === savedId) || list[0] || null;
      setActiveBusiness(found);
      if (found) {
        localStorage.setItem('postdaily.activeBusinessId', found.id);
      }
    } catch (err: unknown) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const selectBusiness = (businessId: string) => {
    const found = businesses.find(b => b.id === businessId);
    if (found) {
      setActiveBusiness(found);
      localStorage.setItem('postdaily.activeBusinessId', found.id);
    }
  };

  const updateProfile = async (patch: Partial<BusinessProfile>) => {
    if (!activeBusiness) return;
    const updated = await services.business.update(activeBusiness.id, patch);
    setActiveBusiness(updated);
    setBusinesses(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    return updated;
  };

  return {
    businesses,
    activeBusiness,
    activeBusinessId: activeBusiness?.id || '',
    isLoading,
    error,
    selectBusiness,
    updateProfile,
    refetch: fetchBusinesses,
  };
}
