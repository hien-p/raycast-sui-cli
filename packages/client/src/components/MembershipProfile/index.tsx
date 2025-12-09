import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Spinner } from '../shared/Spinner';
import toast from 'react-hot-toast';
import * as api from '@/api/client';

export function MembershipProfile() {
  const {
    communityStats,
    isCommunityMember,
    tierInfo,
    addresses,
    environments,
    fetchCommunityStatus,
    fetchTierInfo,
    joinCommunity,
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [packages, setPackages] = useState<api.DeployedPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  const activeAddress = addresses.find((a) => a.isActive)?.address;

  useEffect(() => {
    // Fetch community data in parallel
    Promise.all([
      fetchCommunityStatus(),
      fetchTierInfo(),
    ]);
    if (activeAddress) {
      fetchDeployedPackages();
    }
  }, [fetchCommunityStatus, fetchTierInfo, activeAddress]);

  const fetchDeployedPackages = async () => {
    if (!activeAddress) return;

    setIsLoadingPackages(true);
    try {
      const pkgs = await api.getDeployedPackages(activeAddress);
      setPackages(pkgs);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      setPackages([]);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchCommunityStatus(),
        fetchTierInfo(),
        fetchDeployedPackages()
      ]);
      toast.success('Refreshed!');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Detect network from active environment
  const getActiveNetwork = (): string => {
    const activeEnv = environments.find((e) => e.isActive);
    if (!activeEnv) return 'testnet'; // Default fallback

    const alias = activeEnv.alias.toLowerCase();

    // Match common network aliases
    if (alias.includes('mainnet') || alias.includes('main')) return 'mainnet';
    if (alias.includes('testnet') || alias.includes('test')) return 'testnet';
    if (alias.includes('devnet') || alias.includes('dev')) return 'devnet';
    if (alias.includes('localnet') || alias.includes('local')) return 'localnet';

    // Try to detect from RPC URL
    if (activeEnv.rpc.includes('mainnet')) return 'mainnet';
    if (activeEnv.rpc.includes('testnet')) return 'testnet';
    if (activeEnv.rpc.includes('devnet')) return 'devnet';
    if (activeEnv.rpc.includes('localhost') || activeEnv.rpc.includes('127.0.0.1')) return 'localnet';

    return 'testnet'; // Default fallback
  };

  // Get Sui Explorer URL based on network
  const getExplorerUrl = (packageId: string, type: 'object' | 'account' = 'object') => {
    const network = getActiveNetwork();
    const baseUrls: Record<string, string> = {
      mainnet: 'https://suiscan.xyz/mainnet',
      testnet: 'https://suiscan.xyz/testnet',
      devnet: 'https://suiscan.xyz/devnet',
      localnet: 'https://suiscan.xyz/testnet', // Fallback for localnet
    };
    return `${baseUrls[network] || baseUrls.testnet}/${type}/${packageId}`;
  };

  // Shorten package ID for display
  const shortenPackageId = (id: string) => {
    if (id.length <= 16) return id;
    return `${id.slice(0, 8)}...${id.slice(-6)}`;
  };

  // Not a member
  if (!isCommunityMember) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🎖️</div>
          <h2 className="text-2xl font-bold mb-2">Become a Member</h2>
          <p className="text-muted-foreground mb-6">
            {communityStats.totalMembers.toLocaleString()} members already joined
          </p>
          <button
            onClick={joinCommunity}
            className="px-6 py-2.5 bg-[#4da2ff] hover:bg-[#5cb0ff] text-white rounded-lg font-medium transition-colors"
          >
            Join Now (Free)
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (!tierInfo) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // List-style dashboard
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* Header - Compact */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-scale-in" style={{ animationDelay: '0.1s' }}>{tierInfo.icon}</span>
            <div className="animate-slide-up" style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}>
              <h1 className="text-xl font-bold">{tierInfo.name}</h1>
              <p className="text-xs text-muted-foreground">
                {communityStats.totalMembers} members · Rank: Top {tierInfo.level === 0 ? '100' : tierInfo.level === 1 ? '20' : tierInfo.level === 2 ? '5' : '1'}%
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xl hover:opacity-70 hover:scale-110 transition-all disabled:opacity-50 animate-scale-in"
            style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
          >
            {isRefreshing ? <Spinner size="sm" /> : '🔄'}
          </button>
        </div>

        {/* Stats Row - Inline */}
        <div className="flex gap-4 text-sm">
          <div className="flex-1 bg-white/5 hover:bg-white/[0.07] rounded-lg p-3 transition-all hover:scale-105 animate-slide-up" style={{ animationDelay: '0.25s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="text-muted-foreground mb-1">Transactions</div>
            <div className="text-2xl font-mono font-bold bg-gradient-to-r from-white to-[#4da2ff] bg-clip-text text-transparent">{tierInfo.txCount}</div>
          </div>
          <div className="flex-1 bg-white/5 hover:bg-white/[0.07] rounded-lg p-3 transition-all hover:scale-105 animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="text-muted-foreground mb-1">Contracts Deployed</div>
            <div className="text-2xl font-mono font-bold bg-gradient-to-r from-white to-[#4da2ff] bg-clip-text text-transparent">
              {tierInfo.contractCount > 0 ? tierInfo.contractCount : '—'}
            </div>
          </div>
        </div>

        {/* Progress */}
        {tierInfo.progress.nextTier && (
          <div className="bg-white/5 hover:bg-white/[0.07] rounded-lg p-4 transition-all animate-scale-in" style={{ animationDelay: '0.35s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Next: {tierInfo.progress.nextTier}</span>
              <span className="text-xs font-mono text-muted-foreground">
                {tierInfo.progress.current}/{tierInfo.progress.required}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4da2ff] to-[#5cb0ff] transition-all duration-500 animate-shimmer"
                style={{ width: `${tierInfo.progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {tierInfo.level === 0 && '💡 Make 25 tx OR deploy 3 contracts'}
              {tierInfo.level === 1 && '💡 Reach 100 tx OR deploy 10 contracts'}
              {tierInfo.level === 2 && '💡 500+ tx + major contributions'}
            </p>
          </div>
        )}

        {/* Packages List */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">Deployed Packages</h3>
              <span className="text-xs px-2 py-0.5 bg-[#4da2ff]/20 text-[#4da2ff] rounded animate-pulse">
                {getActiveNetwork()}
              </span>
            </div>
            {isLoadingPackages && <Spinner size="sm" />}
          </div>

          {packages.length > 0 ? (
            <div className="space-y-2">
              {packages.map((pkg, index) => (
                <a
                  key={pkg.id}
                  href={getExplorerUrl(pkg.package)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/5 hover:bg-white/[0.07] hover:scale-[1.02] rounded-lg p-3 transition-all cursor-pointer group flex items-center justify-between animate-scale-in"
                  style={{ animationDelay: `${0.45 + index * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl">📦</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm group-hover:text-[#4da2ff] transition-colors truncate">
                        Package {shortenPackageId(pkg.package)}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        UpgradeCap: {shortenPackageId(pkg.id)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded">
                      v{pkg.version}
                    </span>
                    <span className="text-xs opacity-50">🔗</span>
                  </div>
                </a>
              ))}
            </div>
          ) : isLoadingPackages ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Loading packages...
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No packages deployed yet
              <div className="text-xs mt-1">Deploy a Move package to see it here</div>
            </div>
          )}
        </div>

        {/* NFT Card teaser - compact */}
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-3xl mb-1">🎴</div>
          <p className="text-xs text-muted-foreground">NFT Cards coming soon</p>
        </div>
      </div>
    </div>
  );
}
