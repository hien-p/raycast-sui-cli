/**
 * React hook for Statsig feature flags
 *
 * Usage:
 * const { isEnabled, flags } = useFeatureFlags();
 *
 * if (isEnabled('enable_beta_features')) {
 *   // Show beta feature
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import {
  checkGate,
  getAllFeatureFlags,
  FeatureGates,
  type FeatureGateName,
} from '@/lib/statsig';

interface UseFeatureFlagsReturn {
  /** Check if a specific gate is enabled */
  isEnabled: (gateName: FeatureGateName) => boolean;
  /** All feature flags with their current status */
  flags: Record<FeatureGateName, boolean>;
  /** Loading state */
  isLoading: boolean;
  /** Refresh flags from Statsig */
  refresh: () => void;
}

/**
 * Hook to access Statsig feature flags
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const [flags, setFlags] = useState<Record<FeatureGateName, boolean>>(() => getAllFeatureFlags());
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    // Small delay to ensure Statsig is initialized
    const timer = setTimeout(() => {
      setFlags(getAllFeatureFlags());
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const isEnabled = useCallback((gateName: FeatureGateName): boolean => {
    return checkGate(gateName);
  }, []);

  const refresh = useCallback(() => {
    setFlags(getAllFeatureFlags());
  }, []);

  return {
    isEnabled,
    flags,
    isLoading,
    refresh,
  };
}

/**
 * Convenience hook for checking a single feature flag
 */
export function useFeatureFlag(gateName: FeatureGateName): boolean {
  const [enabled, setEnabled] = useState(() => checkGate(gateName));

  useEffect(() => {
    // Small delay to ensure Statsig is initialized
    const timer = setTimeout(() => {
      setEnabled(checkGate(gateName));
    }, 100);

    return () => clearTimeout(timer);
  }, [gateName]);

  return enabled;
}

// Re-export feature gate constants for convenience
export { FeatureGates };
