/**
 * Membership Check Middleware
 * Protects premium endpoints for community members only
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { CommunityService } from '../services/CommunityService';
import { AddressService } from '../services/AddressService';
import type { ApiResponse } from '@sui-cli-web/shared';

const communityService = new CommunityService();
const addressService = new AddressService();

export interface MembershipCheckOptions {
  featureName: string;
  requiredTier?: number; // Optional: specific tier requirement
}

/**
 * Middleware to check if user is a community member
 * Returns 403 with detailed message if not a member
 */
export async function requireMembership(
  request: FastifyRequest,
  reply: FastifyReply,
  options: MembershipCheckOptions = { featureName: 'This feature' }
) {
  try {
    // Get current active address
    const activeAddress = await addressService.getActiveAddress();

    if (!activeAddress) {
      reply.status(403);
      return {
        success: false,
        error: 'MEMBERSHIP_REQUIRED',
        message: `🔒 ${options.featureName} is a Member-Only Feature`,
        details: {
          reason: 'No active address found',
          action: 'Please set an active address first',
          membershipUrl: '/app/membership',
        },
      } as ApiResponse<never>;
    }

    // Check membership status
    const isMember = await communityService.checkMembership(activeAddress);

    if (!isMember) {
      reply.status(403);
      return {
        success: false,
        error: 'MEMBERSHIP_REQUIRED',
        message: `🔒 ${options.featureName} is a Member-Only Feature`,
        details: {
          reason: 'You are not a community member',
          benefits: [
            'Advanced Transaction Inspector with visual execution flow',
            'Priority support and exclusive developer resources',
            'Early access to new features',
            'Community badge and recognition',
          ],
          action: 'Become a member to unlock this feature',
          membershipUrl: '/app/membership',
          currentAddress: activeAddress,
        },
      } as ApiResponse<never>;
    }

    // Optional: Check tier requirement (currently not implemented)
    // TODO: Implement tier-based access control
    // if (options.requiredTier && options.requiredTier > 0) {
    //   // Tier checking not yet implemented
    // }

    // User is a member (and meets tier requirement if specified)
    // Continue to the route handler
    return;
  } catch (error) {
    console.error('[MembershipCheck] Membership check failed:', error);
    // On error, deny access to be safe
    reply.status(500);
    return {
      success: false,
      error: 'MEMBERSHIP_CHECK_FAILED',
      message: 'Failed to verify membership status',
      details: {
        reason: String(error),
        action: 'Please try again',
      },
    } as ApiResponse<never>;
  }
}

/**
 * Fastify hook wrapper for membership check
 * Usage: fastify.addHook('preHandler', membershipHook({ featureName: 'Inspector' }))
 */
export function membershipHook(options: MembershipCheckOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await requireMembership(request, reply, options);
    // If result is returned, it means access denied - send the response
    if (result) {
      return reply.send(result);
    }
    // Otherwise, continue to route handler
  };
}
