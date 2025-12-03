/**
 * Google Analytics setup for tracking user behavior
 * - Page views (landing page, join community, etc.)
 * - Community joins
 * - User interactions (button clicks, form submissions)
 */

/**
 * Get the appropriate Google Analytics ID based on the domain
 */
function getGAId(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Map domains to their GA IDs
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
 * Track page view
 */
export function trackPageView(pageName: string) {
  if ((window as any).gtag) {
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
  if ((window as any).gtag) {
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
  if ((window as any).gtag) {
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
  if ((window as any).gtag) {
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
  if ((window as any).gtag) {
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
  if ((window as any).gtag) {
    (window as any).gtag('event', 'eligibility_check', {
      event_category: 'community',
      eligible: eligible ? 'yes' : 'no',
      tx_count: txCount,
      balance_range: balance < 10 ? 'low' : balance < 50 ? 'medium' : 'high',
    });
  }
}
