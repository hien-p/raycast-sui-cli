import { useState, useEffect } from 'react';
import { suiService, CommunityStats } from '@/services/SuiService';
import { Spinner } from '../shared/Spinner';
import { NETWORK } from '@/config/contracts';

interface TierInfo {
  name: string;
  icon: string;
  level: number;
  txCount: number;
  contractCount: number;
}

// Calculate tier based on tx count and contract count
function calculateTier(txCount: number, contractCount: number): TierInfo {
  // Tier thresholds
  if (txCount >= 500 || contractCount >= 20) {
    return { name: 'Legend', icon: '🏆', level: 3, txCount, contractCount };
  }
  if (txCount >= 100 || contractCount >= 10) {
    return { name: 'Builder', icon: '🔨', level: 2, txCount, contractCount };
  }
  if (txCount >= 25 || contractCount >= 3) {
    return { name: 'Explorer', icon: '🧭', level: 1, txCount, contractCount };
  }
  return { name: 'Newcomer', icon: '🌱', level: 0, txCount, contractCount };
}

export function MembershipLookup() {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch community stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await suiService.getCommunityStats();
        setCommunityStats(stats);
      } catch (err) {
        console.error('Failed to fetch community stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleLookup = async () => {
    if (!address.trim()) {
      setError('Please enter a Sui address');
      return;
    }

    // Validate address format (0x followed by 64 hex chars)
    const addressRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!addressRegex.test(address.trim())) {
      setError('Invalid Sui address format. Must be 0x followed by 64 hex characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsMember(null);
    setTierInfo(null);

    try {
      const memberStatus = await suiService.checkMembership(address.trim());
      setIsMember(memberStatus);

      if (memberStatus) {
        // For now, show basic tier - in future can query on-chain activity
        // This would require additional RPC calls to count transactions
        setTierInfo(calculateTier(0, 0)); // Default newcomer
      }
    } catch (err) {
      setError('Failed to check membership. Please try again.');
      console.error('Lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLookup();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Terminal-style card */}
        <div className="bg-[#121218]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06] bg-[#15151b]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎖️</span>
                <span className="text-sm font-medium">Membership Lookup</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-[#4da2ff]/20 text-[#4da2ff] rounded">
                {NETWORK}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Stats */}
            {communityStats && (
              <div className="text-center pb-4 border-b border-white/10">
                <div className="text-3xl font-bold bg-gradient-to-r from-white to-[#4da2ff] bg-clip-text text-transparent">
                  {communityStats.totalMembers.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Community Members</div>
              </div>
            )}

            {/* Address Input */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Sui Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0x..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#4da2ff]/50 focus:border-[#4da2ff]/50 transition-all"
                />
                <button
                  onClick={handleLookup}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-[#4da2ff] hover:bg-[#5cb0ff] disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isLoading ? <Spinner size="sm" /> : 'Check'}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </div>

            {/* Result */}
            {isMember !== null && (
              <div className={`p-4 rounded-lg border ${
                isMember
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-white/5 border-white/10'
              }`}>
                {isMember ? (
                  <div className="text-center space-y-3">
                    <div className="text-4xl">{tierInfo?.icon || '🎖️'}</div>
                    <div>
                      <h3 className="text-lg font-bold text-green-400">Member Found!</h3>
                      <p className="text-sm text-muted-foreground">
                        This address is a community member
                      </p>
                    </div>
                    {tierInfo && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-sm">
                          Tier: <span className="font-medium text-white">{tierInfo.name}</span>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="text-4xl">👋</div>
                    <div>
                      <h3 className="text-lg font-medium">Not a Member Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        This address hasn't joined the community
                      </p>
                    </div>
                    <a
                      href="/setup"
                      className="inline-block mt-2 px-4 py-2 bg-[#4da2ff] hover:bg-[#5cb0ff] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Learn How to Join
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>Query membership status directly from Sui blockchain</p>
              <p>No server required • Real-time on-chain data</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#15151b]">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Direct blockchain query</span>
              <a
                href="/"
                className="hover:text-[#4da2ff] transition-colors"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembershipLookup;
