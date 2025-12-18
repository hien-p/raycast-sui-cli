/**
 * Community & Membership API
 * @module api/services/community
 */

import { fetchApi } from '../core/request';

// Types
export interface EligibilityInfo {
  eligible: boolean;
  reasons: string[];
  txCount: number;
  balance: number;
  requirements: {
    minTxCount: number;
    minBalance: number;
  };
}

export interface TierInfo {
  level: number;
  name: string;
  icon: string;
  color: string;
  colorGradient: string;
  description: string;
  txCount: number;
  contractCount: number;
  hasDeployedContract: boolean;
  progress: {
    current: number;
    required: number;
    percentage: number;
    nextTier: string | null;
  };
}

export interface TierMetadata {
  name: string;
  icon: string;
  color: string;
  colorGradient: string;
  description: string;
}

export interface DeployedPackage {
  id: string;
  package: string;
  version: string;
  digest: string;
}

// API functions
export async function getCommunityStats() {
  return fetchApi<{ totalMembers: number; isConfigured: boolean }>('/community/stats');
}

export async function getCommunityConfig() {
  return fetchApi<{ packageId: string; registryId: string; isConfigured: boolean }>('/community/config');
}

export async function checkCommunityMembership() {
  return fetchApi<{ isMember: boolean }>('/community/membership');
}

export async function joinCommunity() {
  return fetchApi<{ txDigest?: string; alreadyMember?: boolean }>('/community/join', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function checkEligibility(address: string) {
  return fetchApi<EligibilityInfo>(`/community/eligibility/${address}`);
}

export async function getTierInfo(address: string) {
  return fetchApi<TierInfo>(`/community/tier/${address}`);
}

export async function getTierMetadata() {
  return fetchApi<Record<number, TierMetadata>>('/community/tier-metadata');
}

export async function getTierRequirements() {
  return fetchApi<{ WAVE_MIN_TX: number; TSUNAMI_MIN_TX: number }>('/community/tier-requirements');
}

export async function refreshTier(address: string) {
  return fetchApi<TierInfo>(`/community/tier/refresh/${address}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getDeployedPackages(address: string) {
  return fetchApi<DeployedPackage[]>(`/community/packages/${address}`);
}
