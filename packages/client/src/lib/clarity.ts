/**
 * Microsoft Clarity Analytics Integration
 *
 * Provides heatmaps, session recordings, and user behavior analytics.
 * Only active in production environment.
 *
 * @see https://clarity.microsoft.com
 */

import Clarity from '@microsoft/clarity';

// Clarity Project ID
const CLARITY_PROJECT_ID = 'uilx4655e6';

// Check if we're in production
const isProduction = import.meta.env.PROD;

// Track initialization state
let isInitialized = false;

/**
 * Initialize Microsoft Clarity
 * Only runs in production to avoid polluting analytics with dev data
 */
export function initClarity(): void {
  if (!isProduction) {
    console.log('[Clarity] Skipped - not in production');
    return;
  }

  if (isInitialized) {
    console.log('[Clarity] Already initialized');
    return;
  }

  try {
    Clarity.init(CLARITY_PROJECT_ID);
    isInitialized = true;
    console.log('[Clarity] Initialized successfully');
  } catch (error) {
    console.error('[Clarity] Failed to initialize:', error);
  }
}

/**
 * Identify user with wallet address
 * Helps track user sessions across visits
 */
export function identifyUser(address: string, customData?: Record<string, string>): void {
  if (!isProduction || !isInitialized) return;

  try {
    // Use short address as identifier (privacy-friendly)
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    Clarity.identify(address, undefined, undefined, shortAddress);

    // Set custom session data if provided
    if (customData) {
      Object.entries(customData).forEach(([key, value]) => {
        Clarity.setTag(key, value);
      });
    }
  } catch (error) {
    console.error('[Clarity] Failed to identify user:', error);
  }
}

/**
 * Track custom event
 * Use for important user actions
 */
export function trackEvent(eventName: string): void {
  if (!isProduction || !isInitialized) return;

  try {
    Clarity.event(eventName);
  } catch (error) {
    console.error('[Clarity] Failed to track event:', error);
  }
}

/**
 * Set custom tag for session
 * Useful for segmentation
 */
export function setTag(key: string, value: string): void {
  if (!isProduction || !isInitialized) return;

  try {
    Clarity.setTag(key, value);
  } catch (error) {
    console.error('[Clarity] Failed to set tag:', error);
  }
}

/**
 * Upgrade session priority
 * Use when user performs important action to ensure session is recorded
 */
export function upgradeSession(reason: string): void {
  if (!isProduction || !isInitialized) return;

  try {
    Clarity.upgrade(reason);
  } catch (error) {
    console.error('[Clarity] Failed to upgrade session:', error);
  }
}

// Pre-defined events for consistent tracking
export const ClarityEvents = {
  // Connection
  SERVER_CONNECTED: 'server_connected',
  SERVER_DISCONNECTED: 'server_disconnected',

  // Wallet
  ADDRESS_SWITCHED: 'address_switched',
  ADDRESS_CREATED: 'address_created',

  // Network
  ENVIRONMENT_SWITCHED: 'environment_switched',

  // Transactions
  FAUCET_REQUESTED: 'faucet_requested',
  TRANSFER_COMPLETED: 'transfer_completed',
  TRANSFER_FAILED: 'transfer_failed',

  // Development
  PACKAGE_BUILT: 'package_built',
  PACKAGE_PUBLISHED: 'package_published',
  FUNCTION_CALLED: 'function_called',

  // Inspector
  TRANSACTION_INSPECTED: 'transaction_inspected',
  TRANSACTION_REPLAYED: 'transaction_replayed',

  // Community
  COMMUNITY_JOINED: 'community_joined',
} as const;

export type ClarityEventName = typeof ClarityEvents[keyof typeof ClarityEvents];
