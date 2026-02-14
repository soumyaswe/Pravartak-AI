"use client";

import { useState, useCallback } from 'react';
import { calculateProfileProgress } from '@/actions/profile-progress';

/**
 * Custom hook for managing profile progress
 * Provides methods to fetch and update profile progress
 */
export function useProfileProgress() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calculateProfileProgress();
      setProgress(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProgress = useCallback(async () => {
    return await fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    fetchProgress,
    refreshProgress,
    completionPercentage: progress?.completionPercentage || 0,
    missingItems: progress?.missingItems || [],
    completedItems: progress?.completedItems || [],
  };
}
