import { useState, useCallback, useMemo } from 'react';
import type { Item } from '@/lib/item-api';
import {
  calculateMatchScore,
  itemToSnapshot,
  type MatchScoreResult,
} from '@/lib/match-score-api';
import {
  getCachedMatchScore,
  setCachedMatchScore,
  clearMatchScoreCache,
} from '@/utils/match-score-cache';

interface UseMatchScoreOptions {
  localItem: Item | null;
  networkItem: Item;
  skipCache?: boolean;
}

interface UseMatchScoreReturn {
  score: MatchScoreResult | null;
  isLoading: boolean;
  error: Error | null;
  cached: boolean;
  calculate: () => Promise<void>;
  recalculate: () => Promise<void>;
  clearCache: () => void;
}

export function useMatchScore({
  localItem,
  networkItem,
  skipCache = false,
}: UseMatchScoreOptions): UseMatchScoreReturn {
  const [score, setScore] = useState<MatchScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cached, setCached] = useState(false);

  const cacheKey = useMemo(
    () => ({
      localItemId: localItem?.item_id ?? '',
      networkItemId: networkItem.item_id,
    }),
    [localItem?.item_id, networkItem.item_id]
  );

  const calculate = useCallback(async () => {
    if (!localItem) {
      setError(new Error('No local item selected'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first (unless skipCache is true)
      if (!skipCache) {
        const cachedResult = getCachedMatchScore(
          cacheKey.localItemId,
          cacheKey.networkItemId
        );
        if (cachedResult) {
          setScore(cachedResult.score);
          setCached(true);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API
      const payload = {
        itemA: itemToSnapshot(localItem),
        itemB: itemToSnapshot(networkItem),
      };

      const result = await calculateMatchScore(payload);
      
      // Cache the result
      setCachedMatchScore(cacheKey.localItemId, cacheKey.networkItemId, result);
      
      setScore(result);
      setCached(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate match score';
      setError(new Error(errorMessage));
      setScore(null);
    } finally {
      setIsLoading(false);
    }
  }, [localItem, networkItem, cacheKey, skipCache]);

  const recalculate = useCallback(async () => {
    // Clear cache for this specific pair
    clearMatchScoreCache(cacheKey.localItemId, cacheKey.networkItemId);
    setCached(false);
    // Calculate fresh
    await calculate();
  }, [cacheKey.localItemId, cacheKey.networkItemId, calculate]);

  const clearCache = useCallback(() => {
    clearMatchScoreCache(cacheKey.localItemId, cacheKey.networkItemId);
    setScore(null);
    setCached(false);
  }, [cacheKey.localItemId, cacheKey.networkItemId]);

  return {
    score,
    isLoading,
    error,
    cached,
    calculate,
    recalculate,
    clearCache,
  };
}
