import type { MatchScoreResult } from '@/lib/match-score-api';

const CACHE_KEY_PREFIX = 'dpg:matchScore:v1';
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedMatchScore {
  score: MatchScoreResult;
  timestamp: number;
  localItemId: string;
  networkItemId: string;
}

export function generateCacheKey(localItemId: string, networkItemId: string): string {
  return `${CACHE_KEY_PREFIX}:${localItemId}:${networkItemId}`;
}

export function getCachedMatchScore(
  localItemId: string,
  networkItemId: string
): CachedMatchScore | null {
  try {
    const cacheKey = generateCacheKey(localItemId, networkItemId);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const parsed: CachedMatchScore = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    
    // Check if cache is expired
    if (age > DEFAULT_CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedMatchScore(
  localItemId: string,
  networkItemId: string,
  score: MatchScoreResult
): void {
  try {
    const cacheKey = generateCacheKey(localItemId, networkItemId);
    const cached: CachedMatchScore = {
      score,
      timestamp: Date.now(),
      localItemId,
      networkItemId,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export function clearMatchScoreCache(
  localItemId?: string,
  networkItemId?: string
): void {
  try {
    if (localItemId && networkItemId) {
      // Clear specific entry
      const cacheKey = generateCacheKey(localItemId, networkItemId);
      localStorage.removeItem(cacheKey);
    } else if (localItemId) {
      // Clear all entries for a local item
      const prefix = `${CACHE_KEY_PREFIX}:${localItemId}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      }
    } else {
      // Clear all match score cache
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    // Silently fail
  }
}

export function getMatchScoreBand(score: number): {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  if (score >= 0.85) {
    return {
      label: 'Excellent Match',
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      textColor: 'text-white',
    };
  }
  if (score >= 0.70) {
    return {
      label: 'Good Match',
      color: 'blue',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
    };
  }
  if (score >= 0.50) {
    return {
      label: 'Moderate Match',
      color: 'amber',
      bgColor: 'bg-amber-500',
      textColor: 'text-white',
    };
  }
  return {
    label: 'Low Match',
    color: 'rose',
    bgColor: 'bg-rose-500',
    textColor: 'text-white',
  };
}

export function formatScorePercentage(score: number): string {
  return `${Math.round(score * 100)}%`;
}
