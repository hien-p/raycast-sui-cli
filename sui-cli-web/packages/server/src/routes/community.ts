import { FastifyInstance } from 'fastify';
import { CommunityService } from '../services/CommunityService';
import { TierService, TierInfo, TIER_METADATA } from '../services/TierService';
import type { ApiResponse } from '@sui-cli-web/shared';
import { sanitizeErrorMessage } from '../utils/errorHandler';
import { validateAddress } from '../utils/validation';

const communityService = new CommunityService();
const tierService = new TierService();

export async function communityRoutes(fastify: FastifyInstance) {
  /**
   * GET /community/stats
   * Get public community statistics
   */
  fastify.get<{
    Reply: ApiResponse<{ totalMembers: number; isConfigured: boolean }>;
  }>('/community/stats', async () => {
    const stats = await communityService.getStats();
    return { success: true, data: stats };
  });

  /**
   * GET /community/config
   * Get contract configuration (for debugging/display)
   */
  fastify.get<{
    Reply: ApiResponse<{ packageId: string; registryId: string; isConfigured: boolean }>;
  }>('/community/config', async () => {
    const config = communityService.getConfig();
    return { success: true, data: config };
  });

  /**
   * GET /community/membership
   * Check if current active address is a member
   */
  fastify.get<{
    Reply: ApiResponse<{ isMember: boolean }>;
  }>('/community/membership', async () => {
    const isMember = await communityService.checkMembership();
    return { success: true, data: { isMember } };
  });

  /**
   * GET /community/eligibility/:address
   * Check if an address is eligible to join the community
   */
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<{
      eligible: boolean;
      reasons: string[];
      txCount: number;
      balance: number;
      requirements: { minTxCount: number; minBalance: number };
    }>;
  }>('/community/eligibility/:address', async (request, reply) => {
    try {
      const address = validateAddress(request.params.address);
      const eligibility = await communityService.checkEligibility(address);
      return { success: true, data: eligibility };
    } catch (error) {
      console.error('[ERROR]', error);
      reply.status(400);
      return { success: false, error: sanitizeErrorMessage(error) };
    }
  });

  /**
   * POST /community/join
   * User opts in to join the community
   * User pays gas (~0.001 SUI)
   */
  fastify.post<{
    Reply: ApiResponse<{ txDigest?: string; alreadyMember?: boolean }>;
  }>('/community/join', async (_request, reply) => {
    try {
      const result = await communityService.joinCommunity();

      if (!result.success) {
        // Already member is not really an error
        if (result.alreadyMember) {
          return {
            success: true,
            data: { alreadyMember: true },
          };
        }

        reply.status(400);
        return { success: false, error: sanitizeErrorMessage(result.error) };
      }

      return {
        success: true,
        data: { txDigest: result.txDigest },
      };
    } catch (error) {
      console.error('[ERROR]', error);
      reply.status(500);
      return { success: false, error: sanitizeErrorMessage(error) };
    }
  });

  // ====== TIER ENDPOINTS ======

  /**
   * GET /community/tier/:address
   * Get tier info for a specific address
   */
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<TierInfo>;
  }>('/community/tier/:address', async (request, reply) => {
    try {
      const address = validateAddress(request.params.address);
      const tierInfo = await tierService.getTierInfo(address);
      return { success: true, data: tierInfo };
    } catch (error) {
      console.error('[ERROR]', error);
      reply.status(400);
      return { success: false, error: sanitizeErrorMessage(error) };
    }
  });

  /**
   * GET /community/tier-metadata
   * Get all tier metadata (for display purposes)
   */
  fastify.get<{
    Reply: ApiResponse<typeof TIER_METADATA>;
  }>('/community/tier-metadata', async () => {
    return { success: true, data: tierService.getAllTierMetadata() };
  });

  /**
   * GET /community/tier-requirements
   * Get tier requirements (for progress display)
   */
  fastify.get<{
    Reply: ApiResponse<{ WAVE_MIN_TX: number; TSUNAMI_MIN_TX: number }>;
  }>('/community/tier-requirements', async () => {
    return { success: true, data: tierService.getTierRequirements() };
  });

  /**
   * POST /community/tier/refresh/:address
   * Force refresh tier cache for an address
   */
  fastify.post<{
    Params: { address: string };
    Reply: ApiResponse<TierInfo>;
  }>('/community/tier/refresh/:address', async (request, reply) => {
    try {
      const address = validateAddress(request.params.address);
      tierService.clearCache(address);
      const tierInfo = await tierService.getTierInfo(address);
      return { success: true, data: tierInfo };
    } catch (error) {
      console.error('[ERROR]', error);
      reply.status(400);
      return { success: false, error: sanitizeErrorMessage(error) };
    }
  });

  /**
   * GET /community/packages/:address
   * Get deployed packages for a specific address
   */
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<Array<{
      id: string;
      package: string;
      version: string;
      digest: string;
    }>>;
  }>('/community/packages/:address', async (request, reply) => {
    try {
      const address = validateAddress(request.params.address);
      const packages = await tierService.getDeployedPackages(address);
      return { success: true, data: packages };
    } catch (error) {
      console.error('[ERROR]', error);
      reply.status(400);
      return { success: false, error: sanitizeErrorMessage(error) };
    }
  });
}
