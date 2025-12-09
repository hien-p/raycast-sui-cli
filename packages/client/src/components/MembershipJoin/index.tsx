import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import { TierBadge, TierProgress } from '../TierBadge';
import * as api from '@/api/client';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { trackEligibilityCheck } from '@/lib/analytics';

interface MembershipJoinProps {
  onClose?: () => void;
  compact?: boolean;
}

export function MembershipJoin({ onClose, compact = false }: MembershipJoinProps) {
  const {
    communityStats: stats,
    isCommunityMember: isMember,
    tierInfo,
    addresses,
    fetchCommunityStatus,
    fetchTierInfo,
    joinCommunity,
  } = useAppStore();

  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState<api.EligibilityInfo | null>(null);
  const [joinResult, setJoinResult] = useState<{
    success: boolean;
    txDigest?: string;
    error?: string;
  } | null>(null);

  const activeAddress = addresses.find((a) => a.isActive);

  useEffect(() => {
    // Fetch community data in parallel
    Promise.all([
      fetchCommunityStatus(),
      fetchTierInfo(),
    ]);

    // Check eligibility if not a member
    if (!isMember && activeAddress) {
      checkEligibility();
    }
  }, [fetchCommunityStatus, fetchTierInfo, isMember, activeAddress?.address]);

  const checkEligibility = async () => {
    if (!activeAddress) return;

    setIsCheckingEligibility(true);
    try {
      const result = await api.checkEligibility(activeAddress.address);
      setEligibility(result);
      // Track eligibility check
      trackEligibilityCheck(result.eligible, result.txCount, result.balance);
    } catch (error) {
      console.error('Failed to check eligibility:', error);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleJoin = async () => {
    setIsJoining(true);
    setJoinResult(null);
    try {
      const result = await joinCommunity();

      if (result.success) {
        setJoinResult({ success: true, txDigest: result.txDigest });
        if (result.txDigest) {
          showSuccessToast({
            message: 'Welcome to the community!',
            details: 'You\'ve received your Droplet 💧 tier badge. Keep building to level up!',
            icon: '🎉'
          });
          // Refresh community stats after successful join
          setTimeout(() => {
            Promise.all([
              fetchCommunityStatus(),
              fetchTierInfo(),
            ]);
          }, 1500);
        } else {
          showSuccessToast({
            message: 'You are already a community member!',
            details: 'Your membership is active and your tier is synced.',
            icon: '✅'
          });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Provide user-friendly error messages with action hints
      let friendlyMsg = errorMsg;
      let actionHint = '';

      if (errorMsg.includes('Cannot connect') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch')) {
        friendlyMsg = 'Server not running';
        actionHint = 'Start the local server first: npx sui-cli-web-server';
      } else if (errorMsg.includes('already a community member') || errorMsg.includes('alreadyMember')) {
        friendlyMsg = 'You are already a member!';
        actionHint = 'Try switching to a different wallet address to join with that one.';
        // Refresh to update UI
        fetchCommunityStatus();
      } else if (errorMsg.includes('Insufficient') || errorMsg.includes('gas') || errorMsg.includes('No SUI tokens')) {
        friendlyMsg = 'Not enough SUI tokens';
        actionHint = 'Go to Faucet → Request testnet SUI → Try joining again';
      } else if (errorMsg.includes('Requirements not met') || errorMsg.includes('Need at least')) {
        friendlyMsg = 'Requirements not met';
        if (errorMsg.includes('10 SUI')) {
          actionHint = 'Get testnet SUI from Faucet first, then try again';
        } else if (errorMsg.includes('transactions')) {
          actionHint = 'Make some test transactions first (transfer, split/merge coins, etc.)';
        } else {
          actionHint = 'Check the requirements above and complete them before joining';
        }
      } else if (errorMsg.includes('paused')) {
        friendlyMsg = 'Registration paused';
        actionHint = 'Community registration is temporarily unavailable. Please try again later.';
      } else if (errorMsg.includes('Bad Request') || errorMsg.includes('400')) {
        friendlyMsg = 'Request failed';
        actionHint = 'Make sure you have SUI tokens and meet all requirements';
      } else if (errorMsg.includes('Network') || errorMsg.includes('connection')) {
        friendlyMsg = 'Network error';
        actionHint = 'Check your internet connection and try again';
      }

      const fullMessage = actionHint ? `${friendlyMsg}. ${actionHint}` : friendlyMsg;
      setJoinResult({ success: false, error: fullMessage });

      // Show beautiful error toast
      showErrorToast({
        message: friendlyMsg,
        hint: actionHint,
        icon: '❌'
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Compact version for Landing Page
  if (compact) {
    return (
      <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span>🎖️</span>
              Membership
            </div>
            <div className="text-xs text-white/60 mt-0.5">
              {stats.totalMembers.toLocaleString()} members · Tier system · Achievements
            </div>
          </div>
          {isMember && tierInfo && (
            <TierBadge tier={tierInfo.level} size="sm" />
          )}
          {isMember && !tierInfo && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg">
              Member
            </span>
          )}
        </div>

        {/* For Non-Members */}
        {!isMember && (
          <>
            {/* Benefits */}
            <div className="text-xs text-white/70 space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-[10px] mt-0.5">✓</span>
                <span>Earn tiers: Droplet → Wave → Tsunami → Ocean</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] mt-0.5">✓</span>
                <span>Track your on-chain activity & achievements</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] mt-0.5">✓</span>
                <span>Unique NFT card (coming soon)</span>
              </div>
            </div>

            {/* Requirements Box */}
            <div className={clsx(
              'p-2 rounded text-xs border',
              eligibility
                ? (eligibility.eligible
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400')
                : 'bg-white/5 border-white/10 text-white/70'
            )}>
              <div className="font-medium mb-1">
                {isCheckingEligibility ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Checking requirements...
                  </span>
                ) : eligibility?.eligible ? (
                  '✅ Ready to join!'
                ) : (
                  '📋 Requirements:'
                )}
              </div>
              {!eligibility?.eligible && !isCheckingEligibility && (
                <ul className="space-y-0.5 ml-4">
                  <li className="flex items-center gap-1">
                    <span>{eligibility && eligibility.txCount >= 10 ? '✅' : '⚠️'}</span>
                    <span>
                      10+ transactions
                      {eligibility && ` (you: ${eligibility.txCount})`}
                    </span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span>{eligibility && eligibility.balance >= 10 ? '✅' : '⚠️'}</span>
                    <span>
                      10+ SUI
                      {eligibility && ` (you: ${eligibility.balance.toFixed(2)})`}
                    </span>
                  </li>
                </ul>
              )}
            </div>

            {/* Join Button */}
            {stats.isConfigured && (
              <button
                onClick={handleJoin}
                disabled={isJoining || isCheckingEligibility || (eligibility ? !eligibility.eligible : false)}
                className={clsx(
                  'w-full py-2 text-sm font-medium rounded-lg transition-all',
                  eligibility?.eligible
                    ? 'bg-[#4da2ff] hover:bg-[#5cb0ff] text-white'
                    : 'bg-white/10 text-white/50 cursor-not-allowed',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title={eligibility && !eligibility.eligible ? 'Requirements not met' : 'Join the community'}
              >
                {isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Joining...
                  </span>
                ) : isCheckingEligibility ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Checking...
                  </span>
                ) : eligibility?.eligible ? (
                  'Join Now (Free)'
                ) : (
                  'Requirements Not Met'
                )}
              </button>
            )}

            {/* Enhanced Error message */}
            {joinResult && !joinResult.success && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs animate-slide-up">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-base flex-shrink-0">❌</span>
                  <div className="flex-1">
                    <div className="text-red-400 font-semibold mb-1">
                      Unable to Join
                    </div>
                    <div className="text-red-300/90 leading-relaxed">
                      {joinResult.error}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* For Members */}
        {isMember && tierInfo && tierInfo.progress.nextTier && (
          <div>
            <TierProgress tierInfo={tierInfo} showDetails={false} />
          </div>
        )}
      </div>
    );
  }

  // Full modal version
  return (
    <div className="p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4da2ff]/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#4da2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Become a Member</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Earn tiers, track achievements, and showcase your on-chain activity
        </p>
      </div>

      {/* Stats & Tier */}
      <div className="p-4 bg-muted/30 rounded-lg mb-6">
        <div className="text-center mb-3">
          <div className="text-3xl font-bold text-primary">
            {stats.totalMembers.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">members</div>
        </div>

        {/* Show tier info for members */}
        {isMember && tierInfo && (
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Your Tier</span>
              <TierBadge tier={tierInfo.level} size="md" />
            </div>
            <TierProgress tierInfo={tierInfo} />
          </div>
        )}
      </div>

      {/* Benefits for members / non-members */}
      {isMember && tierInfo ? (
        <div className="space-y-3 mb-6">
          {/* Current Benefits */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
              <span>✅</span> What You Have
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6">
              <li>• Full access to all features</li>
              <li>• {tierInfo.name} badge on your profile</li>
              {tierInfo.level >= 1 && <li>• Priority in leaderboard</li>}
              {tierInfo.level >= 2 && <li>• Governance voting rights</li>}
              {tierInfo.level >= 3 && <li>• Ambassador status</li>}
            </ul>
          </div>

          {/* What's Next */}
          {tierInfo.progress.nextTier && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <span>🎯</span> Unlock Next: {tierInfo.progress.nextTier}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Keep building to unlock:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                {tierInfo.level === 0 && (
                  <>
                    <li>• Animated badge with glow effect</li>
                    <li>• NFT Card unlock (basic design)</li>
                    <li>• Priority in community leaderboard</li>
                  </>
                )}
                {tierInfo.level === 1 && (
                  <>
                    <li>• Custom card colors & effects</li>
                    <li>• Governance voting rights</li>
                    <li>• Featured in Top Builders section</li>
                  </>
                )}
                {tierInfo.level === 2 && (
                  <>
                    <li>• Full NFT card customization</li>
                    <li>• Ambassador status</li>
                    <li>• Revenue sharing opportunities</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* NFT Card Coming Soon */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
              <span>🎴</span> Coming Soon: NFT Cards
            </h4>
            <p className="text-xs text-muted-foreground">
              Claim your unique member card NFT! Each card evolves with your tier
              and showcases your journey in the Sui ecosystem.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {/* What You'll Get */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">💧</span>
              <div>
                <h4 className="text-sm font-semibold text-blue-400">Instant Access</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Full access to all features. No restrictions, no paywalls.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <h4 className="text-sm font-semibold text-teal-400">Level Up System</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Earn tiers as you build: Wave (25 tx) → Tsunami (100 tx) → Ocean
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">🎴</span>
              <div>
                <h4 className="text-sm font-semibold text-purple-400">NFT Card (Soon)</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique member card NFT that evolves with your tier
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="text-xs text-muted-foreground/60 text-center p-2 bg-muted/10 rounded">
            Privacy-first: We only record your address (public) and join time.
            No tracking of activities or balances.
          </div>
        </div>
      )}

      {/* Requirements Display - Always show for non-members */}
      {!isMember && (
        <div className="mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>📋</span>
              Requirements to Join
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className={clsx(
                  'mt-0.5',
                  eligibility && eligibility.txCount >= 10 ? 'text-green-400' : 'text-yellow-400'
                )}>
                  {eligibility && eligibility.txCount >= 10 ? '✅' : '⚠️'}
                </span>
                <div>
                  <span className="font-medium">At least 10 transactions</span>
                  {eligibility && (
                    <span className="text-muted-foreground ml-1">
                      (you have {eligibility.txCount})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className={clsx(
                  'mt-0.5',
                  eligibility && eligibility.balance >= 10 ? 'text-green-400' : 'text-yellow-400'
                )}>
                  {eligibility && eligibility.balance >= 10 ? '✅' : '⚠️'}
                </span>
                <div>
                  <span className="font-medium">At least 10 SUI balance</span>
                  {eligibility && (
                    <span className="text-muted-foreground ml-1">
                      (you have {eligibility.balance.toFixed(2)} SUI)
                    </span>
                  )}
                </div>
              </div>
            </div>
            {eligibility && !eligibility.eligible && (
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-muted-foreground">
                💡 Tip: Use the Faucet to get testnet SUI, then make some transactions to meet the requirements.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gas info - only for eligible non-members */}
      {!isMember && eligibility?.eligible && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mb-6">
          <div className="flex items-start gap-2">
            <span className="text-warning">&#9888;</span>
            <div className="text-xs text-warning">
              <span className="font-medium">Gas Required:</span> ~0.001 SUI
              <br />
              A small transaction fee will be deducted from your balance.
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Join Result with Better Error Display */}
      {joinResult && (
        <div
          className={clsx(
            'p-4 rounded-lg mb-4 animate-slide-up border',
            joinResult.success
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          )}
        >
          {joinResult.success ? (
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div className="flex-1">
                <div className="text-green-400 font-semibold mb-1">
                  Welcome to the Community!
                </div>
                <div className="text-green-300/80 text-sm mb-2">
                  You're now a member and have received your Droplet 💧 tier badge!
                </div>
                {joinResult.txDigest && (
                  <div className="text-xs font-mono text-green-400/60 bg-green-500/5 rounded px-2 py-1 inline-block">
                    TX: {joinResult.txDigest.slice(0, 20)}...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">❌</span>
              <div className="flex-1">
                <div className="text-red-400 font-semibold mb-2">
                  Unable to Join Community
                </div>
                <div className="text-red-300/90 text-sm leading-relaxed mb-3">
                  {joinResult.error}
                </div>

                {/* Actionable Suggestions based on error */}
                {(joinResult.error?.includes('10 SUI') || joinResult.error?.includes('Not enough')) && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
                    <div className="text-yellow-400 text-xs font-medium mb-1 flex items-center gap-1">
                      💡 Quick Fix
                    </div>
                    <div className="text-yellow-300/80 text-xs">
                      Go to <span className="font-semibold">Faucet</span> → Request testnet SUI → Try joining again
                    </div>
                  </div>
                )}

                {(joinResult.error?.includes('10 transactions') || joinResult.error?.includes('0)')) && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
                    <div className="text-blue-400 text-xs font-medium mb-1 flex items-center gap-1">
                      💡 Quick Fix
                    </div>
                    <div className="text-blue-300/80 text-xs">
                      Make some test transactions first (transfer SUI between addresses, split/merge coins, etc.)
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            Maybe Later
          </button>
        )}

        {isMember ? (
          <div className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-500 text-center">
            &#10003; You're a Member
          </div>
        ) : !stats.isConfigured ? (
          <div className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground text-center">
            Coming Soon
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={isJoining || isCheckingEligibility || (eligibility ? !eligibility.eligible : false)}
            className={clsx(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
              'flex items-center justify-center gap-2',
              isJoining || isCheckingEligibility || (eligibility && !eligibility.eligible)
                ? 'bg-primary/50 cursor-not-allowed text-primary-foreground/70'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            )}
          >
            {isJoining ? (
              <>
                <Spinner size="sm" />
                Joining...
              </>
            ) : isCheckingEligibility ? (
              <>
                <Spinner size="sm" />
                Checking...
              </>
            ) : eligibility && !eligibility.eligible ? (
              'Requirements Not Met'
            ) : (
              'Become a Member'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
