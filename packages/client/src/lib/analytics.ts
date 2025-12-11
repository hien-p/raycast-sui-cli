/**
 * Google Analytics setup for tracking user behavior
 * - Page views (landing page, join community, etc.)
 * - Community joins
 * - User interactions (button clicks, form submissions)
 *
 * Analytics can be controlled via:
 * 1. VITE_GA_ID environment variable
 * 2. enable_analytics_tracking feature flag in Statsig
 */

import { checkGate, FeatureGates } from './statsig';

// Track if analytics was disabled by feature flag
let analyticsDisabledByFlag = false;

/**
 * Get the appropriate Google Analytics ID
 * Priority: env var > domain-based lookup > fallback
 */
function getGAId(): string {
  // First check environment variable
  const envGaId = import.meta.env.VITE_GA_ID;
  if (envGaId) return envGaId;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Map domains to their GA IDs (fallback if env var not set)
  const gaIds: Record<string, string> = {
    'harriweb3.dev': 'G-Z37RHCYYX6',
    'raycast-sui-cli.vercel.app': 'G-CQXKRXBW5J',
    'localhost': 'G-Z37RHCYYX6', // Use harriweb3 GA for local development
  };

  // Find matching GA ID
  for (const [domain, id] of Object.entries(gaIds)) {
    if (hostname.includes(domain)) {
      return id;
    }
  }

  // Fallback to harriweb3 GA ID
  return 'G-Z37RHCYYX6';
}

/**
 * Check if analytics should be enabled
 * Respects both env config and feature flag
 */
function shouldEnableAnalytics(): boolean {
  // Check feature flag (if Statsig is initialized)
  // Note: This is called early, so Statsig might not be ready
  // We'll recheck on each tracking call
  return true; // Default to enabled, will check flag on each call
}

/**
 * Initialize Google Analytics
 * Call this once in app initialization
 */
export function initializeAnalytics() {
  const GA_ID = getGAId();

  // Create script element
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(arguments);
  }
  (window as any).gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID, {
    page_path: window.location.pathname,
    page_title: document.title,
  });
}

/**
 * Check if tracking is allowed (respects feature flag)
 */
function isTrackingAllowed(): boolean {
  // Check the feature flag - if flag is enabled, tracking is allowed
  // If Statsig isn't initialized yet, default to allowing tracking
  try {
    return checkGate(FeatureGates.ENABLE_ANALYTICS_TRACKING);
  } catch {
    // Statsig not ready, allow tracking by default
    return true;
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string) {
  if ((window as any).gtag && isTrackingAllowed()) {
    (window as any).gtag('event', 'page_view', {
      page_title: pageName,
      page_path: window.location.pathname,
    });
  }
}

/**
 * Track community join event
 */
export function trackCommunityJoin(address: string, success: boolean) {
  if ((window as any).gtag && isTrackingAllowed()) {
    (window as any).gtag('event', 'community_join', {
      event_category: 'community',
      event_label: success ? 'success' : 'failed',
      address_prefix: address.slice(0, 6), // Don't track full address for privacy
    });
  }
}

/**
 * Track button click
 */
export function trackButtonClick(buttonName: string, section?: string) {
  if ((window as any).gtag && isTrackingAllowed()) {
    (window as any).gtag('event', 'button_click', {
      event_category: 'engagement',
      event_label: buttonName,
      section: section || 'unknown',
    });
  }
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, action: string) {
  if ((window as any).gtag && isTrackingAllowed()) {
    (window as any).gtag('event', featureName, {
      event_category: 'feature',
      event_action: action,
    });
  }
}

/**
 * Track error
 */
export function trackError(errorName: string, errorMessage: string) {
  if ((window as any).gtag && isTrackingAllowed()) {
    (window as any).gtag('event', 'exception', {
      description: `${errorName}: ${errorMessage.slice(0, 100)}`,
      fatal: false,
    });
  }
}

/**
 * Track eligibility check
 */
export function trackEligibilityCheck(eligible: boolean, txCount: number, balance: number) {
  if ((window as any).gtag && isTrackingAllowed()) {
    (window as any).gtag('event', 'eligibility_check', {
      event_category: 'community',
      eligible: eligible ? 'yes' : 'no',
      tx_count: txCount,
      balance_range: balance < 10 ? 'low' : balance < 50 ? 'medium' : 'high',
    });
  }
}
